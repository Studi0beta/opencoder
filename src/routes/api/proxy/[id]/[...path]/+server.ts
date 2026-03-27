import { dev } from '$app/environment';
import { error, type RequestHandler } from '@sveltejs/kit';
import { loadRegistryState } from '$lib/server/app-state-store';

const REQUEST_TIMEOUT_MS = 15000;
const MAX_REQUEST_BODY_BYTES = 1024 * 1024 * 2;

const FORWARDED_REQUEST_HEADERS = [
	'accept',
	'accept-language',
	'cache-control',
	'pragma',
	'content-type',
	'origin',
	'referer',
	'if-none-match',
	'if-modified-since',
	'x-requested-with',
	'sec-fetch-mode',
	'sec-fetch-site',
	'sec-fetch-dest',
	'cookie',
	'user-agent'
];

const RESPONSE_HEADER_ALLOWLIST = [
	'content-type',
	'cache-control',
	'etag',
	'last-modified',
	'expires',
	'vary',
	'location'
];

function sanitizeSetCookie(setCookie: string, id: string): string {
	const pieces = setCookie.split(';').map((piece) => piece.trim());
	if (pieces.length === 0) {
		return setCookie;
	}

	const filteredAttributes = pieces.slice(1).filter((part) => {
		const lower = part.toLowerCase();
		return !lower.startsWith('domain=') && !lower.startsWith('path=') && lower !== 'secure';
	});

	const scopedPath = `Path=/api/proxy/${id}/`;
	const secure = dev ? [] : ['Secure'];
	const sameSite = filteredAttributes.some((value) => value.toLowerCase().startsWith('samesite='))
		? []
		: ['SameSite=Lax'];

	return [pieces[0], scopedPath, ...filteredAttributes, ...sameSite, ...secure].join('; ');
}

function rewriteHtmlDocument(html: string, id: string): string {
	const proxyPrefix = `/api/proxy/${id}`;
	const withBaseTag = html.includes('<head')
		? html.replace(/<head([^>]*)>/i, `<head$1><base href="${proxyPrefix}/">`)
		: `<base href="${proxyPrefix}/">${html}`;

	return withBaseTag
		.replace(/\shttp-equiv=("|')content-security-policy\1[^>]*>/gi, '>')
		.replace(/\b(href|src|action)=("|')\/(?!\/)/gi, `$1=$2${proxyPrefix}/`)
		.replace(/url\(\//gi, `url(${proxyPrefix}/`);
}

function buildUpstreamUrl(baseUrl: string, path: string, search: string): URL {
	const base = new URL(baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`);
	const cleanedPath = path.replace(/^\//, '');
	const url = new URL(cleanedPath, base);
	url.search = search;
	return url;
}

function copyAllowedRequestHeaders(request: Request): Headers {
	const headers = new Headers();
	for (const name of FORWARDED_REQUEST_HEADERS) {
		const value = request.headers.get(name);
		if (value) {
			headers.set(name, value);
		}
	}
	return headers;
}

function isWebSocketUpgradeRequest(request: Request): boolean {
	const upgrade = request.headers.get('upgrade')?.toLowerCase();
	const connection = request.headers.get('connection')?.toLowerCase() ?? '';
	return upgrade === 'websocket' || connection.includes('upgrade');
}

async function proxyRequest(event: Parameters<RequestHandler>[0]): Promise<Response> {
	const { params, request, url, fetch } = event;

	if (isWebSocketUpgradeRequest(request)) {
		return new Response(
			JSON.stringify({
				message:
					'WebSocket upgrades are not supported by this HTTP proxy route. Use direct embedding or open the target in a new tab for realtime features.'
			}),
			{
				status: 426,
				headers: {
					'content-type': 'application/json; charset=utf-8',
					'x-opencode-hub-proxy': '1'
				}
			}
		);
	}

	const target = (await loadRegistryState()).servers.find((item) => item.id === params.id);
	if (!target) {
		throw error(404, 'Unknown target id.');
	}

	const upstreamUrl = buildUpstreamUrl(target.baseUrl, params.path ?? '', url.search);
	const method = request.method.toUpperCase();
	const allowsBody = !['GET', 'HEAD'].includes(method);

	let body: BodyInit | undefined;
	if (allowsBody) {
		const requestBody = await request.arrayBuffer();
		if (requestBody.byteLength > MAX_REQUEST_BODY_BYTES) {
			throw error(413, `Request body exceeds ${MAX_REQUEST_BODY_BYTES} bytes.`);
		}
		body = requestBody;
	}

	let upstreamResponse: Response;
	try {
		upstreamResponse = await fetch(upstreamUrl, {
			method,
			headers: copyAllowedRequestHeaders(request),
			body,
			redirect: 'manual',
			signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
		});
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Proxy upstream request failed.';
		const timeoutLike = message.toLowerCase().includes('timeout');
		throw error(timeoutLike ? 504 : 502, message);
	}

	const responseHeaders = new Headers();
	for (const [name, value] of upstreamResponse.headers.entries()) {
		const lowerName = name.toLowerCase();
		if (!RESPONSE_HEADER_ALLOWLIST.includes(lowerName)) {
			continue;
		}

		if (lowerName === 'location') {
			const redirectUrl = new URL(value, upstreamUrl);
			if (redirectUrl.origin !== new URL(target.baseUrl).origin) {
				continue;
			}
			responseHeaders.set(
				'location',
				`/api/proxy/${target.id}${redirectUrl.pathname}${redirectUrl.search}`
			);
			continue;
		}

		responseHeaders.set(name, value);
	}

	const setCookieValues =
		(upstreamResponse.headers as Headers & { getSetCookie?: () => string[] }).getSetCookie?.() ??
		[];
	for (const value of setCookieValues) {
		responseHeaders.append('set-cookie', sanitizeSetCookie(value, target.id));
	}

	responseHeaders.set('x-content-type-options', 'nosniff');
	responseHeaders.set('x-opencode-hub-proxy', '1');
	responseHeaders.delete('x-frame-options');
	responseHeaders.delete('content-security-policy');
	responseHeaders.delete('content-length');

	const contentType = upstreamResponse.headers.get('content-type') ?? '';
	if (contentType.includes('text/html')) {
		const html = await upstreamResponse.text();
		const rewritten = rewriteHtmlDocument(html, target.id);
		return new Response(rewritten, {
			status: upstreamResponse.status,
			statusText: upstreamResponse.statusText,
			headers: responseHeaders
		});
	}

	return new Response(upstreamResponse.body, {
		status: upstreamResponse.status,
		statusText: upstreamResponse.statusText,
		headers: responseHeaders
	});
}

export const GET: RequestHandler = proxyRequest;
export const HEAD: RequestHandler = proxyRequest;
export const POST: RequestHandler = proxyRequest;
export const PUT: RequestHandler = proxyRequest;
export const PATCH: RequestHandler = proxyRequest;
export const DELETE: RequestHandler = proxyRequest;
