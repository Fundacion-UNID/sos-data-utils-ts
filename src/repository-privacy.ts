/** Governed, non-operational values for public examples, tests and templates. */
export const REPOSITORY_SAFE_EXAMPLES = Object.freeze({
  tenantId: 'example-tenant',
  resourceUuid: '00000000-0000-4000-8000-000000000001',
  demoOrganizationUuids: Object.freeze({
    healthCare: '00000000-0000-4000-8000-000000000101',
    animalCare: '00000000-0000-4000-8000-000000000102',
    publicHealth: '00000000-0000-4000-8000-000000000103',
    publicSafety: '00000000-0000-4000-8000-000000000104',
  }),
  phoneE164: '+12025550123',
  personFamilyName: 'Doe',
  individualGivenName: 'Jane',
  individualEmail: 'jane.doe@example.invalid',
  firstContactGivenName: 'John',
  firstContactEmail: 'john.doe@example.invalid',
  secondContactGivenName: 'Morgan',
  firstContactIdentifier: 'RelatedPerson/demo-contact-one',
  secondContactIdentifier: 'RelatedPerson/demo-contact-two',
  firstContactPhoneE164: '+12025550101',
  firstContactPhoneDisplay: '+1 202-555-0101',
  secondContactPhoneE164: '+12025550102',
  secondContactPhoneDisplay: '+1 202-555-0102',
  domain: 'example.invalid',
  httpsBaseUrl: 'https://example.invalid',
  workspaceRoot: '$HOME/path/to/workspace',
  didWeb: 'did:web:example.invalid:example-tenant',
  organizationLegalName: 'Example Animal Care Organization',
  organizationBusinessNumber: '123456789',
  organizationIdentifierType: 'BN',
  countryIso2: 'CA',
  sector: 'animal-care',
  organizationScopedResources: Object.freeze({
    organizationUrn: 'urn:cds-ca-bc:v1:organization:bn:123456789',
    departmentUuid: '00000000-0000-4000-8000-000000000010',
    serviceUuid: '00000000-0000-4000-8000-000000000011',
    placeUuid: '00000000-0000-4000-8000-000000000012',
    scheduleUuid: '00000000-0000-4000-8000-000000000013',
    slotStart: '2026-09-29T16:00:00Z',
    slotEnd: '2026-09-29T16:15:00Z',
    slotStartWithMilliseconds: '2026-09-29T16:00:00.123Z',
    slotEndWithMilliseconds: '2026-09-29T16:15:00.999Z',
    slotStartEpochSeconds: 1790697600,
    slotEndEpochSeconds: 1790698500,
  }),
});

/** Synthetic negative probes used to prove privacy gates without copying private data. */
export const REPOSITORY_PRIVACY_PROBES = Object.freeze({
  personalWorkspacePath: '/Users/private-probe/workspace',
  unguardedPhoneE164: '+12025550124',
  operationalHttpsUrl: 'https://voice.private-probe.test',
  privateTenantId: 'private-tenant-probe',
});

export type RepositoryPrivacyViolationCode =
  | 'personal-path'
  | 'ungoverned-phone'
  | 'operational-domain'
  | 'forbidden-exact-value';

export interface RepositoryPrivacyArtifact {
  path: string;
  text: string;
  /** Enforce governed phones and reserved domains for tests/templates/configuration. */
  strictExamples?: boolean;
  /** Values loaded from an ignored local denylist; never copy them into source tests. */
  forbiddenExactValues?: readonly string[];
  /** Standards/source hosts explicitly allowed in strict documentation checks. */
  allowedDomains?: readonly string[];
}

export interface RepositoryPrivacyViolation {
  path: string;
  code: RepositoryPrivacyViolationCode;
  line: number;
}

const lineAt = (text: string, offset: number): number => text.slice(0, offset).split('\n').length;

const addMatches = (
  violations: RepositoryPrivacyViolation[],
  artifact: RepositoryPrivacyArtifact,
  code: RepositoryPrivacyViolationCode,
  pattern: RegExp,
): void => {
  for (const match of artifact.text.matchAll(pattern)) {
    violations.push({ path: artifact.path, code, line: lineAt(artifact.text, match.index ?? 0) });
  }
};

/** Inspect text before commit/push without returning the sensitive matched value. */
export const inspectRepositoryPrivacy = (
  artifact: RepositoryPrivacyArtifact,
): RepositoryPrivacyViolation[] => {
  const violations: RepositoryPrivacyViolation[] = [];

  addMatches(
    violations,
    artifact,
    'personal-path',
    /(?:\/Users\/[^/\s)]+\/|\/home\/[^/\s)]+\/|[A-Za-z]:\\Users\\[^\\\s]+\\)/g,
  );

  for (const forbiddenValue of artifact.forbiddenExactValues ?? []) {
    if (!forbiddenValue) continue;
    let offset = artifact.text.indexOf(forbiddenValue);
    while (offset >= 0) {
      violations.push({
        path: artifact.path,
        code: 'forbidden-exact-value',
        line: lineAt(artifact.text, offset),
      });
      offset = artifact.text.indexOf(forbiddenValue, offset + forbiddenValue.length);
    }
  }

  if (!artifact.strictExamples) return violations;

  const governedExamplePhones = new Set<string>([
    REPOSITORY_SAFE_EXAMPLES.phoneE164,
    REPOSITORY_SAFE_EXAMPLES.firstContactPhoneE164,
    REPOSITORY_SAFE_EXAMPLES.secondContactPhoneE164,
  ])
  for (const match of artifact.text.matchAll(/\+[1-9][0-9 ()-]{7,}[0-9]/g)) {
    const normalized = match[0].replace(/[^+\d]/g, '');
    if (!governedExamplePhones.has(normalized)) {
      violations.push({
        path: artifact.path,
        code: 'ungoverned-phone',
        line: lineAt(artifact.text, match.index ?? 0),
      });
    }
  }

  const allowedDomains = new Set([
    REPOSITORY_SAFE_EXAMPLES.domain,
    'localhost',
    '127.0.0.1',
    ...(artifact.allowedDomains ?? []),
  ]);
  // A canonical FHIR token is `system|code`; the code is not part of the URL host.
  for (const match of artifact.text.matchAll(/https?:\/\/([A-Za-z0-9.-]+)/g)) {
    if (!allowedDomains.has(match[1].toLowerCase())) {
      violations.push({
        path: artifact.path,
        code: 'operational-domain',
        line: lineAt(artifact.text, match.index ?? 0),
      });
    }
  }

  return violations;
};

/** Fail closed with locations and categories while never echoing matched private values. */
export const assertRepositoryPrivacy = (
  artifacts: readonly RepositoryPrivacyArtifact[],
): void => {
  const violations = artifacts.flatMap(inspectRepositoryPrivacy);
  if (violations.length === 0) return;
  const summary = violations
    .map(({ path, line, code }) => `${path}:${line} [${code}]`)
    .join('\n');
  throw new Error(`Repository privacy check failed:\n${summary}`);
};
