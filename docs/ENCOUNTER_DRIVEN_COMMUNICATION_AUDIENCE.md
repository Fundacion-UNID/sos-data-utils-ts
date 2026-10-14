# Encounter-driven emergency-channel audience

An emergency communication channel follows the patient's accepted care
journey. It does not rely on a professional manually adding every destination
team, and it never rewrites the recipients of a Communication already sent.

## Movement rules

| Accepted movement | Source Encounter | Destination Encounter | Future professional audience |
| --- | --- | --- | --- |
| Permanent handover | `completed` | `in-progress` | remove source-service Groups; add destination-service Groups |
| Temporary visit | `on-hold` | `in-progress` | retain source-service Groups; add temporary destination Groups |
| Return from temporary visit | `completed` | `in-progress` | remove temporary-service Groups; restore/retain home-service Groups |

The audience changes only after the destination accepts handover. A planned
transfer, transport request or QR scan does not change channel membership.
Repeated processing of the same idempotency key must produce the same result.

Every `HealthcareService` can have several stable professional Groups, such as
medicine and nursing. The BFF resolves the currently governed assignments and
authorizes the Encounter transition before calling this package. Group members
and their devices can change by shift; Group membership itself never grants
clinical access.

Family recipients are a separate audience. They receive a purpose-limited
journey event containing the subject, source/destination Encounter and service,
statuses and time. It contains no professional membership, endpoint, telephone
number, encryption material or internal clinical message. Removing a family or
professional recipient affects future messages only.

## Reusable snippet

```ts
import { EncounterStatusR5 } from 'fhir-data-utils-ts'
import {
  CareJourneyMovementKind,
  reconcileEncounterCommunicationAudience,
} from 'sos-data-utils-ts/encounter-communication-audience'

const audienceChange = reconcileEncounterCommunicationAudience({
  idempotencyKey: acceptedHandoverIdempotencyKey,
  communicationThreadId: emergencyThreadId,
  subjectReference: authorizedSubjectReference,
  movementKind: returnsToSourceService
    ? CareJourneyMovementKind.TemporaryTransfer
    : CareJourneyMovementKind.PermanentTransfer,
  sourceEncounterReference,
  sourceEncounterStatus: returnsToSourceService
    ? EncounterStatusR5.OnHold
    : EncounterStatusR5.Completed,
  sourceHealthcareServiceReference,
  sourceAssignments: authorizedSourceServiceGroupAssignments,
  destinationEncounterReference,
  destinationEncounterStatus: EncounterStatusR5.InProgress,
  destinationHealthcareServiceReference,
  destinationAssignments: authorizedDestinationServiceGroupAssignments,
  currentProfessionalGroupReferences,
  occurredAt: acceptedHandoverInstant,
  handoverAccepted: true,
})
```

Persist `nextProfessionalGroupReferences` as the audience for subsequent
messages, emit `familyJourneyEvent` through the separately authorized
family-facing projection and leave every historical Communication unchanged.
