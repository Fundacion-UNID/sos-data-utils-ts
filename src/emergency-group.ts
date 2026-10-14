// Copyright 2026 Connecting Solution & Applications Ltd under the Apache License, Version 2.0.

import {
  buildServiceRequestFlatEntry,
  type ClinicalCoding,
} from 'fhir-data-utils-ts/care-emergency-alert'
import type { FlatClaimResourceEntry } from 'fhir-data-utils-ts/flat-claim-resource-graph'

export const FHIR_CLAIMS_CONTEXT = 'org.hl7.fhir.api' as const
export const ALERT_COHORT_IDENTIFIER_SYSTEM = 'https://soschain.org/fhir/NamingSystem/alert-cohort' as const
export const EmergencyAssistanceCoding = Object.freeze({
  system: 'https://soschain.org/fhir/CodeSystem/emergency-assistance',
  code: 'emergency-care',
  text: 'Emergency care',
} as const)

/** Standard search claims for one frozen, enumerated emergency subject Group. */
export type EmergencyGroupClaims = Readonly<{
  '@context': typeof FHIR_CLAIMS_CONTEXT
  'Group.identifier': string
  'Group.name': string
  'Group.type': 'animal' | 'person'
  'Group.membership': 'enumerated'
  'Group.member': readonly string[]
}>

/** Canonical flat claims emitted for an emergency ServiceRequest. */
export type EmergencyServiceRequestClaims = FlatClaimResourceEntry['claims']

/** Builds a descriptive emergency Group snapshot; membership never grants access. */
export function buildEmergencyGroupClaims(input: Readonly<{
  identifier: string
  displayName: string
  groupType: 'animal' | 'person'
  memberSubjectReferences: readonly string[]
}>): EmergencyGroupClaims {
  return Object.freeze({
    '@context': FHIR_CLAIMS_CONTEXT,
    'Group.identifier': canonicalAlertCohortIdentifier(input.identifier),
    'Group.name': required(input.displayName, 'emergency_group_name_required'),
    'Group.type': input.groupType,
    'Group.membership': 'enumerated',
    'Group.member': uniqueReferences(input.memberSubjectReferences, 'emergency_group_member_required'),
  })
}

/** Produces the canonical FHIR token used to search an immutable cohort snapshot. */
export function canonicalAlertCohortIdentifier(value: string): string {
  const identifierValue = required(value, 'emergency_group_identifier_required')
  if (identifierValue.includes('|')) throw new TypeError('emergency_group_identifier_value_invalid')
  return `${ALERT_COHORT_IDENTIFIER_SYSTEM}|${identifierValue}`
}

/** Reads the logical identifier value from the canonical alert-cohort token. */
export function readAlertCohortIdentifierValue(value: string): string {
  const prefix = `${ALERT_COHORT_IDENTIFIER_SYSTEM}|`
  const normalized = required(value, 'emergency_group_identifier_required')
  if (!normalized.startsWith(prefix) || normalized.length === prefix.length) {
    throw new TypeError('emergency_group_identifier_token_invalid')
  }
  return normalized.slice(prefix.length)
}

/** Builds the standard compact-coded ServiceRequest that targets an emergency Group. */
export function buildEmergencyServiceRequestEntry(input: Readonly<{
  entryId: string
  identifier: string
  groupReference: string
  requesterReference: string
  performerReferences: readonly string[]
  assistanceCode: ClinicalCoding
  authoredAt: string
}>): FlatClaimResourceEntry {
  return buildServiceRequestFlatEntry({
    entryId: input.entryId,
    identifier: input.identifier,
    status: 'active',
    intent: 'order',
    priority: 'stat',
    code: input.assistanceCode,
    subjectReference: resourceReference(input.groupReference, 'Group', 'emergency_group_reference_invalid'),
    requesterReference: resourceReference(input.requesterReference, undefined, 'emergency_requester_reference_invalid'),
    performerReferences: input.performerReferences.map(value => resourceReference(value, undefined, 'emergency_performer_reference_invalid')),
    authoredAt: input.authoredAt,
  })
}

/** Reads snapshot members without interpreting them as authority. */
export function readEmergencySubjectReferences(claims: EmergencyGroupClaims): readonly string[] {
  return claims['Group.member']
}

function uniqueReferences(values: readonly string[], error: string): readonly string[] {
  const references = [...new Set(values.map(value => resourceReference(value, undefined, error)))]
  if (!references.length) throw new TypeError(error)
  return Object.freeze(references)
}

function resourceReference(value: string, expectedType: string | undefined, error: string): string {
  const normalized = required(value, error)
  const match = /^([A-Z][A-Za-z0-9]+)\/([A-Za-z0-9.-]{1,128})$/.exec(normalized)
  if (!match || (expectedType && match[1] !== expectedType)) throw new TypeError(error)
  return normalized
}

function required(value: unknown, error: string): string {
  if (typeof value !== 'string' || !value.trim()) throw new TypeError(error)
  return value.trim()
}
