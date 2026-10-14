// Flow contract: every consumer imports governed safe examples and rejects private operator data before a commit or push.
import assert from 'node:assert/strict'
import test from 'node:test'
import {
  REPOSITORY_PRIVACY_PROBES,
  REPOSITORY_SAFE_EXAMPLES,
  assertRepositoryPrivacy,
  inspectRepositoryPrivacy,
} from '../dist/repository-privacy.js'

test('accepts only governed examples in strict templates and tests', () => {
  const text = [
    `CHAT_DEFAULT_TENANT_ID=${REPOSITORY_SAFE_EXAMPLES.tenantId}`,
    `CHAT_TENANT_PHONE_BINDINGS=${REPOSITORY_SAFE_EXAMPLES.tenantId}:CA-BC:animal-care:${REPOSITORY_SAFE_EXAMPLES.phoneE164}`,
    `SERVICE_BASE_URL=${REPOSITORY_SAFE_EXAMPLES.httpsBaseUrl}`,
    `WORKSPACE_ROOT=${REPOSITORY_SAFE_EXAMPLES.workspaceRoot}`,
    `ORGANIZATION_LEGAL_NAME=${REPOSITORY_SAFE_EXAMPLES.organizationLegalName}`,
    `ORGANIZATION_BUSINESS_NUMBER=${REPOSITORY_SAFE_EXAMPLES.organizationBusinessNumber}`,
  ].join('\n')

  assert.deepEqual(inspectRepositoryPrivacy({ path: 'env.example', text, strictExamples: true }), [])
  assert.doesNotThrow(() => assertRepositoryPrivacy([{ path: 'env.example', text, strictExamples: true }]))
  assert.match(REPOSITORY_SAFE_EXAMPLES.organizationBusinessNumber, /^\d{9}$/u)
  assert.deepEqual(inspectRepositoryPrivacy({
    path: 'fhir-example.test.mjs',
    text: 'http://loinc.org|882-1',
    strictExamples: true,
    allowedDomains: ['loinc.org'],
  }), [])
  assert.deepEqual(inspectRepositoryPrivacy({
    path: 'fhir-service-type.test.mjs',
    text: "const systems = ['http://terminology.hl7.org/CodeSystem/service-type|117', 'http://loinc.org']",
    strictExamples: true,
    allowedDomains: ['terminology.hl7.org', 'loinc.org'],
  }), [])
})

test('rejects personal paths, ungoverned phones, operational domains and caller-provided denylist values', () => {
  const artifact = {
    path: 'README.md',
    strictExamples: true,
    forbiddenExactValues: [REPOSITORY_PRIVACY_PROBES.privateTenantId],
    text: [
      REPOSITORY_PRIVACY_PROBES.personalWorkspacePath,
      REPOSITORY_PRIVACY_PROBES.unguardedPhoneE164,
      REPOSITORY_PRIVACY_PROBES.operationalHttpsUrl,
      REPOSITORY_PRIVACY_PROBES.privateTenantId,
    ].join('\n'),
  }

  const violations = inspectRepositoryPrivacy(artifact)
  assert.deepEqual(new Set(violations.map(({ code }) => code)), new Set([
    'personal-path',
    'ungoverned-phone',
    'operational-domain',
    'forbidden-exact-value',
  ]))
  assert.throws(() => assertRepositoryPrivacy([artifact]), /README\.md/)
})
