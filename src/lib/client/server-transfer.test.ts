import { describe, expect, it } from 'vitest';
import { buildAppExport, parseAppImport, parseServerImport } from '$lib/client/server-transfer';

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

	it('exports full app state in stable envelope format', () => {
		const content = buildAppExport({
			registry: {
				servers: [
					{
						id: 'abc',
						name: 'Primary',
						baseUrl: 'https://example.com',
						createdAt: '2024-01-01T00:00:00.000Z',
						updatedAt: '2024-01-01T00:00:00.000Z'
					}
				],
				selectedServerId: 'abc'
			},
			theme: {
				activeThemePresetId: 'night-operator',
				activePalette: {
					background: '#0b1020',
					text: '#e5ecff',
					brand: '#22c55e'
				},
				savedPalettes: []
			}
		});

		expect(content).toContain('"version": 2');
		expect(content).toContain('"appState"');
		expect(content).toContain('"selectedServerId": "abc"');
	});

	it('parses full app state imports', () => {
		const parsed = parseAppImport(
			JSON.stringify({
				appState: {
					registry: {
						servers: [
							{
								id: 'abc',
								name: 'Primary',
								baseUrl: 'https://example.com',
								createdAt: '2024-01-01T00:00:00.000Z',
								updatedAt: '2024-01-01T00:00:00.000Z'
							}
						],
						selectedServerId: 'abc'
					},
					theme: {
						activeThemePresetId: 'night-operator',
						activePalette: {
							background: '#0b1020',
							text: '#e5ecff',
							brand: '#22c55e'
						},
						savedPalettes: []
					}
				}
			})
		);

		expect(parsed.registry.servers).toHaveLength(1);
		expect(parsed.theme.activeThemePresetId).toBe('night-operator');
	});
});
