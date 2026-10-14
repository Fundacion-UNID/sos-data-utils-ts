// Flow contract: SOS reads an animal card through canonical flat claims, validates its species-bound checksum and never infers species from the DID alone.
import assert from 'node:assert/strict'
import test from 'node:test'

import {
  ANIMAL_CARD_INTEROPERABILITY_EXAMPLES,
  NCBI_TAXONOMY_SYSTEM,
  buildNcbiTaxonomyUri,
  parseAnimalCardNumber,
  parseAnimalCardDidWeb,
  readAnimalCardFromFlatClaims,
} from '../dist/animal-card-interoperability.js'
import { SchemaOrgOrganizationClaim } from '../dist/schema-org-claims.js'

const cardDid = ANIMAL_CARD_INTEROPERABILITY_EXAMPLES.Dog.cardDid
const animalClaims = Object.freeze({
  [SchemaOrgOrganizationClaim.AdditionalType]: 'animal',
  [SchemaOrgOrganizationClaim.SameAs]: cardDid,
  [SchemaOrgOrganizationClaim.AlternateName]: 'Animal one',
  [SchemaOrgOrganizationClaim.MemberAdditionalType]: 'http://purl.obolibrary.org/obo/NCBITaxon_9615',
})

test('reads an SOS-visible animal species from canonical card flat claims', () => {
  const animalCard = readAnimalCardFromFlatClaims(animalClaims)

  assert.deepEqual(animalCard, {
    subjectKind: 'animal',
    cardDid,
    cardNumber21: '724090961510852611262',
    jurisdictionCode5: '72409',
    animalNumericId15: '096151085261126',
    animalId16: '0961510852611262',
    ncbiTaxonomyId: '9615',
    speciesId7: '0009615',
    species: { system: NCBI_TAXONOMY_SYSTEM, code: '9615' },
    displayName: 'Animal one',
  })
  assert.equal(buildNcbiTaxonomyUri('9615'), animalClaims[SchemaOrgOrganizationClaim.MemberAdditionalType])
})

test('requires the external species claim because the current card DID does not embed species', () => {
  assert.equal(parseAnimalCardDidWeb(cardDid), undefined)
  assert.equal(readAnimalCardFromFlatClaims({
    ...animalClaims,
    [SchemaOrgOrganizationClaim.MemberAdditionalType]: undefined,
  }), undefined)
  assert.equal(readAnimalCardFromFlatClaims({
    ...animalClaims,
    [SchemaOrgOrganizationClaim.MemberAdditionalType]: buildNcbiTaxonomyUri('9685'),
  }), undefined)
})

test('parses the visible animal card number with the same explicit species context', () => {
  assert.deepEqual(parseAnimalCardNumber(ANIMAL_CARD_INTEROPERABILITY_EXAMPLES.Dog.cardNumber21, '9615'), {
    cardNumber21: '724090961510852611262',
    jurisdictionCode5: '72409',
    animalNumericId15: '096151085261126',
    animalId16: '0961510852611262',
    ncbiTaxonomyId: '9615',
    speciesId7: '0009615',
  })
  assert.equal(parseAnimalCardNumber(ANIMAL_CARD_INTEROPERABILITY_EXAMPLES.Dog.cardNumber21, '9685'), undefined)
})

test('does not classify a human taxonomy or a non-animal subject as an animal card', () => {
  assert.equal(readAnimalCardFromFlatClaims({
    ...animalClaims,
    [SchemaOrgOrganizationClaim.MemberAdditionalType]: 'http://purl.obolibrary.org/obo/NCBITaxon_9606',
  }), undefined)
  assert.equal(readAnimalCardFromFlatClaims({
    ...animalClaims,
    [SchemaOrgOrganizationClaim.AdditionalType]: 'person',
  }), undefined)
})
