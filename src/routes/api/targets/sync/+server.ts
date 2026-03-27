import { json, type RequestHandler } from '@sveltejs/kit';
import { storeAllowedTargets, clearAllowedTargets } from '$lib/server/target-session';
import { assertProxySafeUrl } from '$lib/server/url-policy';
import { normalizeServerUrl } from '$lib/shared/url';
import type { SyncTarget } from '$lib/types';

const MAX_TARGETS = 40;

function toCleanTarget(input: unknown): SyncTarget {
	if (typeof input !== 'object' || input === null) {
		throw new Error('Each target must be an object.');
	}

	const item = input as Record<string, unknown>;
	if (typeof item.id !== 'string' || item.id.length < 1 || item.id.length > 128) {
		throw new Error('Target id is invalid.');
	}

	const baseUrl = normalizeServerUrl(String(item.baseUrl ?? ''));
	const healthcheckUrl = item.healthcheckUrl
		? normalizeServerUrl(String(item.healthcheckUrl))
		: undefined;

	return {
		id: item.id,
		baseUrl,
		healthcheckUrl
	};
}

export const POST: RequestHandler = async ({ request, cookies }) => {
	let payload: unknown;
	try {
		payload = await request.json();
	} catch {
		return json({ message: 'Invalid JSON payload.' }, { status: 400 });
	}

	if (
		typeof payload !== 'object' ||
		payload === null ||
		!Array.isArray((payload as { targets?: unknown[] }).targets)
	) {
		return json({ message: 'Payload must include targets array.' }, { status: 400 });
	}

	const incomingTargets = (payload as { targets: unknown[] }).targets;
	if (incomingTargets.length > MAX_TARGETS) {
		return json({ message: `Too many targets. Max ${MAX_TARGETS}.` }, { status: 400 });
	}

	if (incomingTargets.length === 0) {
		clearAllowedTargets(cookies);
		return json({ count: 0 });
	}

	const dedupedById = new Map<string, SyncTarget>();
	try {
		for (const target of incomingTargets) {
			const clean = toCleanTarget(target);
			await assertProxySafeUrl(clean.baseUrl);

			if (clean.healthcheckUrl) {
				await assertProxySafeUrl(clean.healthcheckUrl);
			}

			dedupedById.set(clean.id, clean);
		}
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Target validation failed.';
		return json({ message }, { status: 400 });
	}

	storeAllowedTargets(cookies, [...dedupedById.values()]);

	return json({ count: dedupedById.size });
};
