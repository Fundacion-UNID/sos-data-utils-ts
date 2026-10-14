// Flow contract: 1) accept a confirmed Encounter movement; 2) retain, add or remove only professional Groups assigned to its exact HealthcareServices; 3) update only the future emergency-channel audience; 4) emit a family-safe journey event without professional membership or transport data. Authorization invariant: Encounter status and Group assignment are required inputs but never grant access by themselves. Persistence invariant: previous Communication recipients remain immutable and every audience change is idempotent.
import assert from 'node:assert/strict'
import test from 'node:test'

import { EncounterStatusR5, FHIR_ENCOUNTER_TRANSFER_TEST_DATA } from 'fhir-data-utils-ts'
import {
  CareJourneyMovementKind,
  reconcileEncounterCommunicationAudience,
} from '../dist/encounter-communication-audience.js'
import { REPOSITORY_SAFE_EXAMPLES } from '../dist/repository-privacy.js'

const transferData = FHIR_ENCOUNTER_TRANSFER_TEST_DATA
const sourceDepartmentReference = `Organization/source-${REPOSITORY_SAFE_EXAMPLES.resourceUuid}`
const destinationDepartmentReference = `Organization/destination-${REPOSITORY_SAFE_EXAMPLES.resourceUuid}`
const sourceMedicalGroupReference = `Group/source-medical-${REPOSITORY_SAFE_EXAMPLES.resourceUuid}`
const sourceNursingGroupReference = `Group/source-nursing-${REPOSITORY_SAFE_EXAMPLES.resourceUuid}`
const destinationMedicalGroupReference = `Group/destination-medical-${REPOSITORY_SAFE_EXAMPLES.resourceUuid}`
const destinationNursingGroupReference = `Group/destination-nursing-${REPOSITORY_SAFE_EXAMPLES.resourceUuid}`

const sourceAssignments = Object.freeze([
  {
    groupReference: sourceMedicalGroupReference,
    departmentOrganizationReference: sourceDepartmentReference,
    healthcareServiceReference: transferData.source.serviceReference,
  },
  {
    groupReference: sourceNursingGroupReference,
    departmentOrganizationReference: sourceDepartmentReference,
    healthcareServiceReference: transferData.source.serviceReference,
  },
])
const destinationAssignments = Object.freeze([
  {
    groupReference: destinationMedicalGroupReference,
    departmentOrganizationReference: destinationDepartmentReference,
    healthcareServiceReference: transferData.destination.serviceReference,
  },
  {
    groupReference: destinationNursingGroupReference,
    departmentOrganizationReference: destinationDepartmentReference,
    healthcareServiceReference: transferData.destination.serviceReference,
  },
])

const baseMovement = Object.freeze({
  idempotencyKey: transferData.communicationIdentifier,
  communicationThreadId: REPOSITORY_SAFE_EXAMPLES.resourceUuid,
  subjectReference: transferData.subjectReference,
  sourceEncounterReference: transferData.source.reference,
  sourceHealthcareServiceReference: transferData.source.serviceReference,
  destinationEncounterReference: transferData.destination.reference,
  destinationHealthcareServiceReference: transferData.destination.serviceReference,
  occurredAt: transferData.occurredAt,
  handoverAccepted: true,
  sourceAssignments,
  destinationAssignments,
})

test('replaces mobile-service Groups with emergency-department Groups after accepted permanent handover', () => {
  const reconciliation = reconcileEncounterCommunicationAudience({
    ...baseMovement,
    movementKind: CareJourneyMovementKind.PermanentTransfer,
    sourceEncounterStatus: EncounterStatusR5.Completed,
    destinationEncounterStatus: EncounterStatusR5.InProgress,
    currentProfessionalGroupReferences: [sourceMedicalGroupReference, sourceNursingGroupReference],
  })

  assert.deepEqual(reconciliation.retainedProfessionalGroupReferences, [])
  assert.deepEqual(reconciliation.addedProfessionalGroupReferences, [
    destinationMedicalGroupReference,
    destinationNursingGroupReference,
  ])
  assert.deepEqual(reconciliation.removedProfessionalGroupReferences, [
    sourceMedicalGroupReference,
    sourceNursingGroupReference,
  ])
  assert.deepEqual(reconciliation.nextProfessionalGroupReferences, [
    destinationMedicalGroupReference,
    destinationNursingGroupReference,
  ])
  assert.equal(reconciliation.familyJourneyEvent.kind, CareJourneyMovementKind.PermanentTransfer)
  assert.equal('professionalGroupReferences' in reconciliation.familyJourneyEvent, false)
  assert.equal('transportEndpoint' in reconciliation.familyJourneyEvent, false)
})

test('retains the home-service Groups while a temporary destination Encounter is active', () => {
  const reconciliation = reconcileEncounterCommunicationAudience({
    ...baseMovement,
    movementKind: CareJourneyMovementKind.TemporaryTransfer,
    sourceEncounterStatus: EncounterStatusR5.OnHold,
    destinationEncounterStatus: EncounterStatusR5.InProgress,
    currentProfessionalGroupReferences: [sourceMedicalGroupReference, sourceNursingGroupReference],
  })

  assert.deepEqual(reconciliation.retainedProfessionalGroupReferences, [
    sourceMedicalGroupReference,
    sourceNursingGroupReference,
  ])
  assert.deepEqual(reconciliation.addedProfessionalGroupReferences, [
    destinationMedicalGroupReference,
    destinationNursingGroupReference,
  ])
  assert.deepEqual(reconciliation.removedProfessionalGroupReferences, [])
})

test('removes temporary-service Groups when the patient returns to the previous service', () => {
  const reconciliation = reconcileEncounterCommunicationAudience({
    ...baseMovement,
    movementKind: CareJourneyMovementKind.ReturnTransfer,
    sourceEncounterStatus: EncounterStatusR5.Completed,
    destinationEncounterStatus: EncounterStatusR5.InProgress,
    currentProfessionalGroupReferences: [
      sourceMedicalGroupReference,
      sourceNursingGroupReference,
      destinationMedicalGroupReference,
      destinationNursingGroupReference,
    ],
    sourceHealthcareServiceReference: transferData.destination.serviceReference,
    destinationHealthcareServiceReference: transferData.source.serviceReference,
    sourceAssignments: destinationAssignments,
    destinationAssignments: sourceAssignments,
  })

  assert.deepEqual(reconciliation.removedProfessionalGroupReferences, [
    destinationMedicalGroupReference,
    destinationNursingGroupReference,
  ])
  assert.deepEqual(reconciliation.nextProfessionalGroupReferences, [
    sourceMedicalGroupReference,
    sourceNursingGroupReference,
  ])
})

test('fails closed before handover or when Encounter statuses and service assignments do not match the movement', () => {
  assert.throws(() => reconcileEncounterCommunicationAudience({
    ...baseMovement,
    movementKind: CareJourneyMovementKind.PermanentTransfer,
    sourceEncounterStatus: EncounterStatusR5.Completed,
    destinationEncounterStatus: EncounterStatusR5.InProgress,
    currentProfessionalGroupReferences: sourceAssignments.map(({ groupReference }) => groupReference),
    handoverAccepted: false,
  }), /encounter_communication_handover_not_accepted/)

  assert.throws(() => reconcileEncounterCommunicationAudience({
    ...baseMovement,
    movementKind: CareJourneyMovementKind.TemporaryTransfer,
    sourceEncounterStatus: EncounterStatusR5.Completed,
    destinationEncounterStatus: EncounterStatusR5.InProgress,
    currentProfessionalGroupReferences: sourceAssignments.map(({ groupReference }) => groupReference),
  }), /encounter_communication_source_status_invalid/)

  assert.throws(() => reconcileEncounterCommunicationAudience({
    ...baseMovement,
    movementKind: CareJourneyMovementKind.PermanentTransfer,
    sourceEncounterStatus: EncounterStatusR5.Completed,
    destinationEncounterStatus: EncounterStatusR5.InProgress,
    currentProfessionalGroupReferences: sourceAssignments.map(({ groupReference }) => groupReference),
    destinationAssignments: sourceAssignments,
  }), /encounter_communication_assignment_service_mismatch/)
})
