function blocksViaXFrameOptions(value: string | null): boolean {
	if (!value) {
		return false;
	}

	const normalized = value.toLowerCase();
	return (
		normalized.includes('deny') ||
		normalized.includes('sameorigin') ||
		normalized.includes('allow-from')
	);
}

function blocksViaFrameAncestors(csp: string | null): boolean {
	if (!csp) {
		return false;
	}

	const directive = csp
		.split(';')
		.map((part) => part.trim())
		.find((part) => part.startsWith('frame-ancestors'));

	if (!directive) {
		return false;
	}

	const value = directive.replace('frame-ancestors', '').trim().toLowerCase();
	if (!value) {
		return false;
	}

	if (value.includes("'none'") || value.includes("'self'")) {
		return true;
	}

	return false;
}

export function detectDirectFramingBlock(headers: Headers): { blocked: boolean; reason: string } {
	const xfo = headers.get('x-frame-options');
	if (blocksViaXFrameOptions(xfo)) {
		return { blocked: true, reason: 'Blocked by X-Frame-Options.' };
	}

	const csp = headers.get('content-security-policy');
	if (blocksViaFrameAncestors(csp)) {
		return { blocked: true, reason: 'Blocked by CSP frame-ancestors.' };
	}

	return { blocked: false, reason: 'Direct framing appears allowed.' };
}
