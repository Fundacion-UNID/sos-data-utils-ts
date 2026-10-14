import { HealthcareConsentPurposes } from 'gdc-common-utils-ts/constants/healthcare'
import {
  ClaimConsent,
  ConsentDecisions,
  ConsentStatuses,
} from 'gdc-common-utils-ts/models/consent-rule'

export const SubjectEncounterAccessViews = Object.freeze({
  CurrentLocation: 'current-location',
  OpenEncounters: 'open-encounters',
  FullHistory: 'full-history',
} as const)

export type SubjectEncounterAccessView =
  typeof SubjectEncounterAccessViews[keyof typeof SubjectEncounterAccessViews]

export const SubjectEncounterReadScopes = Object.freeze({
  InProgressEncounter: 'patient/Encounter.rs?status=in-progress',
  OnHoldEncounter: 'patient/Encounter.rs?status=on-hold',
  AllEncounters: 'patient/Encounter.rs',
  AllEncounterHistory: 'patient/EncounterHistory.rs',
} as const)

export type SubjectEncounterReadScope =
  typeof SubjectEncounterReadScopes[keyof typeof SubjectEncounterReadScopes]

export type SubjectEncounterAccessConsent = Readonly<{
  view: SubjectEncounterAccessView
  projection: 'current-leaf' | 'open-encounters' | 'full-history'
  scopes: readonly SubjectEncounterReadScope[]
  authorization: Readonly<{
    type: 'Consent-v5.0.0'
    resource: Readonly<{
      resourceType: 'Consent'
      id: string
      meta: Readonly<{ claims: Readonly<Record<string, string>> }>
    }>
    request: Readonly<{ method: 'POST'; url: 'Consent' }>
  }>
}>

/**
 * Builds one subject-controller decision for a RelatedPerson's patient-journey
 * read access. The current-location projection returns only the active leaf
 * Encounter after authorization; open encounters include `in-progress` and
 * `on-hold`; full history includes every Encounter plus the status/location
 * transitions represented by EncounterHistory.
 *
 * Membership in a subject communication Group is deliberately absent and
 * grants no access. The active Consent binds one Patient and one RelatedPerson.
 *
 * @see https://hl7.org/fhir/R5/encounter.html
 * @see https://hl7.org/fhir/R5/encounterhistory.html
 * @see https://hl7.org/fhir/R5/consent.html
 */
export function buildSubjectEncounterAccessConsent(input: Readonly<{
  consentId: string
  subjectReference: string
  memberReference: string
  memberRole: string
  view: SubjectEncounterAccessView
  grantedAt: string
}>): SubjectEncounterAccessConsent {
  const consentId = exactId(input.consentId, 'subject_encounter_consent_id_invalid')
  const subjectReference = exactReference(
    input.subjectReference,
    'Patient',
    'subject_encounter_subject_reference_invalid',
  )
  const memberReference = exactReference(
    input.memberReference,
    'RelatedPerson',
    'subject_encounter_member_reference_invalid',
  )
  const memberRole = required(input.memberRole, 'subject_encounter_member_role_required')
  const view = exactView(input.view)
  const grantedAt = exactInstant(input.grantedAt)
  const { projection, scopes } = encounterView(view)
  return Object.freeze({
    view,
    projection,
    scopes,
    authorization: Object.freeze({
      type: 'Consent-v5.0.0' as const,
      resource: Object.freeze({
        resourceType: 'Consent' as const,
        id: consentId,
        meta: Object.freeze({ claims: Object.freeze({
          '@context': 'org.hl7.fhir.api',
          [ClaimConsent.status]: ConsentStatuses.Active,
          [ClaimConsent.decision]: ConsentDecisions.Permit,
          [ClaimConsent.purpose]: HealthcareConsentPurposes.CareManagement,
          [ClaimConsent.subject]: subjectReference,
          [ClaimConsent.actorIdentifier]: memberReference,
          [ClaimConsent.actorRole]: memberRole,
          [ClaimConsent.action]: scopes.join(','),
          [ClaimConsent.date]: grantedAt,
          [ClaimConsent.grantor]: subjectReference,
          [ClaimConsent.grantee]: memberReference,
          [ClaimConsent.identifier]: `urn:uuid:${consentId}`,
        }) }),
      }),
      request: Object.freeze({ method: 'POST' as const, url: 'Consent' as const }),
    }),
  })
}

function encounterView(view: SubjectEncounterAccessView): Readonly<{
  projection: SubjectEncounterAccessConsent['projection']
  scopes: readonly SubjectEncounterReadScope[]
}> {
  if (view === SubjectEncounterAccessViews.CurrentLocation) return Object.freeze({
    projection: 'current-leaf' as const,
    scopes: Object.freeze([SubjectEncounterReadScopes.InProgressEncounter]),
  })
  if (view === SubjectEncounterAccessViews.OpenEncounters) return Object.freeze({
    projection: 'open-encounters' as const,
    scopes: Object.freeze([
      SubjectEncounterReadScopes.InProgressEncounter,
      SubjectEncounterReadScopes.OnHoldEncounter,
    ]),
  })
  return Object.freeze({
    projection: 'full-history' as const,
    scopes: Object.freeze([
      SubjectEncounterReadScopes.AllEncounters,
      SubjectEncounterReadScopes.AllEncounterHistory,
    ]),
  })
}

function exactView(value: string): SubjectEncounterAccessView {
  if (!Object.values(SubjectEncounterAccessViews).includes(value as SubjectEncounterAccessView)) {
    throw new TypeError('subject_encounter_access_view_invalid')
  }
  return value as SubjectEncounterAccessView
}

function exactReference(value: string, resourceType: string, error: string): string {
  const normalized = String(value ?? '').trim()
  if (!new RegExp(`^${resourceType}/[A-Za-z0-9.-]{1,64}$`, 'u').test(normalized)) throw new TypeError(error)
  return normalized
}

function exactId(value: string, error: string): string {
  const normalized = String(value ?? '').trim()
  if (!/^[A-Za-z0-9.-]{1,64}$/u.test(normalized)) throw new TypeError(error)
  return normalized
}

function exactInstant(value: string): string {
  const normalized = String(value ?? '').trim()
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?Z$/u.test(normalized)
    || !Number.isFinite(Date.parse(normalized))) throw new TypeError('subject_encounter_granted_at_invalid')
  return normalized
}

function required(value: string, error: string): string {
  const normalized = String(value ?? '').trim()
  if (!normalized) throw new TypeError(error)
  return normalized
}
