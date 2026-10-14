/** Capability-first route roots shared by SOS, human-health and animal BFFs. */
export const SharedBffApiRoutes = Object.freeze({
  assistant: '/api/assistant',
  internal: '/api/internal',
} as const);

const PUBLIC_ROUTE_ROOTS = Object.freeze([
  SharedBffApiRoutes.assistant,
] as const);

/**
 * Validates one public BFF pathname against the shared capability surface.
 * Product and sector names belong in the deploying adapter, never in the URL.
 */
export function assertSharedPublicBffRoute(pathname: string): string {
  const route = normalizedPathname(pathname);
  if (!PUBLIC_ROUTE_ROOTS.some((root) => route === root || route.startsWith(`${root}/`))) {
    throw new Error('shared_public_bff_route_required');
  }
  return route;
}

/** Returns true only for the explicitly non-public service-to-service surface. */
export function isSharedInternalBffRoute(pathname: string): boolean {
  const route = normalizedPathname(pathname);
  const root = SharedBffApiRoutes.internal;
  return route === root || route.startsWith(`${root}/`);
}

function normalizedPathname(value: string): string {
  const route = String(value || '').trim();
  if (!route.startsWith('/') || route.includes('?') || route.includes('#')) {
    throw new Error('shared_public_bff_route_required');
  }
  return route.length > 1 ? route.replace(/\/+$/, '') : route;
}
