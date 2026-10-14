// Copyright 2026 Connecting Solution & Applications Ltd under the Apache License, Version 2.0.
// Flow contract: 1) a legal organization owns an enumerated subject Group; 2) its controller separately authorizes an employee Group to update membership or read one governed clinical section; 3) current membership and active Consent are both required. Authorization invariant: neither organization employment, subject membership, employee membership, sector nor Location grants authority alone. Persistence invariant: Group and Consent remain independent claims-first resources and native FHIR fields are rejected.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

import {
  ORGANIZATION_SUBJECT_GROUP_ACCESS_TEST_DATA,
  OrganizationSubjectGroupCapabilities,
  buildOrganizationGroupMemberManageCapability,
  buildOrganizationSubjectGroupPermissionBundle,
  buildOrganizationSubjectGroupGraph,
  readOrganizationSubjectGroupPermissionBundle,
} from '../dist/organization-subject-group-access.js'
import { REPOSITORY_SAFE_EXAMPLES } from '../dist/repository-privacy.js'

const organizationReference = `Organization/${REPOSITORY_SAFE_EXAMPLES.resourceUuid}`
const animalReference = `Patient/${REPOSITORY_SAFE_EXAMPLES.resourceUuid}`
const animalGroupReference = `Group/animals-${REPOSITORY_SAFE_EXAMPLES.resourceUuid}`
const managerGroupReference = `Group/managers-${REPOSITORY_SAFE_EXAMPLES.resourceUuid}`
const membershipCapability = buildOrganizationGroupMemberManageCapability(
  animalGroupReference,
  organizationReference,
)

test('builds an organization-owned animal Group independently from manager authority', () => {
  const graph = buildOrganizationSubjectGroupGraph({
    groupReference: animalGroupReference,
    managingOrganizationReference: organizationReference,
    subjectType: 'animal',
    name: REPOSITORY_SAFE_EXAMPLES.organizationLegalName,
    memberReferences: [animalReference],
  })

  assert.equal(graph.group.resourceType, ORGANIZATION_SUBJECT_GROUP_ACCESS_TEST_DATA.groupResourceType)
  assert.equal(graph.group.meta.claims['Group.type'][0], ORGANIZATION_SUBJECT_GROUP_ACCESS_TEST_DATA.animalGroupType)
  assert.equal(graph.group.meta.claims['Group.membership'][0], ORGANIZATION_SUBJECT_GROUP_ACCESS_TEST_DATA.enumeratedMembership)
  assert.equal('Group.member' in graph.group.meta.claims, false)
  assert.equal(graph.memberships[0].meta.claims['Group.member'][0], animalReference)
  assert.equal('Consent.action' in graph.memberships[0].meta.claims, false)
})

test('roundtrips a municipality permission for an employee Group to update animal membership', () => {
  const bundle = buildOrganizationSubjectGroupPermissionBundle({
    consentId: REPOSITORY_SAFE_EXAMPLES.resourceUuid,
    subjectGroupReference: animalGroupReference,
    actorGroupReference: managerGroupReference,
    grantorOrganizationReference: organizationReference,
    purpose: ORGANIZATION_SUBJECT_GROUP_ACCESS_TEST_DATA.operationsPurpose,
    capabilities: [membershipCapability],
    date: REPOSITORY_SAFE_EXAMPLES.organizationScopedResources.slotStart,
  })
  const permission = readOrganizationSubjectGroupPermissionBundle(bundle)

  assert.equal(permission.subjectGroupReference, animalGroupReference)
  assert.equal(permission.actorGroupReference, managerGroupReference)
  assert.equal(permission.grantorOrganizationReference, organizationReference)
  assert.deepEqual(permission.capabilities, [membershipCapability])
  assert.equal(permission.capabilities[0], `organization/Group.u?_id=${animalGroupReference.slice('Group/'.length)}&managing-entity=${organizationReference}`)
  assert.deepEqual(Object.keys(bundle.entry[0].resource).sort(), ['id', 'meta', 'resourceType'])
})

test('keeps passenger-transport vaccination verification read-only', () => {
  const bundle = buildOrganizationSubjectGroupPermissionBundle({
    consentId: REPOSITORY_SAFE_EXAMPLES.resourceUuid,
    subjectGroupReference: animalGroupReference,
    actorGroupReference: managerGroupReference,
    grantorOrganizationReference: organizationReference,
    purpose: ORGANIZATION_SUBJECT_GROUP_ACCESS_TEST_DATA.patientAdministrationPurpose,
    capabilities: [OrganizationSubjectGroupCapabilities.ReadImmunizationSection],
    date: REPOSITORY_SAFE_EXAMPLES.organizationScopedResources.slotStart,
  })
  const permission = readOrganizationSubjectGroupPermissionBundle(bundle)

  assert.deepEqual(permission.capabilities, [OrganizationSubjectGroupCapabilities.ReadImmunizationSection])
  assert.equal(permission.capabilities.includes(membershipCapability), false)
  assert.equal(permission.capabilities.some(capability => /[cud]/u.test(capability.split('.').at(-1) ?? '')), false)
})

test('rejects individual subjects, non-Group actors and native FHIR-shaped Consent input', () => {
  const base = {
    consentId: REPOSITORY_SAFE_EXAMPLES.resourceUuid,
    subjectGroupReference: animalGroupReference,
    actorGroupReference: managerGroupReference,
    grantorOrganizationReference: organizationReference,
    purpose: ORGANIZATION_SUBJECT_GROUP_ACCESS_TEST_DATA.operationsPurpose,
    capabilities: [membershipCapability],
    date: REPOSITORY_SAFE_EXAMPLES.organizationScopedResources.slotStart,
  }
  assert.throws(() => buildOrganizationSubjectGroupPermissionBundle({
    ...base,
    subjectGroupReference: animalReference,
  }), /organization_subject_group_reference_invalid/)
  assert.throws(() => buildOrganizationSubjectGroupPermissionBundle({
    ...base,
    actorGroupReference: `PractitionerRole/${REPOSITORY_SAFE_EXAMPLES.resourceUuid}`,
  }), /organization_actor_group_reference_invalid/)
  assert.throws(() => readOrganizationSubjectGroupPermissionBundle({
    resourceType: ORGANIZATION_SUBJECT_GROUP_ACCESS_TEST_DATA.bundleResourceType,
    type: ORGANIZATION_SUBJECT_GROUP_ACCESS_TEST_DATA.bundleType,
    entry: [{ resource: {
      resourceType: ORGANIZATION_SUBJECT_GROUP_ACCESS_TEST_DATA.consentResourceType,
      subject: { reference: animalGroupReference },
    } }],
  }), /organization_subject_group_permission_bundle_invalid/)
})

test('documents neutral acyclic layering and the two organization journeys', () => {
  const packageManifest = JSON.parse(readFileSync('package.json', 'utf8'))
  const readme = readFileSync('README.md', 'utf8')
  const contract = readFileSync('docs/ORGANIZATION_SUBJECT_GROUP_ACCESS.md', 'utf8')
  const source = readFileSync('src/organization-subject-group-access.ts', 'utf8')

  assert.match(readme, /Organization subject-Group access/)
  assert.match(contract, /Municipal cat colony/)
  assert.match(contract, /Passenger transport and emergency access/)
  assert.match(contract, /owns reusable emergency and cross-sector data contracts/)
  assert.match(contract, /does\s+not describe or depend on consumer repositories/)
  assert.equal(Object.keys(packageManifest.dependencies).some(name => name.startsWith('vet-')), false)
  assert.equal(/from ['"]vet-/u.test(source), false)
})
