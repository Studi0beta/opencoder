import { describe, expect, it } from 'vitest';
import { normalizeServerUrl } from '$lib/shared/url';

describe('normalizeServerUrl', () => {
	it('normalizes host, scheme and trailing slash', () => {
		expect(normalizeServerUrl('HTTPS://Example.COM/')).toBe('https://example.com/');
	});

	it('removes default ports', () => {
		expect(normalizeServerUrl('http://example.com:80/app')).toBe('http://example.com/app');
		expect(normalizeServerUrl('https://example.com:443/app/')).toBe('https://example.com/app');
	});

	it('rejects dangerous protocols', () => {
		expect(() => normalizeServerUrl('javascript:alert(1)')).toThrowError(
			'Only http:// and https:// URLs are allowed.'
		);
	});
});
