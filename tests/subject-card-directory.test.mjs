// Flow contract: a cross-sector subject-card directory normalizes human and animal relationships without granting access or accepting legacy aliases.
import assert from 'node:assert/strict'
import test from 'node:test'

import {
  SUBJECT_CARD_PROVIDER_OPERATIONS,
  createSubjectCardProviderDescriptor,
  createSubjectCardDirectoryEntry,
} from '../dist/subject-card-directory.js'
import { REPOSITORY_SAFE_EXAMPLES } from '../dist/repository-privacy.js'

const ANIMAL_CARD_DID = `did:web:${REPOSITORY_SAFE_EXAMPLES.domain}:card:vetchain:0009615:724090961510852611262`
const HUMAN_CARD_DID = `did:web:${REPOSITORY_SAFE_EXAMPLES.domain}:card:uhc:personal:example-subject`

test('creates animal entries with explicit taxonomy and never permits a self relationship', () => {
  const entry = createSubjectCardDirectoryEntry({
    cardDid: ANIMAL_CARD_DID,
    provider: 'vetchain',
    displayName: 'Animal one',
    subjectKind: 'animal',
    ncbiTaxonomyId: '9615',
    relationship: 'controller',
    active: true,
  })

  assert.equal(entry.ncbiTaxonomyId, '9615')
  assert.equal(entry.relationship, 'controller')
  assert.throws(() => createSubjectCardDirectoryEntry({
    cardDid: ANIMAL_CARD_DID,
    provider: 'vetchain',
    displayName: 'Animal one',
    subjectKind: 'animal',
    ncbiTaxonomyId: '9615',
    relationship: 'self',
    active: true,
  }), /never have a self relationship/)
})

test('accepts an animal card from either governed index provider', () => {
  const entry = createSubjectCardDirectoryEntry({
    cardDid: ANIMAL_CARD_DID,
    provider: 'unid',
    displayName: 'Animal one',
    subjectKind: 'animal',
    ncbiTaxonomyId: '9615',
    relationship: 'controller',
    active: true,
  })

  assert.equal(entry.provider, 'unid')
  assert.equal(entry.subjectKind, 'animal')
})

test('creates human entries with the final relationship vocabulary', () => {
  const entry = createSubjectCardDirectoryEntry({
    cardDid: HUMAN_CARD_DID,
    provider: 'unid',
    displayName: 'Person one',
    subjectKind: 'human',
    relationship: 'caregiver',
    caregiverCompensation: 'organization-payroll',
    active: true,
  })

  assert.equal(entry.relationship, 'caregiver')
  assert.equal(entry.caregiverCompensation, 'organization-payroll')
})

test('rejects removed relationship aliases instead of silently translating them', () => {
  assert.throws(() => createSubjectCardDirectoryEntry({
    cardDid: HUMAN_CARD_DID,
    provider: 'unid',
    displayName: 'Person one',
    subjectKind: 'human',
    relationship: 'family-member',
    active: true,
  }), /relationship/)
  assert.throws(() => createSubjectCardDirectoryEntry({
    cardDid: HUMAN_CARD_DID,
    provider: 'unid',
    displayName: 'Person one',
    subjectKind: 'human',
    relationship: 'employee',
    active: true,
  }), /relationship/)
})

test('does not expose product-prefixed or temporary compatibility names', async () => {
  const contract = await import('sos-data-utils-ts/subject-card-directory')
  assert.equal('createSoschainCardDirectoryEntry' in contract, false)
  assert.equal('SoschainCardDirectoryEntry' in contract, false)
})

test('describes a provider independently from subject kind and product brand', () => {
  const provider = createSubjectCardProviderDescriptor({
    indexProviderDid: REPOSITORY_SAFE_EXAMPLES.didWeb,
    displayName: REPOSITORY_SAFE_EXAMPLES.organizationLegalName,
    directoryRoute: `${REPOSITORY_SAFE_EXAMPLES.httpsBaseUrl}/${REPOSITORY_SAFE_EXAMPLES.tenantId}/cds-CA/v1/${REPOSITORY_SAFE_EXAMPLES.sector}`,
    subjectKinds: ['animal', 'human'],
    operations: [SUBJECT_CARD_PROVIDER_OPERATIONS.Directory, SUBJECT_CARD_PROVIDER_OPERATIONS.Create],
    providerCode9: REPOSITORY_SAFE_EXAMPLES.organizationBusinessNumber,
    cardDidHost: 'cards.example.invalid',
  })

  assert.equal(provider.providerId, REPOSITORY_SAFE_EXAMPLES.didWeb)
  assert.deepEqual(provider.subjectKinds, ['animal', 'human'])
  assert.deepEqual(provider.operations, ['directory', 'create'])
  assert.equal(provider.cardDidHost, 'cards.example.invalid')
})

test('requires issuer metadata for creation and rejects unsafe provider routes', () => {
  const base = {
    indexProviderDid: REPOSITORY_SAFE_EXAMPLES.didWeb,
    displayName: REPOSITORY_SAFE_EXAMPLES.organizationLegalName,
    directoryRoute: `${REPOSITORY_SAFE_EXAMPLES.httpsBaseUrl}/${REPOSITORY_SAFE_EXAMPLES.tenantId}/cds-CA/v1/${REPOSITORY_SAFE_EXAMPLES.sector}`,
    subjectKinds: ['animal'],
  }
  assert.throws(() => createSubjectCardProviderDescriptor({
    ...base,
    operations: [SUBJECT_CARD_PROVIDER_OPERATIONS.Create],
  }), /providerCode9/)
  assert.throws(() => createSubjectCardProviderDescriptor({
    ...base,
    operations: [SUBJECT_CARD_PROVIDER_OPERATIONS.Create],
    providerCode9: REPOSITORY_SAFE_EXAMPLES.organizationBusinessNumber,
  }), /cardDidHost/)
  assert.throws(() => createSubjectCardProviderDescriptor({
    ...base,
    operations: [SUBJECT_CARD_PROVIDER_OPERATIONS.Directory],
    directoryRoute: 'http://example.invalid/example-tenant/cds-CA/v1/animal-care',
  }), /HTTPS/)
})

test('uses a distinct index DID for each human or animal sector index', () => {
  const shared = {
    displayName: REPOSITORY_SAFE_EXAMPLES.organizationLegalName,
    operations: [SUBJECT_CARD_PROVIDER_OPERATIONS.Directory],
  }
  const human = createSubjectCardProviderDescriptor({
    ...shared,
    indexProviderDid: `${REPOSITORY_SAFE_EXAMPLES.didWeb}:human-index`,
    directoryRoute: `${REPOSITORY_SAFE_EXAMPLES.httpsBaseUrl}/${REPOSITORY_SAFE_EXAMPLES.tenantId}/cds-CA/v1/health-care`,
    subjectKinds: ['human'],
  })
  const animal = createSubjectCardProviderDescriptor({
    ...shared,
    indexProviderDid: `${REPOSITORY_SAFE_EXAMPLES.didWeb}:animal-index`,
    directoryRoute: `${REPOSITORY_SAFE_EXAMPLES.httpsBaseUrl}/${REPOSITORY_SAFE_EXAMPLES.tenantId}/cds-CA/v1/animal-care`,
    subjectKinds: ['animal'],
  })

  assert.equal(human.providerId, human.indexProviderDid)
  assert.equal(animal.providerId, animal.indexProviderDid)
  assert.notEqual(human.providerId, animal.providerId)
})
