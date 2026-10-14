// Flow contract: SOS, Vet and UHC channels share product-neutral terminology systems, candidate shapes and fixtures without importing a product SDK.
import assert from 'node:assert/strict'
import test from 'node:test'

import {
  CLINICAL_TERMINOLOGY_TEST_DATA,
  ClinicalTerminologySourceScopes,
  ClinicalTerminologySystems,
  buildClinicalTerminologyCandidate,
} from '../dist/clinical-terminology.js'

test('exports cross-sector terminology identities and deterministic fixtures', () => {
  assert.equal(ClinicalTerminologySystems.AtcVet, 'http://www.whocc.no/atcvet')
  assert.equal(ClinicalTerminologySourceScopes.AtcVet, 'ATCVET')
  assert.deepEqual(CLINICAL_TERMINOLOGY_TEST_DATA.canineRabiesVaccine, {
    scope: 'ATCVET',
    system: 'http://www.whocc.no/atcvet',
    code: 'QI07AA02',
    text: 'virus de la rabia',
    display: 'rabies virus',
    ncbiTaxonomyId: '9615',
  })
  assert.deepEqual(CLINICAL_TERMINOLOGY_TEST_DATA.humanInactivatedInfluenzaVaccine, {
    scope: 'ATC',
    system: 'http://www.whocc.no/atc',
    code: 'J07BB02',
    text: 'vacuna contra la gripe inactivada de virus fraccionados o antígeno de superficie',
    display: 'influenza, inactivated, split virus or surface antigen',
    ncbiTaxonomyId: '9606',
  })
})

test('keeps international display separate from requested-language text', () => {
  assert.deepEqual(buildClinicalTerminologyCandidate({
    source: 'ATCVET',
    system: 'http://www.whocc.no/atcvet',
    code: 'QI07AA02',
    display: 'rabies virus',
    text: 'virus de la rabia',
    language: 'es',
  }), {
    source: 'ATCVET',
    system: 'http://www.whocc.no/atcvet',
    code: 'QI07AA02',
    display: 'rabies virus',
    text: 'virus de la rabia',
    language: 'es',
  })
})
