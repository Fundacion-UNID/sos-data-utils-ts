// Copyright 2026 Connecting Solution & Applications Ltd under the Apache License, Version 2.0.

/** Capabilities that trusted evidence may grant to an emergency channel. */
export const EmergencyCapabilities = Object.freeze([
  'sos:call',
  'sos:request',
] as const);

export type EmergencyCapability = (typeof EmergencyCapabilities)[number];

/** Governed domains in which emergency evidence may be presented. */
export const EvidenceDomains = Object.freeze([
  'SOS',
  'Health',
  'TrainingAndEducation',
] as const);

export type EvidenceDomain = (typeof EvidenceDomains)[number];

/** Relationships supported by the shared evidence record. */
export const EvidenceRelationships = Object.freeze([
  'self',
  'guardian',
  'professional',
  'institution',
  'incident-reporter',
] as const);

export type EvidenceRelationship = (typeof EvidenceRelationships)[number];

/**
 * Reference to verified evidence shared by SOS, human-health and animal SDKs.
 * The source VC or PDF remains outside operational call and audit records.
 */
export type EmergencyAuthorizationEvidence = Readonly<{
  evidenceId: string;
  issuerId: string;
  holderId: string;
  subjectIds: readonly string[];
  capabilities: readonly EmergencyCapability[];
  domains: readonly EvidenceDomain[];
  relationship: EvidenceRelationship;
  verifiedAt: string;
  validUntil?: string;
}>;
