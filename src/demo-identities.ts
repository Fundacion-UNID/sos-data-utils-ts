import {
  FHIR_ENCOUNTER_TRANSFER_TEST_DATA,
  fhirInstantToEpochSeconds,
} from 'fhir-data-utils-ts'
import { REPOSITORY_SAFE_EXAMPLES } from './repository-privacy.js'

export const SosDemoProfessionalRoleIds = Object.freeze({
  Doctor: 'doctor',
  Nurse: 'nurse',
  AdministrativeAssistant: 'administrative-assistant',
  Firefighter: 'firefighter',
} as const)

export type SosDemoProfessionalRoleId =
  typeof SosDemoProfessionalRoleIds[keyof typeof SosDemoProfessionalRoleIds]

export type SosDemoPerson = Readonly<{
  givenName: string
  familyName: string
  displayName: string
}>

export type SosDemoEmergencyContact = SosDemoPerson & Readonly<{
  identifier: string
  relationshipLabel: string
  phoneE164: string
  phoneDisplay: string
}>

export type SosDemoProfessional = SosDemoPerson & Readonly<{
  roleId: SosDemoProfessionalRoleId
  roleLabel: string
  displayLabel: string
}>

/** North American fictional-use telephone range used by all shared demos. */
export const SOS_DEMO_FICTIONAL_PHONE_DISPLAY_PATTERN = /555-01\d{2}$/

const buildDemoPerson = (givenName: string): SosDemoPerson => Object.freeze({
  givenName,
  familyName: REPOSITORY_SAFE_EXAMPLES.personFamilyName,
  displayName: `${givenName} ${REPOSITORY_SAFE_EXAMPLES.personFamilyName}`,
})

const buildDemoProfessional = (
  givenName: string,
  roleId: SosDemoProfessionalRoleId,
  roleLabel: string,
): SosDemoProfessional => {
  const person = buildDemoPerson(givenName)
  return Object.freeze({ ...person, roleId, roleLabel, displayLabel: `${givenName} — ${roleLabel}` })
}

/**
 * Shared non-operational identities for portal, telephone, chat and docs.
 *
 * A professional role is presentation and test data only. It never replaces
 * PractitionerRole, employment, licensing, Consent or authorization evidence.
 */
export const SOS_DEMO_IDENTITIES = Object.freeze({
  fictionalPhoneDisplayPattern: SOS_DEMO_FICTIONAL_PHONE_DISPLAY_PATTERN,
  individual: buildDemoPerson(REPOSITORY_SAFE_EXAMPLES.individualGivenName),
  emergencyContacts: Object.freeze([
    Object.freeze({
      ...buildDemoPerson(REPOSITORY_SAFE_EXAMPLES.firstContactGivenName),
      identifier: REPOSITORY_SAFE_EXAMPLES.firstContactIdentifier,
      relationshipLabel: 'Sibling',
      phoneE164: REPOSITORY_SAFE_EXAMPLES.firstContactPhoneE164,
      phoneDisplay: REPOSITORY_SAFE_EXAMPLES.firstContactPhoneDisplay,
    }),
    Object.freeze({
      ...buildDemoPerson(REPOSITORY_SAFE_EXAMPLES.secondContactGivenName),
      identifier: REPOSITORY_SAFE_EXAMPLES.secondContactIdentifier,
      relationshipLabel: 'Parent',
      phoneE164: REPOSITORY_SAFE_EXAMPLES.secondContactPhoneE164,
      phoneDisplay: REPOSITORY_SAFE_EXAMPLES.secondContactPhoneDisplay,
    }),
  ]),
  professionals: Object.freeze({
    doctor: buildDemoProfessional('Alex', SosDemoProfessionalRoleIds.Doctor, 'Doctor'),
    nurse: buildDemoProfessional('Casey', SosDemoProfessionalRoleIds.Nurse, 'Nurse'),
    administrativeAssistant: buildDemoProfessional('Jordan', SosDemoProfessionalRoleIds.AdministrativeAssistant, 'Administrative assistant'),
    firefighter: buildDemoProfessional('Riley', SosDemoProfessionalRoleIds.Firefighter, 'Firefighter'),
  }),
})

export type SosEncounterDisplayIdentifierInput = Readonly<{
  occurredAt: string
  collisionSequence?: number
}>

/**
 * Builds a readable provider business identifier from a FHIR instant.
 *
 * The ten epoch-second digits are displayed as `XX-XXXX-XXXX`. A provider may
 * append a two-digit sequence allocated atomically within the same assigner
 * and second. It must never alter the clinical instant to avoid a collision.
 * The resulting display identifier is not `Encounter.id` and lookup must
 * verify the exact assigning organization and `Encounter.subject`.
 */
export function buildSosEncounterDisplayIdentifier(input: SosEncounterDisplayIdentifierInput): string {
  const epochSeconds = String(fhirInstantToEpochSeconds(input.occurredAt))
  if (!/^\d{10}$/.test(epochSeconds)) throw new TypeError('encounter_epoch_seconds_must_have_ten_digits')
  const collisionSequence = input.collisionSequence ?? 0
  if (!Number.isInteger(collisionSequence) || collisionSequence < 0 || collisionSequence > 99) {
    throw new TypeError('encounter_collision_sequence_invalid')
  }
  const readableEpoch = `${epochSeconds.slice(0, 2)}-${epochSeconds.slice(2, 6)}-${epochSeconds.slice(6)}`
  const sequenceSuffix = collisionSequence === 0 ? '' : `-${String(collisionSequence).padStart(2, '0')}`
  return `ENC-${readableEpoch}${sequenceSuffix}`
}

const encounterOccurredAt = FHIR_ENCOUNTER_TRANSFER_TEST_DATA.occurredAt

/** Named encounter example shared by UIs, tests and high-level documentation. */
export const SOS_ENCOUNTER_IDENTIFIER_EXAMPLE = Object.freeze({
  occurredAt: encounterOccurredAt,
  resourceId: FHIR_ENCOUNTER_TRANSFER_TEST_DATA.source.id,
  subjectReference: FHIR_ENCOUNTER_TRANSFER_TEST_DATA.subjectReference,
  displayIdentifier: buildSosEncounterDisplayIdentifier({ occurredAt: encounterOccurredAt }),
  firstCollisionDisplayIdentifier: buildSosEncounterDisplayIdentifier({
    occurredAt: encounterOccurredAt,
    collisionSequence: 1,
  }),
})
