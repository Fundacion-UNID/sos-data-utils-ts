// Flow contract: one validated envelope persists one opaque ciphertext plus one independently protected content-key entry for every authorized text or audio recipient.
import assert from 'node:assert/strict';
import test from 'node:test';

import {
  SecureMessageContentEncryptionAlgorithm,
  SecureMessageEnvelopeProfile,
  SecureMessageKeyManagementAlgorithm,
  assertSecureMessageEnvelope,
} from '../dist/secure-message-envelope.js';

const PROTECTED_HEADER = 'eyJjdHkiOiJhdWRpby9vZ2cifQ';
const SYNTHETIC_WRAPPED_KEY = Buffer.from('{"v":"gdc-mlkem-cek-wrap-v1"}').toString('base64url');
const RECIPIENT = Object.freeze({
  header: Object.freeze({
    alg: SecureMessageKeyManagementAlgorithm.MlKem768HkdfSha256A256GcmKw,
    kid: 'urn:example:key:telephone',
  }),
  encrypted_key: SYNTHETIC_WRAPPED_KEY,
});
const ENVELOPE = Object.freeze({
  profile: SecureMessageEnvelopeProfile.MultirecipientMlKemV1,
  protected: PROTECTED_HEADER,
  recipients: Object.freeze([RECIPIENT]),
  iv: 'AAECAwQFBgcICQoL',
  ciphertext: 'AQIDBA',
  tag: 'AAECAwQFBgcICQoLDA0ODw',
});

test('accepts the same general JWE envelope for text and audio ciphertext', () => {
  assert.equal(SecureMessageContentEncryptionAlgorithm.A256GCM, 'A256GCM');
  assert.doesNotThrow(() => assertSecureMessageEnvelope(ENVELOPE));
  assert.doesNotThrow(() => assertSecureMessageEnvelope({
    ...ENVELOPE,
    recipients: [
      RECIPIENT,
      {
        header: {
          alg: SecureMessageKeyManagementAlgorithm.MlKem768HkdfSha256A256GcmKw,
          kid: 'urn:example:key:web',
        },
        encrypted_key: SYNTHETIC_WRAPPED_KEY,
      },
    ],
  }));
});

test('rejects empty, duplicate or malformed recipient entries', () => {
  assert.throws(
    () => assertSecureMessageEnvelope({ ...ENVELOPE, recipients: [] }),
    /secure_message_recipients_required/,
  );
  assert.throws(
    () => assertSecureMessageEnvelope({ ...ENVELOPE, recipients: [RECIPIENT, RECIPIENT] }),
    /secure_message_recipient_duplicate/,
  );
  assert.throws(
    () => assertSecureMessageEnvelope({ ...ENVELOPE, ciphertext: 'not base64url!' }),
    /secure_message_envelope_invalid/,
  );
});
