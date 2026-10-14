// Copyright 2026 Connecting Solution & Applications Ltd under the Apache License, Version 2.0.

import { bytesToHexString } from 'gdc-common-utils-ts/utils/base-convert';
import { SHA3_256_MULTIHASH_PROFILE } from 'gdc-common-utils-ts/utils/multiformat-profile';
import { computeDammCheckDigit } from 'gdc-common-utils-ts/utils/unified-health-id';

export type SubjectSpeciesId7 = string;
export type SubjectCardNumber21 = string;
export type SubjectCardIndexCanonicalNumericId27 = string;
export type SubjectCardIndexAssetId = string;

/** Canonical NCBI Taxonomy identifier for Homo sapiens. */
export const HUMAN_NCBI_TAXONOMY_ID = '9606' as const;

/** Seven-digit taxonomy projection used implicitly for human-card ledger keys. */
export const HUMAN_SPECIES_ID7 = '0009606' as const satisfies SubjectSpeciesId7;

/**
 * Projects a positive NCBI Taxonomy identifier to exactly seven decimal digits.
 *
 * This helper is product-neutral and therefore accepts Homo sapiens. A
 * veterinary caller remains responsible for rejecting `9606` as an animal.
 */
export function normalizeSubjectSpeciesId7(ncbiTaxonomyId: string): SubjectSpeciesId7 {
  const source = String(ncbiTaxonomyId || '').trim();
  if (!/^\d{1,7}$/.test(source)) {
    throw new TypeError('NCBI Taxonomy identifier must contain at most seven digits.');
  }
  const normalized = source.replace(/^0+/, '') || '0';
  if (normalized === '0') {
    throw new TypeError('NCBI Taxonomy identifier must be positive.');
  }
  return normalized.padStart(7, '0');
}

/**
 * Builds the common 27-digit lookup preimage for a validated 21-digit card.
 *
 * The visible Damm digit is excluded because it detects transcription errors
 * rather than contributing identity material. Species remains outside the
 * printed number but prevents equal card payloads for different species from
 * sharing one ledger key. Human callers pass `9606` (normally via the fixed
 * `HUMAN_NCBI_TAXONOMY_ID` constant); they never ask a person for a species.
 */
export function buildSubjectCardIndexCanonicalNumericId27(input: Readonly<{
  ncbiTaxonomyId: string;
  cardNumber21: string;
}>): SubjectCardIndexCanonicalNumericId27 {
  const speciesId7 = normalizeSubjectSpeciesId7(input.ncbiTaxonomyId);
  const cardNumber21 = normalizeCardNumber21(input.cardNumber21);
  return `${speciesId7}${cardNumber21.slice(0, 20)}`;
}

/**
 * Returns lowercase hexadecimal SHA3-256 of the ASCII 27-digit preimage.
 *
 * Only this opaque digest crosses the blockchain boundary. The card number,
 * taxonomy identifier and canonical preimage must not be written to the
 * ledger. Resolving the digest locates an index provider; it grants no access.
 */
export async function buildSubjectCardIndexAssetId(input: Readonly<{
  ncbiTaxonomyId: string;
  cardNumber21: string;
}>): Promise<SubjectCardIndexAssetId> {
  const canonicalNumericId27 = buildSubjectCardIndexCanonicalNumericId27(input);
  const digest = SHA3_256_MULTIHASH_PROFILE.digest(new TextEncoder().encode(canonicalNumericId27));
  return bytesToHexString(digest);
}

/** Validates the exact lowercase SHA3-256 hexadecimal ledger-key profile. */
export function isSubjectCardIndexAssetId(value: string): value is SubjectCardIndexAssetId {
  return /^[a-f0-9]{64}$/.test(String(value || ''));
}

function normalizeCardNumber21(value: string): SubjectCardNumber21 {
  const source = String(value || '').trim();
  if (!source || !/^[0-9 -]+$/.test(source)) {
    throw new TypeError('cardNumber21 must contain only decimal digits, spaces or hyphens.');
  }
  const digits = source.replace(/[ -]/g, '');
  if (!/^\d{21}$/.test(digits)) {
    throw new TypeError('cardNumber21 must contain exactly 21 digits.');
  }
  if (computeDammCheckDigit(digits.slice(0, 20)) !== digits.slice(20)) {
    throw new TypeError('cardNumber21 has an invalid Damm check digit.');
  }
  return digits;
}
