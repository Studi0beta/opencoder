export type HealthState = 'unknown' | 'online' | 'offline' | 'degraded';

export type EmbedMode = 'direct' | 'proxy' | 'fallback';

export interface OpencodeServer {
	id: string;
	name: string;
	baseUrl: string;
	description?: string;
	healthcheckUrl?: string;
	createdAt: string;
	updatedAt: string;
}

export interface ServerInput {
	name: string;
	baseUrl: string;
	description?: string;
	healthcheckUrl?: string;
}

export interface ServerHealth {
	state: HealthState;
	message: string;
	lastCheckedAt: string;
	directEmbeddable: boolean;
	recommendedMode: Exclude<EmbedMode, 'fallback'>;
	latencyMs?: number;
}

export interface PersistedState {
	servers: OpencodeServer[];
	selectedServerId: string | null;
}

export interface SyncTarget {
	id: string;
	baseUrl: string;
	healthcheckUrl?: string;
}
