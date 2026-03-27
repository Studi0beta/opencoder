import { describe, expect, it } from 'vitest';
import { detectDirectFramingBlock } from '$lib/server/framing-policy';

describe('detectDirectFramingBlock', () => {
	it('detects x-frame-options denial', () => {
		const headers = new Headers({ 'x-frame-options': 'DENY' });
		expect(detectDirectFramingBlock(headers).blocked).toBe(true);
	});

	it('detects csp frame ancestors restrictions', () => {
		const headers = new Headers({
			'content-security-policy': "default-src 'self'; frame-ancestors 'self'"
		});
		expect(detectDirectFramingBlock(headers).blocked).toBe(true);
	});

	it('allows missing frame restrictions', () => {
		const headers = new Headers();
		expect(detectDirectFramingBlock(headers).blocked).toBe(false);
	});
});
