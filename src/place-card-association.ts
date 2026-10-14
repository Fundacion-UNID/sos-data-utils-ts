// Copyright 2026 Connecting Solution & Applications Ltd under the Apache License, Version 2.0.

import { buildRawCidV1FromUtf8String } from 'gdc-common-utils-ts/utils/multiformat-profile';
import { FHIR_CLAIMS_CONTEXT } from './emergency-group.js';

export type SoschainAssociationTargetType = 'Place' | 'Vehicle';
export type SoschainAssociationRole = 'controller' | 'occupant' | 'employee' | 'guardian';

/** Flat association record stored under resource.meta.claims. */
export type SoschainPlaceCardAssociationClaims = Readonly<{
  '@context': typeof FHIR_CLAIMS_CONTEXT;
  'Basic.identifier': string;
  'Basic.code': 'soschain-card-target-association';
  'Basic.subject': string;
  'Basic.soschain-target': string;
  'Basic.soschain-target-hash': string;
  'Basic.soschain-target-type': SoschainAssociationTargetType;
  'Basic.soschain-role': SoschainAssociationRole;
  'Basic.period-start': string;
}>;

export type SoschainCanonicalTargetMatch = Readonly<{
  status: 'created' | 'existing';
  canonicalTargetId: string;
  targetType: SoschainAssociationTargetType;
}>;

/** Builds a flat, product-neutral association between a subject card and a target. */
export function buildSoschainPlaceCardAssociationClaims(input: Readonly<{
  associationId: string;
  cardId: string;
  canonicalTargetId: string;
  canonicalTargetHash: string;
  targetType: SoschainAssociationTargetType;
  role: SoschainAssociationRole;
  createdAt?: string;
}>): SoschainPlaceCardAssociationClaims {
  return {
    '@context': FHIR_CLAIMS_CONTEXT,
    'Basic.identifier': required(input.associationId, 'associationId'),
    'Basic.code': 'soschain-card-target-association',
    'Basic.subject': required(input.cardId, 'cardId'),
    'Basic.soschain-target': required(input.canonicalTargetId, 'canonicalTargetId'),
    'Basic.soschain-target-hash': required(input.canonicalTargetHash, 'canonicalTargetHash'),
    'Basic.soschain-target-type': input.targetType,
    'Basic.soschain-role': input.role,
    'Basic.period-start': input.createdAt ?? new Date().toISOString(),
  };
}

/** Public deterministic SHA3-384/CID lookup key for smart-contract deduplication. */
export function buildSoschainCanonicalTargetHash(input: Readonly<{
  targetType: SoschainAssociationTargetType;
  countryCode: string;
  canonicalValue: string;
}>): string {
  const canonical = [
    input.targetType,
    required(input.countryCode, 'countryCode').toUpperCase(),
    required(input.canonicalValue, 'canonicalValue').normalize('NFC').trim().replace(/\s+/g, ' ').toLowerCase(),
  ].join('|');
  return buildRawCidV1FromUtf8String(canonical);
}

function required(value: string, name: string): string {
  const normalized = String(value).trim();
  if (!normalized) throw new TypeError(`${name} is required.`);
  return normalized;
}
