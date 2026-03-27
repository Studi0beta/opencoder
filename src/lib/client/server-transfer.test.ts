import { describe, expect, it } from 'vitest';
import { buildServerExport, parseServerImport } from '$lib/client/server-transfer';

describe('server-transfer', () => {
	it('parses envelope import payload', () => {
		const parsed = parseServerImport(
			JSON.stringify({
				servers: [{ name: 'Primary', baseUrl: 'https://example.com' }]
			})
		);

		expect(parsed).toHaveLength(1);
		expect(parsed[0]?.name).toBe('Primary');
	});

	it('exports in stable envelope format', () => {
		const content = buildServerExport([
			{
				id: 'abc',
				name: 'Primary',
				baseUrl: 'https://example.com',
				createdAt: '2024-01-01T00:00:00.000Z',
				updatedAt: '2024-01-01T00:00:00.000Z'
			}
		]);

		expect(content).toContain('"version": 1');
		expect(content).toContain('"name": "Primary"');
	});
});
