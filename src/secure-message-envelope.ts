// Copyright 2026 ConnectHealth.info (Connecting Solution & Applications Ltd.) under the Apache License, Version 2.0.

/** Versioned wire profile for one ciphertext with independently protected recipient CEKs. */
export const SecureMessageEnvelopeProfile = Object.freeze({
  MultirecipientMlKemV1: 'multi-recipient-ml-kem-v1',
} as const);

/** Authenticated content encryption shared by text, audio and other binary messages. */
export const SecureMessageContentEncryptionAlgorithm = Object.freeze({
  A256GCM: 'A256GCM',
} as const);

/** ML-KEM KEM-DEM profile used by every recipient entry. */
export const SecureMessageKeyManagementAlgorithm = Object.freeze({
  MlKem768HkdfSha256A256GcmKw: 'ML-KEM-768+HKDF-SHA256+A256GCMKW',
} as const);

export type SecureMessageEnvelopeProfileValue =
  typeof SecureMessageEnvelopeProfile[keyof typeof SecureMessageEnvelopeProfile];
export type SecureMessageKeyManagementAlgorithmValue =
  typeof SecureMessageKeyManagementAlgorithm[keyof typeof SecureMessageKeyManagementAlgorithm];

/** General JWE recipient entry. `encrypted_key` contains one ML-KEM-protected copy of the shared CEK. */
export interface SecureMessageRecipient {
  readonly header: Readonly<{
    alg: SecureMessageKeyManagementAlgorithmValue;
    kid: string;
  }>;
  readonly encrypted_key: string;
}

/**
 * Runtime-neutral General JWE-compatible envelope.
 *
 * Text and audio differ only by the protected `cty`; both remain opaque bytes
 * inside the same AES-256-GCM ciphertext and recipient-wrap contract.
 */
export interface SecureMessageEnvelope {
  readonly profile: SecureMessageEnvelopeProfileValue;
  readonly protected: string;
  readonly recipients: readonly SecureMessageRecipient[];
  readonly iv: string;
  readonly ciphertext: string;
  readonly tag: string;
}

const BASE64URL = /^[A-Za-z0-9_-]+$/u;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isBase64Url = (value: unknown): value is string =>
  typeof value === 'string' && value.length > 0 && BASE64URL.test(value);

/** Validate an untrusted persisted or transported secure-message envelope. */
export const assertSecureMessageEnvelope = (value: unknown): asserts value is SecureMessageEnvelope => {
  if (!isRecord(value)
    || value.profile !== SecureMessageEnvelopeProfile.MultirecipientMlKemV1
    || !isBase64Url(value.protected)
    || !isBase64Url(value.iv)
    || !isBase64Url(value.ciphertext)
    || !isBase64Url(value.tag)) {
    throw new Error('secure_message_envelope_invalid');
  }
  if (!Array.isArray(value.recipients) || value.recipients.length === 0) {
    throw new Error('secure_message_recipients_required');
  }

  const recipientKeyIds = new Set<string>();
  for (const recipient of value.recipients) {
    if (!isRecord(recipient)
      || !isRecord(recipient.header)
      || recipient.header.alg !== SecureMessageKeyManagementAlgorithm.MlKem768HkdfSha256A256GcmKw
      || typeof recipient.header.kid !== 'string'
      || recipient.header.kid.trim().length === 0
      || !isBase64Url(recipient.encrypted_key)) {
      throw new Error('secure_message_envelope_invalid');
    }
    if (recipientKeyIds.has(recipient.header.kid)) {
      throw new Error('secure_message_recipient_duplicate');
    }
    recipientKeyIds.add(recipient.header.kid);
  }
};
