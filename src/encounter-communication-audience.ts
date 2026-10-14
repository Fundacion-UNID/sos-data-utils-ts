import { EncounterStatusR5 } from 'fhir-data-utils-ts/claims'

import {
  normalizeProfessionalServiceGroupAssignment,
  type ProfessionalServiceGroupAssignment,
} from './organization-service-catalog.js'

/** Patient movement that changes the future audience of an emergency channel. */
export const CareJourneyMovementKind = Object.freeze({
  PermanentTransfer: 'permanent-transfer',
  TemporaryTransfer: 'temporary-transfer',
  ReturnTransfer: 'return-transfer',
} as const)

export type CareJourneyMovementKindValue =
  typeof CareJourneyMovementKind[keyof typeof CareJourneyMovementKind]

export type EncounterCommunicationAudienceInput = Readonly<{
  idempotencyKey: string
  communicationThreadId: string
  subjectReference: string
  movementKind: CareJourneyMovementKindValue
  sourceEncounterReference: string
  sourceEncounterStatus: EncounterStatusR5
  sourceHealthcareServiceReference: string
  sourceAssignments: readonly ProfessionalServiceGroupAssignment[]
  destinationEncounterReference: string
  destinationEncounterStatus: EncounterStatusR5
  destinationHealthcareServiceReference: string
  destinationAssignments: readonly ProfessionalServiceGroupAssignment[]
  currentProfessionalGroupReferences: readonly string[]
  occurredAt: string
  handoverAccepted: boolean
}>

/** Family-visible event deliberately excludes professional membership and transport state. */
export type FamilyCareJourneyEvent = Readonly<{
  idempotencyKey: string
  communicationThreadId: string
  subjectReference: string
  kind: CareJourneyMovementKindValue
  sourceEncounterReference: string
  sourceEncounterStatus: EncounterStatusR5
  sourceHealthcareServiceReference: string
  destinationEncounterReference: string
  destinationEncounterStatus: EncounterStatusR5
  destinationHealthcareServiceReference: string
  occurredAt: string
}>

export type EncounterCommunicationAudienceReconciliation = Readonly<{
  idempotencyKey: string
  communicationThreadId: string
  retainedProfessionalGroupReferences: readonly string[]
  addedProfessionalGroupReferences: readonly string[]
  removedProfessionalGroupReferences: readonly string[]
  nextProfessionalGroupReferences: readonly string[]
  familyJourneyEvent: FamilyCareJourneyEvent
}>

/**
 * Reconcile only future emergency-channel recipients after accepted handover.
 *
 * The caller authorizes the Encounter transition and supplies current,
 * server-resolved Group assignments for each exact HealthcareService. This
 * helper never mutates an earlier Communication: every sent message preserves
 * its original recipient snapshot. A temporary movement retains the source
 * service Groups while adding the destination Groups. A permanent movement or
 * return removes the departed service Groups and adds the destination Groups.
 */
export function reconcileEncounterCommunicationAudience(
  input: EncounterCommunicationAudienceInput,
): EncounterCommunicationAudienceReconciliation {
  if (input.handoverAccepted !== true) throw new TypeError('encounter_communication_handover_not_accepted')
  if (!Object.values(CareJourneyMovementKind).includes(input.movementKind)) {
    throw new TypeError('encounter_communication_movement_kind_invalid')
  }

  const sourceEncounterReference = reference(
    input.sourceEncounterReference,
    'Encounter',
    'encounter_communication_source_encounter_invalid',
  )
  const destinationEncounterReference = reference(
    input.destinationEncounterReference,
    'Encounter',
    'encounter_communication_destination_encounter_invalid',
  )
  if (sourceEncounterReference === destinationEncounterReference) {
    throw new TypeError('encounter_communication_distinct_encounters_required')
  }
  const sourceHealthcareServiceReference = reference(
    input.sourceHealthcareServiceReference,
    'HealthcareService',
    'encounter_communication_source_service_invalid',
  )
  const destinationHealthcareServiceReference = reference(
    input.destinationHealthcareServiceReference,
    'HealthcareService',
    'encounter_communication_destination_service_invalid',
  )
  if (sourceHealthcareServiceReference === destinationHealthcareServiceReference) {
    throw new TypeError('encounter_communication_distinct_services_required')
  }

  assertMovementStatuses(input.movementKind, input.sourceEncounterStatus, input.destinationEncounterStatus)
  const sourceGroups = assignmentGroups(input.sourceAssignments, sourceHealthcareServiceReference)
  const destinationGroups = assignmentGroups(input.destinationAssignments, destinationHealthcareServiceReference)
  const currentGroups = uniqueReferences(
    input.currentProfessionalGroupReferences,
    'encounter_communication_current_group_invalid',
  )
  const sourceGroupSet = new Set(sourceGroups)
  const nextGroups = input.movementKind === CareJourneyMovementKind.TemporaryTransfer
    ? unique([...currentGroups, ...sourceGroups, ...destinationGroups])
    : unique([...currentGroups.filter(groupReference => !sourceGroupSet.has(groupReference)), ...destinationGroups])
  const currentGroupSet = new Set(currentGroups)
  const nextGroupSet = new Set(nextGroups)

  const retainedProfessionalGroupReferences = currentGroups.filter(groupReference => nextGroupSet.has(groupReference))
  const addedProfessionalGroupReferences = nextGroups.filter(groupReference => !currentGroupSet.has(groupReference))
  const removedProfessionalGroupReferences = currentGroups.filter(groupReference => !nextGroupSet.has(groupReference))
  const idempotencyKey = requiredText(input.idempotencyKey, 'encounter_communication_idempotency_key_required')
  const communicationThreadId = requiredText(
    input.communicationThreadId,
    'encounter_communication_thread_id_required',
  )
  const subjectReference = reference(
    input.subjectReference,
    undefined,
    'encounter_communication_subject_invalid',
  )
  const occurredAt = instant(input.occurredAt, 'encounter_communication_occurred_at_invalid')

  return Object.freeze({
    idempotencyKey,
    communicationThreadId,
    retainedProfessionalGroupReferences: Object.freeze(retainedProfessionalGroupReferences),
    addedProfessionalGroupReferences: Object.freeze(addedProfessionalGroupReferences),
    removedProfessionalGroupReferences: Object.freeze(removedProfessionalGroupReferences),
    nextProfessionalGroupReferences: Object.freeze(nextGroups),
    familyJourneyEvent: Object.freeze({
      idempotencyKey,
      communicationThreadId,
      subjectReference,
      kind: input.movementKind,
      sourceEncounterReference,
      sourceEncounterStatus: input.sourceEncounterStatus,
      sourceHealthcareServiceReference,
      destinationEncounterReference,
      destinationEncounterStatus: input.destinationEncounterStatus,
      destinationHealthcareServiceReference,
      occurredAt,
    }),
  })
}

function assertMovementStatuses(
  movementKind: CareJourneyMovementKindValue,
  sourceStatus: EncounterStatusR5,
  destinationStatus: EncounterStatusR5,
): void {
  const expectedSourceStatus = movementKind === CareJourneyMovementKind.TemporaryTransfer
    ? EncounterStatusR5.OnHold
    : EncounterStatusR5.Completed
  if (sourceStatus !== expectedSourceStatus) throw new TypeError('encounter_communication_source_status_invalid')
  if (destinationStatus !== EncounterStatusR5.InProgress) {
    throw new TypeError('encounter_communication_destination_status_invalid')
  }
}

function assignmentGroups(
  assignments: readonly ProfessionalServiceGroupAssignment[],
  expectedServiceReference: string,
): readonly string[] {
  if (!Array.isArray(assignments) || assignments.length === 0) {
    throw new TypeError('encounter_communication_service_groups_required')
  }
  const normalized = assignments.map(normalizeProfessionalServiceGroupAssignment)
  if (normalized.some(assignment => assignment.healthcareServiceReference !== expectedServiceReference)) {
    throw new TypeError('encounter_communication_assignment_service_mismatch')
  }
  return unique(normalized.map(assignment => assignment.groupReference))
}

function uniqueReferences(values: readonly string[], error: string): readonly string[] {
  if (!Array.isArray(values)) throw new TypeError(error)
  return unique(values.map(value => reference(value, 'Group', error)))
}

function unique(values: readonly string[]): string[] {
  return [...new Set(values)]
}

function reference(value: unknown, expectedType: string | undefined, error: string): string {
  const normalized = requiredText(value, error)
  const match = /^([A-Z][A-Za-z0-9]+)\/([A-Za-z0-9.-]{1,128})$/u.exec(normalized)
  if (!match || (expectedType && match[1] !== expectedType)) throw new TypeError(error)
  return normalized
}

function instant(value: unknown, error: string): string {
  const normalized = requiredText(value, error)
  if (!/^\d{4}-\d{2}-\d{2}T/u.test(normalized) || Number.isNaN(Date.parse(normalized))) {
    throw new TypeError(error)
  }
  return new Date(Date.parse(normalized)).toISOString()
}

function requiredText(value: unknown, error: string): string {
  const normalized = String(value ?? '').trim()
  if (!normalized) throw new TypeError(error)
  return normalized
}
