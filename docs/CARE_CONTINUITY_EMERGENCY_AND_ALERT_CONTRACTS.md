# Shared care-continuity, emergency-request and alert contracts

This package is the neutral data-contract owner for three reusable workflows.
Application authorization and UI remain outside this repository; FHIR claims and projection mechanics
remain in `fhir-data-utils-ts`; reusable orchestration belongs in
`sos-sdk-core-ts`.

## Contract inventory

| Workflow | FHIR data graph | Shared SOS data contract | Runtime owner |
| --- | --- | --- | --- |
| Care journey | Appointment -> Encounter, child Encounter through `partOf`, Location and R5 EncounterHistory | validated transition intent and safe journey-projection input/output types | product BFF/GW policy plus shared SDK orchestration |
| Hospital-family communication | Encounter-scoped Communication references only; clinical results remain independent | recipient/thread request schema without private destinations | secure Chat transport composed by the product BFF |
| Resilient emergency request | ServiceRequest received by a HealthcareService/Organization; independent Task queue | request, acknowledgement and triage schemas with server-authored actor fields | SOSChain specialization and product adapters |
| Governed alert campaign | definitional Group, evaluated snapshot/enumerated Group, CommunicationRequest/Task and Communication deliveries | campaign definition, cohort snapshot, exclusion and delivery-audit schemas | public-health/blood-service specialization |
| Event wake-up | R5 SubscriptionTopic/Subscription | allowed trigger/filter descriptor only | server subscription engine |

## Non-negotiable semantics

- Appointment is planned activity; Encounter is actual activity. A fulfilled
  Appointment may idempotently create an Encounter but never substitutes for
  it.
- Calls and missed-call messages neither attest nor publish clinical data.
  WebRTC destinations, SDP/ICE, TURN credentials and keys are transport state,
  not FHIR or index claims.
- ServiceRequest expresses the request. Task expresses triage/assignment and
  work progress. Neither lifecycle silently rewrites the other.
- Subscription is an event wake-up mechanism. It is not a population query,
  recipient Consent or campaign-send authority.
- Group definitions and evaluated recipient snapshots are distinct. Product
  services evaluate criteria under an authorized search, freeze an auditable
  snapshot, and recheck exclusion, Consent and channel authority before each
  delivery.
- A subject's emergency-update audience and care-continuity audience are
  separate purpose-aware Groups. Emergency status does not silently enroll a
  parent, guardian or caregiver for later discharge, newborn or long-term care
  instructions. Exact active relationships, Consent and recipients are checked
  independently for each message.
- Organization `partOf` describes hierarchy only. HealthcareService and
  Location describe operational services and places. None of them grants
  subject access or broadcast rights.
- Emergency intake targets the applicable per-offer HealthcareService
  (or the owning department Organization compatibility path), while its
  independent triage Task is owned by one enumerated professional Group. A
  controller/member reply addresses that Group. A professional reply uses the
  department Organization as FHIR Communication sender and preserves the
  actual member/PractitionerRole or device separately as transport actor.
- A legal Organization is the author of its clinical document. The acting
  professional attester, authenticated transport actor and Communication
  sender remain independent identities. A Group is never substituted as
  document author or human sender.
- An accepted Encounter handover reconciles the future emergency-channel
  professional audience from the exact source and destination
  HealthcareService Group assignments. Permanent movement removes the source
  Groups; temporary movement retains them until return. Historical
  Communication recipients remain immutable. See
  [ENCOUNTER_DRIVEN_COMMUNICATION_AUDIENCE.md](ENCOUNTER_DRIVEN_COMMUNICATION_AUDIENCE.md).

## Placement for a proving implementation

An application owns its UI and policy proof. A secure messaging service owns
only sealed call signaling/audit and encrypted fallback envelopes. Shared
schemas and builders introduced by an implementation land here only when they
remain consumer-independent; runtime authorization and sector-specific
decisions stay outside this data package.

Each implementation test must begin with the numbered journey and its
authorization and persistence invariants. Real local UI -> BFF -> high-level
SDK -> service Playwright without skips precedes Test Network and staging.

## Implemented shared records

`care-emergency-alert-records` now validates the channel-neutral records used
by the proving implementation:

- `normalizeCareJourneyTransition(...)` accepts only the idempotent fulfilled
  Appointment transition inputs needed to create the parent Encounter. It
  contains no destination, signaling or key material.
- `normalizeEmergencyIntake(...)` correlates the ServiceRequest, independent
  triage Task and secure communication thread. Telephone/email destinations,
  SDP/ICE, TURN credentials and encryption keys are rejected as transport
  state.
- `reconcileEncounterCommunicationAudience(...)` calculates the idempotent
  retained/added/removed Group delta after accepted handover and emits a
  family-safe journey event without membership or transport state.
- `buildSubjectCommunicationPurposeGroupReference(...)` derives distinct
  opaque emergency-update and care-continuity Group references while retaining
  the older subject-access reference unchanged for compatibility reads.
- `normalizeGovernedAlertCampaign(...)` distinguishes blood-donation and
  public-risk campaigns. Donation requires compact blood-group codes and the
  minimum interval since donation; public risk requires explicit governed FHIR
  resource/SearchParameter/value criteria. Both retain jurisdiction, explicit
  exclusions, subscribed topic and preferred BCP 47 languages.
- `freezeGovernedAlertCohort(...)` records the evaluated Group snapshot and
  query fingerprint, while `recordGovernedAlertDelivery(...)` requires fresh
  eligibility, exclusion, Consent and channel-authority evidence before a
  delivery can be recorded as sent.

`emergency-group` no longer writes `ServiceRequest.code-system`,
`ServiceRequest.code-display`, `ServiceRequest.subject-type` or a duplicated
member list on ServiceRequest. Members live only on an enumerated Group. The
request uses the canonical compact `system|code`, preserves optional local
`code-text`, and delegates its FHIR claims to `fhir-data-utils-ts`.

The department, service, Place/media and professional-Group catalog contract is
documented in [ORGANIZATION_SERVICE_CATALOG.md](ORGANIZATION_SERVICE_CATALOG.md).
