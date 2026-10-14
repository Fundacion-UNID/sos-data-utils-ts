# Organization workflow access

Hospital and clinic workflows use the same authorization boundary. A FHIR
`Group` describes an operational team; membership is
not itself permission. Every permitted member also needs a separate active
FHIR `Consent` carrying the exact workflow capability.

## Test Network controller bootstrap

`buildTestNetworkControllerWorkflowSelfAssignment(...)` permits an
organization controller to add their own registered `PractitionerRole` to one
operational Group only in Test Network. The plan produces separate Group,
Group-member and active Consent entries and records the assignment as
`controller-self`. The BFF must prove that the controller profile and selected
professional member profile belong to the same authenticated account.

`buildTestNetworkControllerWorkflowAssignment(...)` covers the normal employee
case: the organization controller selects an active employee from the
server-read organization roster, and the BFF supplies that employee's exact
`PractitionerRole` and governed occupation. The browser cannot provide either
value. The employee may use a different authenticated account; account equality
is not clinical authority. The resulting assignment is recorded as
`controller-assigned`.

- `encounter-operations` accepts `organization/Encounter.cruds` and
  `organization/EncounterHistory.cruds`.
- `scheduling-operations` accepts `organization/Appointment.cruds`,
  `organization/Schedule.cruds` and `organization/Slot.cruds`.
- `clinical-contribution` accepts only `Subject/Composition.cuds`. `Subject`
  is the multisector alias for the governed individual; a FHIR compatibility
  adapter may project it to `Patient` for a FHIR/EHR sector without changing
  the stored authorization. It lets
  an assigned employee contribute or locate work items without granting
  Composition read. Group membership does not make that employee a clinical
  attester and does not authorize final index projection or delivery.

Clinical contribution, clinical attestation, subject-data reading, index
projection and Communication delivery remain independent decisions. The BFF
may expose opaque contribution state to a member without returning clinical
content. A later licensed professional must use their separately verified
`PractitionerRole` to review and attest before an authorized service projects
the final result into the subject index or sends it.

The organization, member and controller must match exactly. The Consent keeps
the exact operational Group in `Consent.sourceReference`, so the GW can prove
the selected `PractitionerRole` is a member of the same governed team. It keeps
the selected member profile's real `RESPRSN` or `ISCO-08|<code>` role; it does
not replace a clinical or administrative role with controller authority.
Browser-selected roles, ordinary employee status and Group membership never create authority.
Production self-assignment fails closed and requires a separately governed
approval policy.

## Subject and family journey access

`buildSubjectEncounterAccessConsent(...)` creates an active subject-controller
decision for one exact `Patient` and one exact `RelatedPerson`. It offers three
deliberately different views:

1. `current-location` returns the authorized active leaf Encounter only.
2. `open-encounters` permits `in-progress` and `on-hold` Encounters.
3. `full-history` permits every Encounter and its EncounterHistory records.

The complete journey needs the Encounter collection. EncounterHistory records
status and location transitions within an Encounter; it does not replace past
Encounter resources. The subject's communication Group remains a delivery
audience and never grants clinical or journey access.

The BFF/GW must evaluate the active Consent, subject, actor, purpose, requested
scope and current resource state before returning a projection. Portals may
hide unavailable controls but are not authorization authorities.

References: [FHIR R5 Encounter](https://hl7.org/fhir/R5/encounter.html),
[FHIR R5 EncounterHistory](https://hl7.org/fhir/R5/encounterhistory.html),
[FHIR R5 Appointment](https://hl7.org/fhir/R5/appointment.html),
[FHIR R5 Schedule](https://hl7.org/fhir/R5/schedule.html),
[FHIR R5 Slot](https://hl7.org/fhir/R5/slot.html), and
[FHIR R5 Consent](https://hl7.org/fhir/R5/consent.html).
