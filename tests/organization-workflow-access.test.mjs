// Copyright 2026 Connecting Solution & Applications Ltd under the Apache License, Version 2.0.
// Flow contract: reuse shared test fixtures and canonical types; do not introduce duplicated literals.
import assert from 'node:assert/strict'
import test from 'node:test'
import { HealthcareActorRoles } from 'gdc-common-utils-ts/constants/healthcare'

import {
  OrganizationWorkflowCapabilities,
  OrganizationWorkflowGroupKinds,
  buildOrganizationSubjectRegisterCapability,
  buildOrganizationControllerWorkflowAssignment,
  buildTestNetworkControllerWorkflowAssignment,
  buildTestNetworkControllerWorkflowSelfAssignment,
} from '../dist/organization-workflow-access.js'
import { SoschainPortalAccessModeIds } from '../dist/portal-access-profiles.data.js'
import { REPOSITORY_SAFE_EXAMPLES } from '../dist/repository-privacy.js'

const organizationReference = `Organization/${REPOSITORY_SAFE_EXAMPLES.resourceUuid}`
const practitionerRoleReference = `PractitionerRole/${REPOSITORY_SAFE_EXAMPLES.resourceUuid}`
const encounterGroupReference = `Group/encounter-${REPOSITORY_SAFE_EXAMPLES.resourceUuid}`
const schedulingGroupReference = `Group/scheduling-${REPOSITORY_SAFE_EXAMPLES.resourceUuid}`
const clinicalContributionGroupReference = `Group/clinical-contribution-${REPOSITORY_SAFE_EXAMPLES.resourceUuid}`
const subjectRegistrationGroupReference = `Group/subject-registration-${REPOSITORY_SAFE_EXAMPLES.resourceUuid}`
const assignedAt = REPOSITORY_SAFE_EXAMPLES.organizationScopedResources.slotStart
const memberRole = HealthcareActorRoles.Veterinarian

const controller = Object.freeze({
  authorityKind: 'organization-controller',
  organizationReference,
  accountId: REPOSITORY_SAFE_EXAMPLES.resourceUuid,
})
const member = Object.freeze({
  accountId: REPOSITORY_SAFE_EXAMPLES.resourceUuid,
  practitionerRoleReference,
  role: memberRole,
})

test('creates separate descriptive membership and active workflow authority for a Test Network controller', () => {
  const plan = buildTestNetworkControllerWorkflowSelfAssignment({
    networkKind: 'test-network',
    controller,
    member,
    groupKind: OrganizationWorkflowGroupKinds.EncounterOperations,
    groupReference: encounterGroupReference,
    capabilities: [
      OrganizationWorkflowCapabilities.EncounterCruds,
      OrganizationWorkflowCapabilities.EncounterHistoryCruds,
    ],
    assignedAt,
  })

  assert.equal(plan.assignmentMode, 'controller-self')
  assert.equal(plan.membership.resource.meta.claims['Group.member'][0], practitionerRoleReference)
  assert.equal('Consent.action' in plan.membership.resource.meta.claims, false)
  assert.equal(plan.authorization.resource.meta.claims['Consent.actor-identifier'], practitionerRoleReference)
  assert.equal(plan.authorization.resource.meta.claims['Consent.actor-role'], memberRole)
  assert.equal(plan.authorization.resource.meta.claims['Consent.source-reference'], encounterGroupReference)
  assert.equal(plan.group.resource.meta.claims['Group.managing-entity'][0], organizationReference)
  assert.equal(plan.authorization.resource.meta.claims['Consent.action'], [
    OrganizationWorkflowCapabilities.EncounterCruds,
    OrganizationWorkflowCapabilities.EncounterHistoryCruds,
  ].join(','))
  assert.equal(plan.authorization.resource.meta.claims['Consent.status'], 'active')
})

test('uses one scheduling operations group for Appointment, Schedule and Slot authority', () => {
  const capabilities = [
    OrganizationWorkflowCapabilities.AppointmentCruds,
    OrganizationWorkflowCapabilities.ScheduleCruds,
    OrganizationWorkflowCapabilities.SlotCruds,
  ]
  const plan = buildTestNetworkControllerWorkflowSelfAssignment({
    networkKind: 'test-network',
    controller,
    member,
    groupKind: OrganizationWorkflowGroupKinds.SchedulingOperations,
    groupReference: schedulingGroupReference,
    capabilities,
    assignedAt,
  })

  assert.deepEqual(plan.capabilities, capabilities)
  assert.equal(plan.authorization.resource.meta.claims['Consent.action'], capabilities.join(','))
})

test('grants clinical contribution without granting Composition read authority', () => {
  const capabilities = [OrganizationWorkflowCapabilities.CompositionCuds]
  const plan = buildTestNetworkControllerWorkflowAssignment({
    networkKind: 'test-network',
    controller,
    member,
    groupKind: OrganizationWorkflowGroupKinds.ClinicalContribution,
    groupReference: clinicalContributionGroupReference,
    capabilities,
    assignedAt,
  })

  assert.deepEqual(plan.capabilities, capabilities)
  assert.equal(plan.authorization.resource.meta.claims['Consent.action'], 'Subject/Composition.cuds')
  assert.equal(plan.authorization.resource.meta.claims['Consent.action'].includes('.r'), false)
  assert.throws(() => buildTestNetworkControllerWorkflowAssignment({
    networkKind: 'test-network',
    controller,
    member,
    groupKind: OrganizationWorkflowGroupKinds.ClinicalContribution,
    groupReference: clinicalContributionGroupReference,
    capabilities: ['organization/Composition.cuds'],
    assignedAt,
  }), /organization_workflow_group_capability_forbidden/)
})

test('limits subject registration to the routed organization without granting Group or clinical authority', () => {
  const capabilities = [
    buildOrganizationSubjectRegisterCapability(organizationReference),
  ]
  const plan = buildTestNetworkControllerWorkflowAssignment({
    networkKind: 'test-network',
    controller,
    member,
    groupKind: OrganizationWorkflowGroupKinds.SubjectRegistration,
    groupReference: subjectRegistrationGroupReference,
    capabilities,
    assignedAt,
  })

  assert.deepEqual(plan.capabilities, capabilities)
  assert.equal(plan.authorization.resource.meta.claims['Consent.action'], capabilities.join(','))
  assert.equal(plan.authorization.resource.meta.claims['Consent.action'].includes('.r'), false)
  assert.equal(plan.authorization.resource.meta.claims['Consent.action'].includes('Group.u'), false)
})

test('uses the same controller-resolved assignment policy with a resettable Demo persistence adapter', () => {
  const plan = buildOrganizationControllerWorkflowAssignment({
    networkKind: SoschainPortalAccessModeIds.Demo,
    controller,
    member,
    groupKind: OrganizationWorkflowGroupKinds.SubjectRegistration,
    groupReference: `Group/demo-subject-registration-${REPOSITORY_SAFE_EXAMPLES.resourceUuid}`,
    capabilities: [
      buildOrganizationSubjectRegisterCapability(organizationReference),
    ],
    assignedAt,
  })

  assert.equal(plan.assignmentMode, 'controller-assigned')
  assert.equal(plan.authorization.resource.meta.claims['Consent.subject'], organizationReference)
})

test('lets the controller assign a verified employee PractitionerRole owned by another account', () => {
  const plan = buildTestNetworkControllerWorkflowAssignment({
    networkKind: 'test-network',
    controller,
    member: {
      ...member,
      accountId: `employee-${REPOSITORY_SAFE_EXAMPLES.resourceUuid}`,
    },
    groupKind: OrganizationWorkflowGroupKinds.SchedulingOperations,
    groupReference: schedulingGroupReference,
    capabilities: [
      OrganizationWorkflowCapabilities.AppointmentCruds,
      OrganizationWorkflowCapabilities.ScheduleCruds,
      OrganizationWorkflowCapabilities.SlotCruds,
    ],
    assignedAt,
  })

  assert.equal(plan.assignmentMode, 'controller-assigned')
  assert.equal(plan.memberPractitionerRoleReference, practitionerRoleReference)
  assert.equal(plan.authorization.resource.meta.claims['Consent.grantor'], organizationReference)
  assert.equal(plan.authorization.resource.meta.claims['Consent.grantee'], practitionerRoleReference)
})

test('fails closed outside Test Network or when self-assignment, organization or group capabilities do not match', () => {
  const encounterInput = {
    networkKind: 'test-network',
    controller,
    member,
    groupKind: OrganizationWorkflowGroupKinds.EncounterOperations,
    groupReference: encounterGroupReference,
    capabilities: [
      OrganizationWorkflowCapabilities.EncounterCruds,
      OrganizationWorkflowCapabilities.EncounterHistoryCruds,
    ],
    assignedAt,
  }

  assert.throws(() => buildTestNetworkControllerWorkflowSelfAssignment({
    ...encounterInput,
    networkKind: 'network',
  }), /test_network_controller_self_assignment_required/)
  assert.throws(() => buildTestNetworkControllerWorkflowSelfAssignment({
    ...encounterInput,
    controller: { ...controller, authorityKind: 'organization-employee' },
  }), /organization_controller_authority_required/)
  assert.throws(() => buildTestNetworkControllerWorkflowSelfAssignment({
    ...encounterInput,
    member: { ...member, accountId: `other-${REPOSITORY_SAFE_EXAMPLES.resourceUuid}` },
  }), /controller_self_assignment_account_mismatch/)
  assert.throws(() => buildTestNetworkControllerWorkflowSelfAssignment({
    ...encounterInput,
    capabilities: [OrganizationWorkflowCapabilities.AppointmentCruds],
  }), /organization_workflow_group_capability_forbidden/)
  assert.throws(() => buildTestNetworkControllerWorkflowSelfAssignment({
    ...encounterInput,
    managedOrganizationReference: `Organization/other-${REPOSITORY_SAFE_EXAMPLES.resourceUuid}`,
  }), /organization_workflow_organization_mismatch/)
})
