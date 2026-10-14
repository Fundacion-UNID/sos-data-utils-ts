// Copyright 2026 Connecting Solution & Applications Ltd under the Apache License, Version 2.0.
// Flow contract: never use duplicated literals; reuse canonical test data and standard coding systems and values exported by their owning fhir-data-utils, gdc-common-utils, sos-data-utils, or vet-data-utils package.
// Flow contract: every channel derives the same versioned HMAC lookup message from one normalized email or telephone without exposing the contact or narrowing discovery to one organization.
import assert from 'node:assert/strict';
import test from 'node:test';

import {
  ProfileIndexContactKind,
  ProfileIndexLookupAlgorithm,
  buildConfidentialProfileIndexLookupMessage,
  normalizeProfileIndexContact,
  validateConfidentialProfileIndexLocator,
} from '../dist/confidential-profile-index.js';
import { REPOSITORY_SAFE_EXAMPLES } from '../dist/repository-privacy.js';

const directoryScope = 'test-profile-directory';
const hmacSha256Digest = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';

test('normalizes email and telephone contacts identically for every channel', () => {
  const canonicalTelephone = REPOSITORY_SAFE_EXAMPLES.phoneE164;
  const displayTelephone = ` +${canonicalTelephone.slice(1, 2)} (${canonicalTelephone.slice(2, 5)}) ${canonicalTelephone.slice(5, 8)}-${canonicalTelephone.slice(8)} `;

  assert.equal(
    normalizeProfileIndexContact(ProfileIndexContactKind.Email, '  MEMBER@EXAMPLE.TEST  '),
    'member@example.test',
  );
  assert.equal(
    normalizeProfileIndexContact(ProfileIndexContactKind.Telephone, displayTelephone),
    canonicalTelephone,
  );
});

test('builds a tenant-independent canonical message for a versioned HMAC locator', () => {
  const message = buildConfidentialProfileIndexLookupMessage({
    directoryScope,
    contactKind: ProfileIndexContactKind.Email,
    contact: 'MEMBER@EXAMPLE.TEST',
  });

  assert.equal(
    message,
    '{"profile":"confidential-profile-index","version":1,"directoryScope":"test-profile-directory","contactKind":"email","contact":"member@example.test"}',
  );
  assert.equal(message.includes('tenant'), false);
});

test('accepts only a versioned base64url HMAC-SHA-256 locator', () => {
  assert.deepEqual(validateConfidentialProfileIndexLocator({
    algorithm: ProfileIndexLookupAlgorithm.HmacSha256,
    keyVersion: 'v1',
    digest: hmacSha256Digest,
  }), {
    algorithm: ProfileIndexLookupAlgorithm.HmacSha256,
    keyVersion: 'v1',
    digest: hmacSha256Digest,
  });

  assert.throws(
    () => validateConfidentialProfileIndexLocator({
      algorithm: 'sha256-salted',
      keyVersion: 'v1',
      digest: hmacSha256Digest,
    }),
    /HMAC-SHA-256/,
  );
});

test('rejects ambiguous or non-canonical contacts and empty directory scopes', () => {
  assert.throws(
    () => normalizeProfileIndexContact(ProfileIndexContactKind.Telephone, '5550100200'),
    /E\.164/,
  );
  assert.throws(
    () => buildConfidentialProfileIndexLookupMessage({
      directoryScope: ' ',
      contactKind: ProfileIndexContactKind.Email,
      contact: 'member@example.test',
    }),
    /directoryScope/,
  );
});
