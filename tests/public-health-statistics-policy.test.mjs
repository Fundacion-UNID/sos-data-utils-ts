// Flow contract: a trusted professional may publish anonymous statistics at clinical certification, while an authenticated individual may later report verified clinical evidence or a coded self-report into a separate epidemic/pandemic collection; none creates a Digital Twin or accepts browser-selected authority.
import assert from 'node:assert/strict'
import test from 'node:test'

import {
  PublicHealthStatisticsContributionPaths,
  preparePublicHealthStatisticsContribution,
} from '../dist/public-health-statistics-policy.js'

const finalProblem = {
  subjectKind: 'human',
  section: 'http://loinc.org|11450-4',
  codingSystem: 'http://snomed.info/sct',
  code: '386661006',
  jurisdiction: 'CA-BC',
  occurredOn: '2026-10-23',
  ageBand: '40-49',
  sex: 'female',
}

test('prepares the automatic professional contribution at certification time', () => {
  const contribution = preparePublicHealthStatisticsContribution({
    path: PublicHealthStatisticsContributionPaths.ClinicalCertification,
    evidence: finalProblem,
    authority: {
      qualifiedCreator: true,
      attachmentPresent: true,
      reviewAttested: true,
    },
  })

  assert.equal(contribution.collectionPurpose, 'public-clinical-statistics')
  assert.equal(contribution.path, 'clinical-certification')
  assert.deepEqual(contribution.projection, {
    subjectKind: 'human',
    section: finalProblem.section,
    codingSystem: finalProblem.codingSystem,
    code: finalProblem.code,
    jurisdiction: finalProblem.jurisdiction,
    occurredOn: finalProblem.occurredOn,
    demographics: { ageBand: finalProblem.ageBand, sex: finalProblem.sex },
  })
})

test('prepares a later individual report in the separate epidemic and pandemic collection', () => {
  const contribution = preparePublicHealthStatisticsContribution({
    path: PublicHealthStatisticsContributionPaths.IndividualClinicalRecord,
    evidence: finalProblem,
    authority: {
      individualAuthorized: true,
      clinicOriginVerified: true,
      selfCreated: false,
    },
  })

  assert.equal(contribution.collectionPurpose, 'public-health-user-reports')
  assert.equal(contribution.path, 'individual-clinical-record')
})

test('prepares a coded individual self-report without clinic provenance', () => {
  const contribution = preparePublicHealthStatisticsContribution({
    path: PublicHealthStatisticsContributionPaths.IndividualSelfReport,
    evidence: finalProblem,
    authority: { individualAuthorized: true },
  })

  assert.equal(contribution.collectionPurpose, 'public-health-user-reports')
  assert.equal(contribution.path, 'individual-self-report')
})

test('fails closed when professional qualification, attachment or review is missing', () => {
  const input = {
    path: PublicHealthStatisticsContributionPaths.ClinicalCertification,
    evidence: finalProblem,
    authority: { qualifiedCreator: true, attachmentPresent: true, reviewAttested: true },
  }
  assert.throws(
    () => preparePublicHealthStatisticsContribution({ ...input, authority: { ...input.authority, qualifiedCreator: false } }),
    /qualified_creator_required/,
  )
  assert.throws(
    () => preparePublicHealthStatisticsContribution({ ...input, authority: { ...input.authority, attachmentPresent: false } }),
    /clinical_attachment_required/,
  )
  assert.throws(
    () => preparePublicHealthStatisticsContribution({ ...input, authority: { ...input.authority, reviewAttested: false } }),
    /review_attestation_required/,
  )
})

test('rejects an individual report without consent or from self-created or unverified evidence', () => {
  const input = {
    path: PublicHealthStatisticsContributionPaths.IndividualClinicalRecord,
    evidence: finalProblem,
    authority: { individualAuthorized: true, clinicOriginVerified: true, selfCreated: false },
  }
  assert.throws(
    () => preparePublicHealthStatisticsContribution({ ...input, authority: { ...input.authority, individualAuthorized: false } }),
    /individual_authorization_required/,
  )
  assert.throws(
    () => preparePublicHealthStatisticsContribution({ ...input, authority: { ...input.authority, selfCreated: true } }),
    /self_created_clinical_evidence_forbidden/,
  )
  assert.throws(
    () => preparePublicHealthStatisticsContribution({ ...input, authority: { ...input.authority, clinicOriginVerified: false } }),
    /clinic_origin_required/,
  )
  assert.throws(
    () => preparePublicHealthStatisticsContribution({
      path: PublicHealthStatisticsContributionPaths.IndividualSelfReport,
      evidence: finalProblem,
      authority: { individualAuthorized: false },
    }),
    /individual_authorization_required/,
  )
})
