import { createHmac, timingSafeEqual } from 'node:crypto';
import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';
import type { Cookies } from '@sveltejs/kit';
import type { SyncTarget } from '$lib/types';

const TARGETS_COOKIE = 'opencode_hub_targets';
const TARGETS_SIG_COOKIE = 'opencode_hub_targets_sig';
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 8;

function getSigningSecret(): string {
	const secret = env.OPENCODE_HUB_PROXY_SECRET;
	if (secret && secret.length >= 16) {
		return secret;
	}

	if (!dev) {
		throw new Error(
			'OPENCODE_HUB_PROXY_SECRET must be set in production and at least 16 characters long.'
		);
	}

	return 'opencode-hub-dev-secret-not-for-production';
}

function signPayload(value: string): string {
	return createHmac('sha256', getSigningSecret()).update(value).digest('hex');
}

function readSignedPayload(cookies: Cookies): string | null {
	const payload = cookies.get(TARGETS_COOKIE);
	const signature = cookies.get(TARGETS_SIG_COOKIE);

	if (!payload || !signature) {
		return null;
	}

	const computed = signPayload(payload);
	const incoming = Buffer.from(signature, 'utf-8');
	const expected = Buffer.from(computed, 'utf-8');

	if (incoming.length !== expected.length || !timingSafeEqual(incoming, expected)) {
		return null;
	}

	return payload;
}

export function storeAllowedTargets(cookies: Cookies, targets: SyncTarget[]): void {
	const payload = Buffer.from(JSON.stringify(targets), 'utf-8').toString('base64url');
	const signature = signPayload(payload);

	cookies.set(TARGETS_COOKIE, payload, {
		httpOnly: true,
		sameSite: 'strict',
		secure: !dev,
		path: '/',
		maxAge: COOKIE_MAX_AGE_SECONDS
	});

	cookies.set(TARGETS_SIG_COOKIE, signature, {
		httpOnly: true,
		sameSite: 'strict',
		secure: !dev,
		path: '/',
		maxAge: COOKIE_MAX_AGE_SECONDS
	});
}

export function clearAllowedTargets(cookies: Cookies): void {
	cookies.delete(TARGETS_COOKIE, { path: '/' });
	cookies.delete(TARGETS_SIG_COOKIE, { path: '/' });
}

export function getAllowedTargets(cookies: Cookies): SyncTarget[] {
	const signedPayload = readSignedPayload(cookies);
	if (!signedPayload) {
		return [];
	}

	try {
		const raw = Buffer.from(signedPayload, 'base64url').toString('utf-8');
		const parsed = JSON.parse(raw);
		if (!Array.isArray(parsed)) {
			return [];
		}

		return parsed.filter((item): item is SyncTarget => {
			return (
				typeof item === 'object' &&
				item !== null &&
				typeof item.id === 'string' &&
				typeof item.baseUrl === 'string'
			);
		});
	} catch {
		return [];
	}
}
