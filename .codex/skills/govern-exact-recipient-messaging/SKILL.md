---
name: govern-exact-recipient-messaging
description: Implement or audit Communication delivery when privacy requires one exact patient, authorized person, explicit group member, profile-device or emergency-service endpoint. Use for no-fan-out routing, device-specific expiry, discreet notifications, minors or coercion-risk scenarios. Do not use it to infer Consent, relationship authority or emergency-service admission.
---

# Govern Exact Recipient Messaging

Use `sos-data-utils-ts/directed-message-delivery` as the canonical data
contract. Build one route per exact delivery receipt only after the caller has
verified recipient authority, purpose, active relationship or group membership,
and the selected device/service key.

Preserve these boundaries:

- A patient-only message targets that `Patient` and one selected
  `profile-device`; it never reaches representatives automatically.
- A message for one relative/caregiver targets the exact `RelatedPerson`; the
  relationship label alone grants nothing.
- A `Group` is intentional audience context. Expand it into separate exact
  member-device routes, and never add the patient implicitly.
- The requester may explicitly select the current device, selected devices or
  all currently authorized devices. Resolve "all" to an atomic key snapshot;
  never treat it as permission for future devices.
- A professional department/service/role Group can be sender context or an
  explicitly selected functional recipient. As recipient, expand it only to
  authorized `PractitionerRole` members and their selected device snapshot.
  The operator separately selects the patient, controller and any exact
  authorized `RelatedPerson` recipients.
- An admitted emergency service targets one `HealthcareService` and one
  `service-endpoint`; catalogue discovery does not itself authorize delivery.
- Content expiry deletes cooperating-client ciphertext/cache and destroys its
  usable key while retaining content-free audit metadata. Never promise that a
  compromised device cannot take an external copy.
- Hide notification previews and never put protected content, telephone
  numbers, endpoint addresses or secrets in routing/audit records.
- For an accepted Encounter handover, use
  `reconcileEncounterCommunicationAudience` to change only future professional
  recipients. Permanent movement removes source-service Groups; temporary
  movement retains them until return. Never rewrite a sent Communication.

Read [references/contract.md](references/contract.md) when changing UI,
transport, FHIR projection, expiry, safety-mode or test journeys. Keep code
examples based on `REPOSITORY_SAFE_EXAMPLES` and run the repository privacy
gate before every commit, merge, publication or push.

Read [references/encounter-audience.md](references/encounter-audience.md) when
the work includes arrival, handover, transfer, temporary diagnostics, return
or discharge.
