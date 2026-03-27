const HTTP_PROTOCOLS = new Set(['http:', 'https:']);

export function normalizeServerUrl(input: string): string {
	const trimmed = input.trim();
	if (!trimmed) {
		throw new Error('URL is required.');
	}

	let parsed: URL;
	try {
		parsed = new URL(trimmed);
	} catch {
		throw new Error('Enter a valid URL.');
	}

	if (!HTTP_PROTOCOLS.has(parsed.protocol)) {
		throw new Error('Only http:// and https:// URLs are allowed.');
	}

	if (!parsed.hostname) {
		throw new Error('URL hostname is required.');
	}

	if (parsed.username || parsed.password) {
		throw new Error('URLs with embedded credentials are not allowed.');
	}

	parsed.hash = '';
	parsed.search = '';
	parsed.protocol = parsed.protocol.toLowerCase();
	parsed.hostname = parsed.hostname.toLowerCase();

	if (
		(parsed.protocol === 'http:' && parsed.port === '80') ||
		(parsed.protocol === 'https:' && parsed.port === '443')
	) {
		parsed.port = '';
	}

	const path = parsed.pathname.replace(/\/+/g, '/');
	parsed.pathname = path === '/' ? '/' : path.replace(/\/$/, '');

	return parsed.toString().replace(/\/$/, parsed.pathname === '/' ? '/' : '');
}

export function isHttpUrl(value: string): boolean {
	try {
		const parsed = new URL(value);
		return HTTP_PROTOCOLS.has(parsed.protocol);
	} catch {
		return false;
	}
}
