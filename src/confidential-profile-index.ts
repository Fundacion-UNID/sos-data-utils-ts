// Copyright 2026 Connecting Solution & Applications Ltd under the Apache License, Version 2.0.

export const ConfidentialProfileIndexProfile = 'confidential-profile-index' as const;
export const ConfidentialProfileIndexVersion = 1 as const;

export const ProfileIndexContactKind = {
  Email: 'email',
  Telephone: 'telephone',
} as const;

export type ProfileIndexContactKind = typeof ProfileIndexContactKind[keyof typeof ProfileIndexContactKind];

export const ProfileIndexLookupAlgorithm = {
  HmacSha256: 'HMAC-SHA-256',
} as const;

export type ProfileIndexLookupAlgorithm = typeof ProfileIndexLookupAlgorithm[keyof typeof ProfileIndexLookupAlgorithm];

export interface ConfidentialProfileIndexLookupInput {
  readonly directoryScope: string;
  readonly contactKind: ProfileIndexContactKind;
  readonly contact: string;
}

export interface ConfidentialProfileIndexLocator {
  readonly algorithm: typeof ProfileIndexLookupAlgorithm.HmacSha256;
  readonly keyVersion: string;
  readonly digest: string;
}

function requiredValue(value: unknown, label: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new TypeError(`${label} is required.`);
  }
  return value.trim();
}

export function normalizeProfileIndexContact(
  contactKind: ProfileIndexContactKind,
  contact: string,
): string {
  const value = requiredValue(contact, 'contact');
  if (contactKind === ProfileIndexContactKind.Email) {
    const normalized = value.toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
      throw new TypeError('The profile-index email must be valid.');
    }
    return normalized;
  }
  if (contactKind === ProfileIndexContactKind.Telephone) {
    const normalized = value.replace(/[\s().-]/g, '');
    if (!/^\+[1-9]\d{7,14}$/.test(normalized)) {
      throw new TypeError('The profile-index telephone must use E.164 format.');
    }
    return normalized;
  }
  throw new TypeError('The profile-index contact kind is not supported.');
}

export function buildConfidentialProfileIndexLookupMessage(
  input: ConfidentialProfileIndexLookupInput,
): string {
  const directoryScope = requiredValue(input.directoryScope, 'directoryScope');
  const contact = normalizeProfileIndexContact(input.contactKind, input.contact);
  return JSON.stringify({
    profile: ConfidentialProfileIndexProfile,
    version: ConfidentialProfileIndexVersion,
    directoryScope,
    contactKind: input.contactKind,
    contact,
  });
}

export function validateConfidentialProfileIndexLocator(
  value: unknown,
): ConfidentialProfileIndexLocator {
  if (!value || typeof value !== 'object') {
    throw new TypeError('A confidential profile-index locator is required.');
  }
  const locator = value as Partial<ConfidentialProfileIndexLocator>;
  if (locator.algorithm !== ProfileIndexLookupAlgorithm.HmacSha256) {
    throw new TypeError('The profile-index locator must use HMAC-SHA-256.');
  }
  const keyVersion = requiredValue(locator.keyVersion, 'keyVersion');
  const digest = requiredValue(locator.digest, 'digest');
  if (!/^[A-Za-z0-9_-]{43}$/.test(digest)) {
    throw new TypeError('The profile-index HMAC-SHA-256 digest must be base64url encoded.');
  }
  return { algorithm: locator.algorithm, keyVersion, digest };
}
