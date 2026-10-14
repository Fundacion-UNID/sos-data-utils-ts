# Exact-recipient emergency messaging

This contract prevents an authorized message from being delivered more widely
than intended. It applies to emergency-service
chat, patient-only information, one selected relative/caregiver and explicit
family/caregiver groups.

## The four different recipient cases

| User intent | Business recipient | Technical delivery |
| --- | --- | --- |
| Tell only the patient | exact `Patient` | one selected profile-device key |
| Tell one authorized person | exact `RelatedPerson` | that person's selected profile-device key |
| Tell an explicit group | `Group` | one separately authorized member-device route for every intended member |
| Start an emergency-service chat | exact `HealthcareService` | one admitted service-endpoint key |

When starting the `ServiceRequest`, the requester chooses who may receive the
thread: only the device being used, an explicit set of their devices, all of
their currently authorized devices, or exact authorized `RelatedPerson`
recipients. "All devices" is stored and processed as an atomic snapshot of
specific device-key identifiers; it is not an open-ended instruction to find
future devices.

For a response from a hospital or another professional service, the authorized
operator can select the patient, the controller and/or other exact authorized
`RelatedPerson` recipients. A department or professional-role `Group` can be
the operational sender or an explicitly selected functional recipient. It does
not add patients, controllers, relatives, professionals or devices implicitly.
When used as a recipient, it expands to independently encrypted routes for the
authorized `PractitionerRole` and device snapshot.

For example, an authorized mobile-emergency professional can start a patient
thread with two selected family members, later remove one from subsequent
messages, and add the destination hospital's physician and nursing Groups. The
patient remains the subject; each message records its own recipients. Earlier
recipients retain the authorized patient-journey trace already disclosed to
them but do not receive later clinical or internal messages unless selected
again.

### Emergency-team terminology by jurisdiction

Do not use `Paramedic` as the name of an entire ambulance crew. In Spain, model
a 112/061 advanced-life-support mobile unit as a service `Group` and preserve
the separate roles of emergency medical technician, nursing and, when the care
requires it, physician. The consolidated Spanish road-transport rule, Real
Decreto 836/2012 article 4, defines those staffing boundaries.

Use the jurisdiction-enabled `Paramedic` occupation only in countries where it
is the applicable professional role. Country role policy and service delivery
setting are separate: `mobile` identifies an ambulance/mobile unit and `fixed`
identifies a facility-based emergency service. The emergency telephone number
and local service name are deployment data, not occupation identifiers.

The patient is not automatically part of a caregiver/family Group. A spouse,
partner, parent, child or caregiver is not automatically authorized because of
the relationship label. Each message keeps the patient/animal concerned as its
subject while preserving the exact recipient separately.

An emergency service can be public or private: a human or animal hospital,
ambulance, firefighters, lifeguards, civil protection or another admitted
provider. It must publish an active service offer for the governed sector,
jurisdiction and coverage. Discovery in a marketplace does not grant clinical
access or prove that the service accepted the request.

The resulting journey normally creates an idempotent `ServiceRequest` and a
bidirectional `Communication` thread. Optional exact coordinates remain a
separate, purpose-limited `Location` disclosure. The service can acknowledge,
accept, reject, redirect and close the request, or escalate from text to audio
or video without exposing telephone numbers.

## Device expiry and coercion safety

The default choices are 5, 15 and 30 minutes. A deployment can offer another
positive duration. The effective lifetime is the shortest of the person's
choice, the service policy and the selected device policy.

At expiry, a cooperating client deletes encrypted content and local caches and
makes the content key unusable. Notification previews remain hidden. A
content-free audit record may retain sender/recipient references, purpose,
timestamps and delivery/expiry status. Expiry cannot guarantee removal of an
external screenshot, recording or copy made by a compromised device.

For a minor, shared device or possible coercion/abuse scenario, do not fan out
implicitly to other logged-in devices, representatives or relatives. An
explicit multi-device selection remains possible for resilience, such as a
charged reserve device during a natural disaster. Support per-device
revocation, discreet notifications and a quick exit. Whether a minor has a
confidential channel, and whether a representative may receive anything,
comes from applicable policy and verified authorization rather than this data
utility.

## Reusable snippets

Patient-only delivery:

```ts
import {
  DirectedMessageRecipientKind,
  DirectedMessageTargetKind,
  EmergencyServiceDeliverySetting,
  buildDirectedMessageDelivery,
} from 'sos-data-utils-ts/directed-message-delivery'

const patientDelivery = buildDirectedMessageDelivery({
  recipient: {
    kind: DirectedMessageRecipientKind.Individual,
    recipientReference: authorizedPatientReference,
  },
  target: {
    kind: DirectedMessageTargetKind.ProfileDevice,
    keyId: selectedProfileDeviceKeyId,
  },
  issuedAt: messageIssuedAt,
  requestedContentLifetimeMinutes: selectedContentLifetimeMinutes,
  serviceMaximumContentLifetimeMinutes,
  deviceMaximumContentLifetimeMinutes,
})
```

One authorized family member or caregiver:

```ts
const authorizedPersonDelivery = buildDirectedMessageDelivery({
  recipient: {
    kind: DirectedMessageRecipientKind.AuthorizedPerson,
    recipientReference: authorizedRelatedPersonReference,
  },
  target: {
    kind: DirectedMessageTargetKind.ProfileDevice,
    keyId: selectedProfileDeviceKeyId,
  },
  issuedAt: messageIssuedAt,
  requestedContentLifetimeMinutes: selectedContentLifetimeMinutes,
})
```

One exact member of an explicit group:

```ts
const groupMemberDelivery = buildDirectedMessageDelivery({
  recipient: {
    kind: DirectedMessageRecipientKind.ExplicitGroupMember,
    groupReference: authorizedCommunicationGroupReference,
    recipientReference: authorizedGroupMemberReference,
  },
  target: {
    kind: DirectedMessageTargetKind.ProfileDevice,
    keyId: selectedGroupMemberDeviceKeyId,
  },
  issuedAt: messageIssuedAt,
  requestedContentLifetimeMinutes: selectedContentLifetimeMinutes,
})
```

Emergency-service chat:

```ts
const emergencyServiceDelivery = buildDirectedMessageDelivery({
  recipient: {
    kind: DirectedMessageRecipientKind.EmergencyService,
    recipientReference: admittedHealthcareServiceReference,
    deliverySetting: EmergencyServiceDeliverySetting.Mobile,
  },
  target: {
    kind: DirectedMessageTargetKind.ServiceEndpoint,
    keyId: admittedServiceEndpointKeyId,
  },
  issuedAt: messageIssuedAt,
  requestedContentLifetimeMinutes: selectedContentLifetimeMinutes,
})
```

Each single-recipient snippet above builds one route. Group expansion, recipient authorization,
Consent, marketplace admission, endpoint-key resolution and persistence remain
server responsibilities and must fail closed.

An explicitly selected multi-device or multi-person audience builds several
independent routes:

```ts
import {
  DirectedMessageDeviceSelectionMode,
  buildDirectedMessageAudienceDeliveries,
} from 'sos-data-utils-ts/directed-message-delivery'

const selectedAudienceDeliveries = buildDirectedMessageAudienceDeliveries({
  audiences: [
    {
      recipient: {
        kind: DirectedMessageRecipientKind.Individual,
        recipientReference: authorizedPatientReference,
      },
      deviceSelectionMode: DirectedMessageDeviceSelectionMode.AllAuthorizedDevices,
      profileDeviceKeyIds: authorizedPatientDeviceKeySnapshot,
    },
    {
      recipient: {
        kind: DirectedMessageRecipientKind.AuthorizedPerson,
        recipientReference: authorizedControllerReference,
      },
      deviceSelectionMode: DirectedMessageDeviceSelectionMode.SelectedDevices,
      profileDeviceKeyIds: selectedControllerDeviceKeyIds,
    },
  ],
  issuedAt: messageIssuedAt,
  requestedContentLifetimeMinutes: selectedContentLifetimeMinutes,
})
```

Each returned entry still represents one exact recipient-device receipt with
its own encrypted envelope and expiry. The caller records the initiating
professional service/role separately as `Communication.sender`. A professional
Group is added to `Communication.recipient` only through an explicit recipient
selection and an authorized member-device snapshot.
