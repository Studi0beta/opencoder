import type { OpencodeServer, ServerInput } from '$lib/types';

interface ImportEnvelope {
	servers: ServerInput[];
}

function toServerInput(value: unknown, index: number): ServerInput {
	if (typeof value !== 'object' || value === null) {
		throw new Error(`Entry ${index + 1} must be an object.`);
	}

	const entry = value as Record<string, unknown>;
	const name = String(entry.name ?? '').trim();
	const baseUrl = String(entry.baseUrl ?? '').trim();

	if (!name) {
		throw new Error(`Entry ${index + 1} is missing name.`);
	}

	if (!baseUrl) {
		throw new Error(`Entry ${index + 1} is missing baseUrl.`);
	}

	return {
		name,
		baseUrl,
		description: entry.description ? String(entry.description) : undefined,
		healthcheckUrl: entry.healthcheckUrl ? String(entry.healthcheckUrl) : undefined
	};
}

export function buildServerExport(servers: OpencodeServer[]): string {
	const payload: ImportEnvelope & { version: number; exportedAt: string } = {
		version: 1,
		exportedAt: new Date().toISOString(),
		servers: servers.map((server) => ({
			name: server.name,
			baseUrl: server.baseUrl,
			description: server.description,
			healthcheckUrl: server.healthcheckUrl
		}))
	};

	return JSON.stringify(payload, null, 2);
}

export function parseServerImport(raw: string): ServerInput[] {
	let parsed: unknown;
	try {
		parsed = JSON.parse(raw);
	} catch {
		throw new Error('Import file is not valid JSON.');
	}

	const candidate = Array.isArray(parsed)
		? parsed
		: typeof parsed === 'object' &&
			  parsed !== null &&
			  Array.isArray((parsed as ImportEnvelope).servers)
			? (parsed as ImportEnvelope).servers
			: null;

	if (!candidate) {
		throw new Error('Import JSON must be an array or an object with a servers array.');
	}

	return candidate.map((item, index) => toServerInput(item, index));
}
