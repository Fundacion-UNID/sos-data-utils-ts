// Copyright 2026 Connecting Solution & Applications Ltd under the Apache License, Version 2.0.
import { HealthcareConsentPurposes, HealthcareSummarySections } from 'gdc-common-utils-ts/constants/healthcare'
import { ResourceTypesFhirR4 } from 'gdc-common-utils-ts/constants/fhir-resource-types'
import {
  BundleEditableResourceTypes,
  BundleEditor,
  BundleOperations,
  BundleTypes,
} from 'gdc-common-utils-ts/utils/bundle-editor'
import { BundleReader } from 'gdc-common-utils-ts/utils/bundle-reader'
import {
  ClaimConsent,
  ConsentDecisions,
  ConsentStatuses,
} from 'gdc-common-utils-ts/models/consent-rule'
import {
  normalizeGroupR5FlatClaimsResource,
  projectGroupR5FlatClaimsResource,
  projectGroupR5SearchClaims,
  type GroupR5FlatClaimsResource,
} from 'fhir-data-utils-ts/group-r5'

export const OrganizationSubjectGroupCapabilities = Object.freeze({
  ReadImmunizationSection: HealthcareSummarySections.Immunizations.attributeValue,
} as const)

export type OrganizationGroupMemberManageCapability =
  `organization/Group.u?_id=${string}&managing-entity=Organization/${string}`

export type OrganizationSubjectGroupCapability =
  | typeof OrganizationSubjectGroupCapabilities[keyof typeof OrganizationSubjectGroupCapabilities]
  | OrganizationGroupMemberManageCapability

export const OrganizationSubjectGroupAccessErrors = Object.freeze({
  InvalidBundle: 'organization_subject_group_permission_bundle_invalid',
  InvalidSubjectGroupReference: 'organization_subject_group_reference_invalid',
  InvalidActorGroupReference: 'organization_actor_group_reference_invalid',
  InvalidGrantorReference: 'organization_group_grantor_reference_invalid',
  InvalidCapability: 'organization_subject_group_capability_invalid',
  InvalidPurpose: 'organization_subject_group_purpose_invalid',
  InvalidMemberReference: 'organization_subject_group_member_reference_invalid',
} as const)

/** Governed values reused by SOS, Vet, UHC and downstream contract tests. */
export const ORGANIZATION_SUBJECT_GROUP_ACCESS_TEST_DATA = Object.freeze({
  operationsPurpose: HealthcareConsentPurposes.Operations,
  patientAdministrationPurpose: HealthcareConsentPurposes.PatientAdministration,
  bundleResourceType: ResourceTypesFhirR4.Bundle,
  consentResourceType: ResourceTypesFhirR4.Consent,
  groupResourceType: 'Group',
  bundleType: BundleTypes.batch,
  animalGroupType: 'animal',
  enumeratedMembership: 'enumerated',
} as const)

export type OrganizationSubjectGroupPermissionInput = Readonly<{
  consentId: string
  subjectGroupReference: string
  actorGroupReference: string
  grantorOrganizationReference: string
  purpose: typeof HealthcareConsentPurposes.Operations | typeof HealthcareConsentPurposes.PatientAdministration
  capabilities: readonly OrganizationSubjectGroupCapability[]
  date: string
}>

export type OrganizationSubjectGroupPermission = Readonly<{
  consentId: string
  subjectGroupReference: string
  actorGroupReference: string
  grantorOrganizationReference: string
  purpose: string
  capabilities: readonly OrganizationSubjectGroupCapability[]
  date: string
}>

/** Limits membership changes to one exact organization-managed subject Group. */
export function buildOrganizationGroupMemberManageCapability(
  groupReference: string,
  managingOrganizationReference: string,
): OrganizationGroupMemberManageCapability {
  const exactGroupReference = exactReference(
    groupReference,
    'Group',
    OrganizationSubjectGroupAccessErrors.InvalidSubjectGroupReference,
  )
  const exactOrganizationReference = exactReference(
    managingOrganizationReference,
    ResourceTypesFhirR4.Organization,
    OrganizationSubjectGroupAccessErrors.InvalidGrantorReference,
  )
  return `organization/Group.u?_id=${exactGroupReference.slice('Group/'.length)}&managing-entity=${exactOrganizationReference}` as OrganizationGroupMemberManageCapability
}

/**
 * Builds one descriptive, enumerated organization-owned subject Group.
 * Membership does not grant access; a separate active Consent is required.
 */
export function buildOrganizationSubjectGroupGraph(input: Readonly<{
  groupReference: string
  managingOrganizationReference: string
  subjectType: 'animal' | 'person'
  name: string
  memberReferences: readonly string[]
}>): Readonly<{
  group: GroupR5FlatClaimsResource
  memberships: readonly GroupR5FlatClaimsResource[]
}> {
  const groupReference = exactReference(
    input.groupReference,
    'Group',
    OrganizationSubjectGroupAccessErrors.InvalidSubjectGroupReference,
  )
  const managingOrganizationReference = exactReference(
    input.managingOrganizationReference,
    ResourceTypesFhirR4.Organization,
    OrganizationSubjectGroupAccessErrors.InvalidGrantorReference,
  )
  const memberType = input.subjectType === 'animal' ? ResourceTypesFhirR4.Patient : ResourceTypesFhirR4.Patient
  const members = unique(input.memberReferences.map(reference => exactReference(
    reference,
    memberType,
    OrganizationSubjectGroupAccessErrors.InvalidMemberReference,
  )))
  if (!members.length) throw new TypeError(OrganizationSubjectGroupAccessErrors.InvalidMemberReference)
  const groupId = groupReference.slice('Group/'.length)
  const group = projectGroupR5FlatClaimsResource({
    resourceType: 'Group',
    id: groupId,
    type: input.subjectType,
    membership: 'enumerated',
    name: required(input.name, 'organization_subject_group_name_required'),
    managingEntity: { reference: managingOrganizationReference, type: ResourceTypesFhirR4.Organization },
    member: [],
  })
  const memberships = members.map(reference => normalizeGroupR5FlatClaimsResource({
    resourceType: 'Group',
    id: groupId,
    meta: { claims: projectGroupR5SearchClaims({
      resourceType: 'Group',
      id: groupId,
      type: input.subjectType,
      membership: 'enumerated',
      member: [{ entity: { reference, type: memberType } }],
    }) },
  }))
  return Object.freeze({ group, memberships: Object.freeze(memberships) })
}

/**
 * Builds one atomic claims-first Consent batch. It authorizes an exact actor
 * Group over an exact subject Group and never treats either membership as the
 * permission itself.
 */
export function buildOrganizationSubjectGroupPermissionBundle(
  input: OrganizationSubjectGroupPermissionInput,
): ReturnType<BundleEditor['build']> {
  const subjectGroupReference = exactReference(
    input.subjectGroupReference,
    'Group',
    OrganizationSubjectGroupAccessErrors.InvalidSubjectGroupReference,
  )
  const actorGroupReference = exactReference(
    input.actorGroupReference,
    'Group',
    OrganizationSubjectGroupAccessErrors.InvalidActorGroupReference,
  )
  const grantorOrganizationReference = exactReference(
    input.grantorOrganizationReference,
    ResourceTypesFhirR4.Organization,
    OrganizationSubjectGroupAccessErrors.InvalidGrantorReference,
  )
  const capabilities = normalizeCapabilities(
    input.capabilities,
    subjectGroupReference,
    grantorOrganizationReference,
  )
  assertPurpose(capabilities, input.purpose)

  const editor = new BundleEditor()
    .setBundleOperation(BundleOperations.create)
    .setBundleType(BundleTypes.batch)
    .setAllowedResourceType(BundleEditableResourceTypes.consent)
  editor.newEntryAs(BundleEditableResourceTypes.consent, required(input.consentId, 'organization_group_consent_id_required'))
    .setIdentifier(input.consentId)
    .setResourceId(input.consentId)
    .setSubject(subjectGroupReference)
    .setStatus(ConsentStatuses.Active)
    .setDecision(ConsentDecisions.Permit)
    .setActorIdentifierList([actorGroupReference])
    .setPurposeList([input.purpose])
    .setSectionList(capabilities)
    .setDate(required(input.date, 'organization_group_consent_date_required'))
    .setClaim(ClaimConsent.grantor, grantorOrganizationReference)
    .setClaim(ClaimConsent.grantee, actorGroupReference)
    .setClaim(ClaimConsent.manager, grantorOrganizationReference)
    .setClaim(ClaimConsent.controller, grantorOrganizationReference)
    .create()
  return editor.build()
}

/** Reads one organization subject-Group Consent through the shared BundleReader. */
export function readOrganizationSubjectGroupPermissionBundle(payload: unknown): OrganizationSubjectGroupPermission {
  const bundle = claimsFirstConsentBundle(payload)
  const reader = new BundleReader(bundle)
  const claims = reader.getEntryClaimsByArrayIndex(0)
  const subjectGroupReference = exactReference(
    String(claims[ClaimConsent.subject] || ''),
    'Group',
    OrganizationSubjectGroupAccessErrors.InvalidSubjectGroupReference,
  )
  const actorGroupReference = exactReference(
    String(claims[ClaimConsent.actorIdentifier] || ''),
    'Group',
    OrganizationSubjectGroupAccessErrors.InvalidActorGroupReference,
  )
  const grantorOrganizationReference = exactReference(
    String(claims[ClaimConsent.grantor] || ''),
    ResourceTypesFhirR4.Organization,
    OrganizationSubjectGroupAccessErrors.InvalidGrantorReference,
  )
  const capabilities = normalizeCapabilities(
    String(claims[ClaimConsent.action] || '').split(','),
    subjectGroupReference,
    grantorOrganizationReference,
  )
  const purpose = String(claims[ClaimConsent.purpose] || '')
  assertPurpose(capabilities, purpose)
  if (claims[ClaimConsent.status] !== ConsentStatuses.Active
    || claims[ClaimConsent.decision] !== ConsentDecisions.Permit) {
    throw new TypeError(OrganizationSubjectGroupAccessErrors.InvalidBundle)
  }
  const entry = (bundle.entry as Array<Record<string, unknown>>)[0]
  const resource = entry.resource as { id?: string }
  return Object.freeze({
    consentId: String(claims[ClaimConsent.identifier] || resource.id || ''),
    subjectGroupReference,
    actorGroupReference,
    grantorOrganizationReference,
    purpose,
    capabilities,
    date: String(claims[ClaimConsent.date] || ''),
  })
}

function claimsFirstConsentBundle(payload: unknown): Record<string, unknown> & { entry: unknown[] } {
  if (!payload || typeof payload !== 'object') throw new TypeError(OrganizationSubjectGroupAccessErrors.InvalidBundle)
  const bundle = payload as Record<string, unknown>
  const entries = Array.isArray(bundle.entry) ? bundle.entry : []
  if (bundle.resourceType !== ResourceTypesFhirR4.Bundle || bundle.type !== BundleTypes.batch || entries.length !== 1) {
    throw new TypeError(OrganizationSubjectGroupAccessErrors.InvalidBundle)
  }
  const entry = entries[0] as Record<string, unknown>
  const resource = entry?.resource as Record<string, unknown> | undefined
  const meta = resource?.meta as Record<string, unknown> | undefined
  if (!resource || resource.resourceType !== ResourceTypesFhirR4.Consent
    || !meta?.claims || typeof meta.claims !== 'object'
    || Object.keys(resource).some(key => !['resourceType', 'id', 'meta'].includes(key))) {
    throw new TypeError(OrganizationSubjectGroupAccessErrors.InvalidBundle)
  }
  return bundle as Record<string, unknown> & { entry: unknown[] }
}

function normalizeCapabilities(
  values: readonly unknown[],
  subjectGroupReference: string,
  grantorOrganizationReference: string,
): readonly OrganizationSubjectGroupCapability[] {
  const allowed = new Set<unknown>([
    ...Object.values(OrganizationSubjectGroupCapabilities),
    buildOrganizationGroupMemberManageCapability(subjectGroupReference, grantorOrganizationReference),
  ])
  const capabilities = unique(values.map(value => String(value || '').trim()))
  if (!capabilities.length || capabilities.some(capability => !allowed.has(capability))) {
    throw new TypeError(OrganizationSubjectGroupAccessErrors.InvalidCapability)
  }
  return Object.freeze(capabilities as OrganizationSubjectGroupCapability[])
}

function assertPurpose(capabilities: readonly OrganizationSubjectGroupCapability[], purpose: string): void {
  const expected = capabilities.some(capability => capability.startsWith('organization/Group.u?'))
    ? HealthcareConsentPurposes.Operations
    : HealthcareConsentPurposes.PatientAdministration
  if (capabilities.length !== 1 || purpose !== expected) {
    throw new TypeError(OrganizationSubjectGroupAccessErrors.InvalidPurpose)
  }
}

function exactReference(value: string, resourceType: string, error: string): string {
  const normalized = String(value || '').trim()
  if (!new RegExp(`^${resourceType}/[A-Za-z0-9.-]{1,64}$`, 'u').test(normalized)) throw new TypeError(error)
  return normalized
}

function unique<T>(values: readonly T[]): T[] {
  return [...new Set(values)]
}

function required(value: unknown, error: string): string {
  const normalized = String(value || '').trim()
  if (!normalized) throw new TypeError(error)
  return normalized
}
