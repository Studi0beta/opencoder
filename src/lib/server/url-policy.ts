import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import { env } from '$env/dynamic/private';
import { normalizeServerUrl } from '$lib/shared/url';

const IPV4_PRIVATE_RANGES = [
	['10.0.0.0', 8],
	['172.16.0.0', 12],
	['192.168.0.0', 16],
	['127.0.0.0', 8],
	['169.254.0.0', 16],
	['100.64.0.0', 10],
	['0.0.0.0', 8]
] as const;

function ipv4ToInt(value: string): number {
	return (
		value
			.split('.')
			.map(Number)
			.reduce((acc, octet) => (acc << 8) + octet, 0) >>> 0
	);
}

function isPrivateIpv4(value: string): boolean {
	const ipInt = ipv4ToInt(value);

	return IPV4_PRIVATE_RANGES.some(([baseIp, prefix]) => {
		const mask = (~0 << (32 - prefix)) >>> 0;
		return (ipInt & mask) === (ipv4ToInt(baseIp) & mask);
	});
}

function isPrivateIpv6(value: string): boolean {
	const normalized = value.toLowerCase();
	return (
		normalized === '::1' ||
		normalized.startsWith('fc') ||
		normalized.startsWith('fd') ||
		normalized.startsWith('fe80:')
	);
}

function isPrivateAddress(ipAddress: string): boolean {
	const version = isIP(ipAddress);
	if (version === 4) {
		return isPrivateIpv4(ipAddress);
	}
	if (version === 6) {
		return isPrivateIpv6(ipAddress);
	}

	return true;
}

function privateNetworkTargetsAllowed(): boolean {
	return env.ALLOW_PRIVATE_NETWORK_TARGETS === 'true';
}

export async function assertProxySafeUrl(input: string): Promise<string> {
	const normalized = normalizeServerUrl(input);
	const parsed = new URL(normalized);

	if (parsed.hostname === 'localhost') {
		if (!privateNetworkTargetsAllowed()) {
			throw new Error('localhost is blocked by proxy policy.');
		}
		return normalized;
	}

	const hostnameIpVersion = isIP(parsed.hostname);
	if (hostnameIpVersion > 0) {
		if (isPrivateAddress(parsed.hostname) && !privateNetworkTargetsAllowed()) {
			throw new Error('Private network targets are blocked by proxy policy.');
		}
		return normalized;
	}

	const resolvedRecords = await lookup(parsed.hostname, { all: true, verbatim: true });
	if (resolvedRecords.length === 0) {
		throw new Error('Could not resolve target hostname.');
	}

	if (
		!privateNetworkTargetsAllowed() &&
		resolvedRecords.some((record) => isPrivateAddress(record.address))
	) {
		throw new Error('Hostname resolves to a private or loopback address and is blocked.');
	}

	return normalized;
}
