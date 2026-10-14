// Copyright 2026 Connecting Solution & Applications Ltd under the Apache License, Version 2.0.
import { createHash } from 'node:crypto'
import { HealthcareConsentPurposes } from 'gdc-common-utils-ts/constants/healthcare'
import {
  ClaimConsent,
  ConsentDecisions,
  ConsentStatuses,
} from 'gdc-common-utils-ts/models/consent-rule'
import {
  BundleEditableResourceTypes,
  BundleEditor,
  BundleOperations,
  BundleTypes,
} from 'gdc-common-utils-ts/utils/bundle-editor'
import {
  projectGroupPractitionerRoleMemberFlatClaimResources,
  projectGroupR5FlatClaimsResource,
  type GroupR5FlatClaimsResource,
} from 'fhir-data-utils-ts/group-r5'

export const OrganizationWorkflowCapabilities = Object.freeze({
  EncounterCruds: 'organization/Encounter.cruds',
  EncounterHistoryCruds: 'organization/EncounterHistory.cruds',
  AppointmentCruds: 'organization/Appointment.cruds',
  ScheduleCruds: 'organization/Schedule.cruds',
  SlotCruds: 'organization/Slot.cruds',
  CompositionCuds: 'Subject/Composition.cuds',
} as const)

export type OrganizationSubjectRegisterCapability =
  `organization/Subject.c?organization=Organization/${string}`

export type OrganizationWorkflowCapability =
  | typeof OrganizationWorkflowCapabilities[keyof typeof OrganizationWorkflowCapabilities]
  | OrganizationSubjectRegisterCapability

export const OrganizationWorkflowGroupKinds = Object.freeze({
  EncounterOperations: 'encounter-operations',
  SchedulingOperations: 'scheduling-operations',
  ClinicalContribution: 'clinical-contribution',
  SubjectRegistration: 'subject-registration',
} as const)

export type OrganizationWorkflowGroupKind =
  typeof OrganizationWorkflowGroupKinds[keyof typeof OrganizationWorkflowGroupKinds]

export type OrganizationWorkflowFlatEntry = Readonly<{
  type: 'Group-v5.0.0' | 'Consent-v5.0.0'
  resource: GroupR5FlatClaimsResource | Readonly<{
    resourceType: 'Consent'
    id: string
    meta: Readonly<{ claims: Readonly<Record<string, string>> }>
  }>
  request: Readonly<{ method: 'POST' | 'PATCH'; url: string }>
}>

type TestNetworkControllerWorkflowAssignmentInput = Readonly<{
  networkKind: string
  controller: Readonly<{
    authorityKind: string
    organizationReference: string
    accountId: string
  }>
  member: Readonly<{
    accountId: string
    practitionerRoleReference: string
    role: string
  }>
  groupKind: OrganizationWorkflowGroupKind
  groupReference: string
  capabilities: readonly OrganizationWorkflowCapability[]
  assignedAt: string
  managedOrganizationReference?: string
}>

export type TestNetworkControllerWorkflowAssignment = Readonly<{
  assignmentMode: 'controller-self' | 'controller-assigned'
  groupKind: OrganizationWorkflowGroupKind
  groupReference: string
  memberRole: string
  memberPractitionerRoleReference: string
  organizationReference: string
  capabilities: readonly OrganizationWorkflowCapability[]
  assignedAt: string
  group: OrganizationWorkflowFlatEntry
  membership: OrganizationWorkflowFlatEntry
  authorization: OrganizationWorkflowFlatEntry
}>

export type TestNetworkControllerWorkflowSelfAssignment = TestNetworkControllerWorkflowAssignment & Readonly<{
  assignmentMode: 'controller-self'
}>

const CAPABILITIES_BY_GROUP: Readonly<Record<OrganizationWorkflowGroupKind, ReadonlySet<OrganizationWorkflowCapability>>> =
  Object.freeze({
    [OrganizationWorkflowGroupKinds.EncounterOperations]: new Set([
      OrganizationWorkflowCapabilities.EncounterCruds,
      OrganizationWorkflowCapabilities.EncounterHistoryCruds,
    ]),
    [OrganizationWorkflowGroupKinds.SchedulingOperations]: new Set([
      OrganizationWorkflowCapabilities.AppointmentCruds,
      OrganizationWorkflowCapabilities.ScheduleCruds,
      OrganizationWorkflowCapabilities.SlotCruds,
    ]),
    [OrganizationWorkflowGroupKinds.ClinicalContribution]: new Set([
      OrganizationWorkflowCapabilities.CompositionCuds,
    ]),
    [OrganizationWorkflowGroupKinds.SubjectRegistration]: new Set<OrganizationWorkflowCapability>(),
  })

/** Limits individual or animal registration to one exact organization or department. */
export function buildOrganizationSubjectRegisterCapability(
  organizationReference: string,
): OrganizationSubjectRegisterCapability {
  const exactOrganizationReference = exactReference(
    organizationReference,
    'Organization',
    'organization_workflow_organization_reference_invalid',
  )
  return `organization/Subject.c?organization=${exactOrganizationReference}` as OrganizationSubjectRegisterCapability
}

/**
 * Builds the Test Network bootstrap plan for an organization controller who
 * explicitly adds their own PractitionerRole to one operational Group.
 *
 * FHIR Group membership is descriptive. The separate active Consent is the
 * auditable workflow authority and is scoped to the exact organization,
 * PractitionerRole and governed capability list. Production self-assignment
 * deliberately fails closed.
 */
export function buildTestNetworkControllerWorkflowSelfAssignment(
  input: TestNetworkControllerWorkflowAssignmentInput,
): TestNetworkControllerWorkflowSelfAssignment {
  if (input.networkKind !== 'test-network') throw new TypeError('test_network_controller_self_assignment_required')
  requireController(input)
  const controllerAccountId = required(input.controller.accountId, 'organization_controller_account_required')
  const memberAccountId = required(input.member.accountId, 'organization_workflow_member_account_required')
  if (controllerAccountId !== memberAccountId) throw new TypeError('controller_self_assignment_account_mismatch')
  return buildWorkflowAssignmentPlan(input, 'controller-self') as TestNetworkControllerWorkflowSelfAssignment
}

/**
 * Builds a Test Network controller assignment for an employee whose exact
 * PractitionerRole was resolved from the controller's organization roster.
 * Account identity is retained for audit correlation but is not authorization;
 * the governed PractitionerRole, Group membership and Consent are.
 */
export function buildTestNetworkControllerWorkflowAssignment(
  input: TestNetworkControllerWorkflowAssignmentInput,
): TestNetworkControllerWorkflowAssignment {
  if (input.networkKind !== 'test-network') throw new TypeError('test_network_controller_assignment_required')
  requireController(input)
  required(input.controller.accountId, 'organization_controller_account_required')
  required(input.member.accountId, 'organization_workflow_member_account_required')
  return buildWorkflowAssignmentPlan(input, 'controller-assigned')
}

/**
 * Builds the same controller-resolved assignment independently of persistence
 * mode. A Demo BFF may persist the returned claims in its resettable adapter;
 * a network BFF sends them through the high-level SDK. Both must first resolve
 * the real or synthetic controller and employee profile server-side.
 */
export function buildOrganizationControllerWorkflowAssignment(
  input: TestNetworkControllerWorkflowAssignmentInput,
): TestNetworkControllerWorkflowAssignment {
  requireController(input)
  required(input.controller.accountId, 'organization_controller_account_required')
  required(input.member.accountId, 'organization_workflow_member_account_required')
  return buildWorkflowAssignmentPlan(input, 'controller-assigned')
}

function requireController(input: TestNetworkControllerWorkflowAssignmentInput): void {
  if (input.controller.authorityKind !== 'organization-controller') {
    throw new TypeError('organization_controller_authority_required')
  }
}

function buildWorkflowAssignmentPlan(
  input: TestNetworkControllerWorkflowAssignmentInput,
  assignmentMode: TestNetworkControllerWorkflowAssignment['assignmentMode'],
): TestNetworkControllerWorkflowAssignment {
  const organizationReference = exactReference(
    input.controller.organizationReference,
    'Organization',
    'organization_workflow_organization_reference_invalid',
  )
  const managedOrganizationReference = exactReference(
    input.managedOrganizationReference ?? organizationReference,
    'Organization',
    'organization_workflow_organization_reference_invalid',
  )
  if (managedOrganizationReference !== organizationReference) {
    throw new TypeError('organization_workflow_organization_mismatch')
  }
  const memberPractitionerRoleReference = exactReference(
    input.member.practitionerRoleReference,
    'PractitionerRole',
    'organization_workflow_practitioner_role_reference_invalid',
  )
  const groupKind = requireGroupKind(input.groupKind)
  const groupReference = exactReference(input.groupReference, 'Group', 'organization_workflow_group_reference_invalid')
  const memberRole = exactMemberRole(input.member.role)
  const capabilities = normalizeCapabilities(groupKind, input.capabilities, organizationReference)
  const assignedAt = exactInstant(input.assignedAt)
  const groupId = groupReference.slice('Group/'.length)
  const groupResource = projectGroupR5FlatClaimsResource({
    resourceType: 'Group',
    id: groupId,
    type: 'practitioner',
    membership: 'enumerated',
    name: workflowGroupName(groupKind),
    managingEntity: { reference: organizationReference, type: 'Organization' },
    member: [],
  })
  const membershipResource = projectGroupPractitionerRoleMemberFlatClaimResources({
    groupId,
    members: [{
      entity: { reference: memberPractitionerRoleReference, type: 'PractitionerRole' },
      period: { start: assignedAt },
    }],
  })[0]
  const consentId = stableResourceId([
    organizationReference,
    groupReference,
    memberPractitionerRoleReference,
    ...capabilities,
  ])
  const authorizationResource = buildWorkflowAuthorizationResource({
    consentId,
    organizationReference,
    groupReference,
    memberPractitionerRoleReference,
    memberRole,
    capabilities,
    assignedAt,
  })
  return Object.freeze({
    assignmentMode,
    groupKind,
    groupReference,
    memberRole,
    memberPractitionerRoleReference,
    organizationReference,
    capabilities,
    assignedAt,
    group: Object.freeze({
      type: 'Group-v5.0.0' as const,
      resource: groupResource,
      request: Object.freeze({ method: 'POST' as const, url: 'Group' }),
    }),
    membership: Object.freeze({
      type: 'Group-v5.0.0' as const,
      resource: membershipResource,
      request: Object.freeze({ method: 'PATCH' as const, url: groupReference }),
    }),
    authorization: Object.freeze({
      type: 'Consent-v5.0.0' as const,
      resource: authorizationResource,
      request: Object.freeze({ method: 'POST' as const, url: 'Consent' }),
    }),
  })
}

function requireGroupKind(value: string): OrganizationWorkflowGroupKind {
  if (!Object.values(OrganizationWorkflowGroupKinds).includes(value as OrganizationWorkflowGroupKind)) {
    throw new TypeError('organization_workflow_group_kind_invalid')
  }
  return value as OrganizationWorkflowGroupKind
}

function normalizeCapabilities(
  groupKind: OrganizationWorkflowGroupKind,
  input: readonly OrganizationWorkflowCapability[],
  organizationReference: string,
): readonly OrganizationWorkflowCapability[] {
  if (!Array.isArray(input) || input.length === 0) throw new TypeError('organization_workflow_capability_required')
  const capabilities = [...new Set(input.map(value => String(value).trim() as OrganizationWorkflowCapability))]
  const allowed = groupKind === OrganizationWorkflowGroupKinds.SubjectRegistration
    ? new Set<OrganizationWorkflowCapability>([buildOrganizationSubjectRegisterCapability(organizationReference)])
    : CAPABILITIES_BY_GROUP[groupKind]
  if (capabilities.length !== input.length || capabilities.some(capability => !allowed.has(capability))) {
    throw new TypeError('organization_workflow_group_capability_forbidden')
  }
  return Object.freeze(capabilities)
}

function exactReference(value: string, resourceType: string, error: string): string {
  const normalized = String(value ?? '').trim()
  if (!new RegExp(`^${resourceType}/[A-Za-z0-9.-]{1,64}$`, 'u').test(normalized)) throw new TypeError(error)
  return normalized
}

function exactInstant(value: string): string {
  const normalized = String(value ?? '').trim()
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?Z$/u.test(normalized)
    || !Number.isFinite(Date.parse(normalized))) throw new TypeError('organization_workflow_assigned_at_invalid')
  return normalized
}

function workflowGroupName(groupKind: OrganizationWorkflowGroupKind): string {
  if (groupKind === OrganizationWorkflowGroupKinds.EncounterOperations) return 'Encounter operations'
  if (groupKind === OrganizationWorkflowGroupKinds.SchedulingOperations) return 'Scheduling operations'
  if (groupKind === OrganizationWorkflowGroupKinds.SubjectRegistration) return 'Subject registration'
  return 'Clinical contribution'
}

function buildWorkflowAuthorizationResource(input: Readonly<{
  consentId: string
  organizationReference: string
  groupReference: string
  memberPractitionerRoleReference: string
  memberRole: string
  capabilities: readonly OrganizationWorkflowCapability[]
  assignedAt: string
}>): Readonly<{
  resourceType: 'Consent'
  id: string
  meta: Readonly<{ claims: Readonly<Record<string, string>> }>
}> {
  const editor = new BundleEditor()
    .setBundleOperation(BundleOperations.create)
    .setBundleType(BundleTypes.batch)
    .setAllowedResourceType(BundleEditableResourceTypes.consent)
  editor.newEntryAs(BundleEditableResourceTypes.consent, input.consentId)
    .setIdentifier(`urn:uuid:${input.consentId}`)
    .setResourceId(input.consentId)
    .setSubject(input.organizationReference)
    .setStatus(ConsentStatuses.Active)
    .setDecision(ConsentDecisions.Permit)
    .setActorIdentifierList([input.memberPractitionerRoleReference])
    .setActorRoleList([input.memberRole])
    .setPurposeList([HealthcareConsentPurposes.Operations])
    .setSectionList(input.capabilities)
    .setDate(input.assignedAt)
    .setClaim(ClaimConsent.sourceReference, input.groupReference)
    .setClaim(ClaimConsent.grantor, input.organizationReference)
    .setClaim(ClaimConsent.grantee, input.memberPractitionerRoleReference)
    .setClaim(ClaimConsent.manager, input.organizationReference)
    .setClaim(ClaimConsent.controller, input.organizationReference)
    .create()
  const resource = editor.build().entry[0]?.resource
  if (!resource || resource.resourceType !== 'Consent') throw new TypeError('organization_workflow_consent_build_failed')
  return resource as Readonly<{
    resourceType: 'Consent'
    id: string
    meta: Readonly<{ claims: Readonly<Record<string, string>> }>
  }>
}

function exactMemberRole(value: string): string {
  const normalized = String(value ?? '').trim()
  if (normalized !== 'RESPRSN' && !/^ISCO-08\|[0-9]{1,4}$/u.test(normalized)) {
    throw new TypeError('organization_workflow_member_role_invalid')
  }
  return normalized
}

function stableResourceId(parts: readonly string[]): string {
  return createHash('sha256').update(parts.join('\0')).digest('hex').slice(0, 32)
}

function required(value: string, error: string): string {
  const normalized = String(value ?? '').trim()
  if (!normalized) throw new TypeError(error)
  return normalized
}
