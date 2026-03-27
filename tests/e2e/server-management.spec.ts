import { expect, test } from '@playwright/test';

const seededState = {
	servers: [
		{
			id: 'srv-1',
			name: 'Local A',
			baseUrl: 'http://127.0.0.1:4173',
			createdAt: '2026-01-01T00:00:00.000Z',
			updatedAt: '2026-01-01T00:00:00.000Z'
		},
		{
			id: 'srv-2',
			name: 'Local B',
			baseUrl: 'http://127.0.0.1:4173/?node=b',
			createdAt: '2026-01-01T00:00:00.000Z',
			updatedAt: '2026-01-01T00:00:00.000Z'
		}
	],
	selectedServerId: 'srv-1'
};

test('loads persisted servers and blocks recursive self-embedding', async ({ page }) => {
	await page.addInitScript((state) => {
		window.localStorage.setItem('opencode-hub.state.v1', JSON.stringify(state));
	}, seededState);

	await page.goto('/');
	const topbar = page.locator('header').first();

	await expect(topbar.getByRole('button', { name: 'Local A' }).first()).toBeVisible();
	await expect(topbar.getByRole('button', { name: 'Local B' }).first()).toBeVisible();
	await expect(page.getByText('Self-embedding is blocked')).toBeVisible();
});
