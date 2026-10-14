export type ProfessionalAccessGrantStatus = 'active' | 'inactive';

export type ProfessionalAccessGrant = Readonly<{
  status: ProfessionalAccessGrantStatus;
  roles: readonly string[];
  jurisdictions: readonly string[];
  expiresAt?: string;
}>;

export type ProfessionalAccessRequest = Readonly<{
  role: string;
  jurisdiction: string;
  now?: string;
}>;

export type ProfessionalAccessDecision = Readonly<{
  authorized: boolean;
  reason:
    | 'authorized'
    | 'grant_inactive'
    | 'grant_expired'
    | 'role_not_granted'
    | 'jurisdiction_not_granted';
}>;

const ISO_3166_1_ALPHA_2 = /^[A-Z]{2}$/;
const ISO_3166_2 = /^[A-Z]{2}-[A-Z0-9]{1,3}$/;

/**
 * Evaluates the hierarchical ISO jurisdiction boundary used by professional
 * permissions. An ISO 3166-1 country covers itself and all its ISO 3166-2
 * subdivisions. A subdivision covers only itself.
 */
export function jurisdictionGrantCovers(granted: string, requested: string): boolean {
  const grant = normalizeJurisdiction(granted);
  const target = normalizeJurisdiction(requested);
  if (!grant || !target) return false;
  if (grant === target) return true;
  return ISO_3166_1_ALPHA_2.test(grant) && target.startsWith(`${grant}-`);
}

/**
 * Applies status, expiry, role and jurisdiction gates in fail-closed order.
 * Product SDKs may add subject, action, purpose and attestation constraints,
 * but must not weaken this common role/jurisdiction decision.
 */
export function evaluateProfessionalAccess(
  grant: ProfessionalAccessGrant,
  request: ProfessionalAccessRequest,
): ProfessionalAccessDecision {
  if (grant.status !== 'active') return denied('grant_inactive');

  if (grant.expiresAt) {
    const expiresAt = Date.parse(grant.expiresAt);
    const now = Date.parse(request.now ?? new Date().toISOString());
    if (!Number.isFinite(expiresAt) || !Number.isFinite(now) || now >= expiresAt) {
      return denied('grant_expired');
    }
  }

  const requestedRole = normalizeRole(request.role);
  const roleGranted = requestedRole.length > 0
    && grant.roles.some((role) => normalizeRole(role) === requestedRole);
  if (!roleGranted) return denied('role_not_granted');

  const jurisdictionGranted = grant.jurisdictions.some((jurisdiction) =>
    jurisdictionGrantCovers(jurisdiction, request.jurisdiction));
  if (!jurisdictionGranted) return denied('jurisdiction_not_granted');

  return Object.freeze({ authorized: true, reason: 'authorized' });
}

function normalizeJurisdiction(value: string): string | undefined {
  const normalized = String(value ?? '').trim().toUpperCase();
  return ISO_3166_1_ALPHA_2.test(normalized) || ISO_3166_2.test(normalized)
    ? normalized
    : undefined;
}

function normalizeRole(value: string): string {
  return String(value ?? '').trim().toLowerCase();
}

function denied(reason: Exclude<ProfessionalAccessDecision['reason'], 'authorized'>): ProfessionalAccessDecision {
  return Object.freeze({ authorized: false, reason });
}
// Copyright 2026 ConnectHealth.info (Connecting Solution & Applications Ltd.) under the Apache License, Version 2.0.
