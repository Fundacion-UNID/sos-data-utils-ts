# Organization-scoped resource identities

Organization-owned catalog and scheduling resources use one host-independent
identity tree rooted at the legal Organization URN. A DID remains a routing and
cryptographic identifier; it never replaces this business identity.

```text
<organizationUrn>:department:<departmentUuid>
<departmentUrn>:service:<serviceUuid>
<departmentUrn>:place:<placeUuid>
<serviceUrn>:schedule:<scheduleUuid>
<scheduleUrn>:slot:<startEpochSeconds>-<endEpochSeconds>
```

The final Slot component is one interval segment. Both values are UTC Unix
seconds. FHIR `instant` inputs may contain fractional seconds, but identity
normalization discards that fraction and requires the normalized end to be
strictly later than the normalized start.

Use `buildOrganizationScopedResourceUrn(...)` for department, service, place
and schedule URNs. Use `buildScheduleSlotIdentity(...)` for slots. The returned
`identifier` is the exact full URN stored as the logical Identifier. The
returned `id` is
`multibase(base58btc(multihash(SHA3-256(exact UTF-8 URN))))`, which is stable
and fits the 64-character FHIR `Resource.id` limit.

```ts
import {
  buildOrganizationScopedResourceIdentity,
  buildOrganizationScopedResourceUrn,
  buildScheduleSlotIdentity,
} from 'sos-data-utils-ts/organization-scoped-resource-identity'
import { REPOSITORY_SAFE_EXAMPLES } from 'sos-data-utils-ts/repository-privacy'

const example = REPOSITORY_SAFE_EXAMPLES.organizationScopedResources
const departmentUrn = buildOrganizationScopedResourceUrn({
  parentUrn: example.organizationUrn,
  kind: 'department',
  resourceUuid: example.departmentUuid,
})
const serviceUrn = buildOrganizationScopedResourceUrn({
  parentUrn: departmentUrn,
  kind: 'service',
  resourceUuid: example.serviceUuid,
})
const schedule = buildOrganizationScopedResourceIdentity({
  parentUrn: serviceUrn,
  kind: 'schedule',
  resourceUuid: example.scheduleUuid,
})
const slot = buildScheduleSlotIdentity({
  scheduleUrn: schedule.identifier,
  start: example.slotStart,
  end: example.slotEnd,
})
```

`Location`, `Device`, `PractitionerRole` and other Schedule actors are flat
claims and relationships. Changing an assignment does not change the Schedule
identity. A different independently schedulable capacity uses a different
schedule UUID, even when several Places share coordinates or images.
