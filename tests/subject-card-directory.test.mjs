// Flow contract: a cross-sector subject-card directory normalizes human and animal relationships without granting access or accepting legacy aliases.
import assert from 'node:assert/strict'
import test from 'node:test'

import {
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
