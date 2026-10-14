# Exact-recipient contract

## Recipient mapping

| Intent | Communication recipient | Exact delivery recipient | Target |
| --- | --- | --- | --- |
| Patient only | `Patient` | same `Patient` | one profile-device key |
| One authorized person | `RelatedPerson` | same `RelatedPerson` | one profile-device key |
| Explicit family/caregiver group | `Group` | one authorized `Patient` or `RelatedPerson` member per route | that member's selected profile-device key |
| Emergency service chat | `HealthcareService` | same `HealthcareService` | one admitted service-endpoint key |

`Communication.subject` identifies the patient/animal concerned and does not
change the recipient. A profile-device key is technical routing, not the
clinical/legal recipient. Device possession, kinship, caregiver status, group
membership and marketplace discovery never imply Consent.

The `ServiceRequest` initiator explicitly selects the current device, selected
devices, all currently authorized devices and/or exact authorized persons.
Resolve every selection to immutable recipient-device routes at send time. A
professional service or role Group may be `Communication.sender` context or an
explicit functional recipient. A recipient Group expands only to an authorized
`PractitionerRole` and device snapshot; it never supplies an implicit recipient
list. Responses can target the patient, controller, selected authorized
`RelatedPerson` records and explicit destination-service Groups independently.

Do not collapse a mobile emergency team into `Paramedic`. Use the paramedic
occupation only where enabled by jurisdiction policy. In Spain, represent the
112/061 mobile service as a Group with separate emergency-technician, nursing
and applicable physician PractitionerRoles. Model `mobile` versus `fixed` on
the selected HealthcareService independently from occupation availability.

## Expiry and safety

Offer the shared 5, 15 and 30 minute values plus deployment-governed positive
durations. Use the shortest value among the person's request, service maximum
and device maximum. Expiry removes content and usable key material from a
cooperating client. Keep only content-free delivery/audit metadata.

For a shared or monitored device, require no-preview notifications, a quick
exit, per-device revocation and no automatic multi-device delivery. Do not
claim prevention of screenshots, external recording or compromise. A minor's
confidential channel and representative access require the applicable
jurisdiction and care-context policy; never infer either in shared utilities.

## Test invariants

Prove positive patient-only, exact-RelatedPerson, explicit-group-member and
emergency-service routes, destination professional-Group members, plus
current-device and explicit multi-device selection. Prove negative no implicit
fan-out, no implicit patient in a group, duplicate device delivery,
current-device widening, resource-type mismatch, target-kind mismatch, invalid
duration and no plaintext destination/content in the route. Use named values from
`repository-privacy` rather than repeated identity, domain or telephone
literals.
