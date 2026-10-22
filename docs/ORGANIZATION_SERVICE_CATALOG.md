# Public organization service catalog and communication identity

## Canonical public catalog

The public catalog is Schema.org-first. Its canonical graph contains a legal
`Organization`, its department `Organization` records, the public `Place`
records where a service is available, and the public `Service` records offered
there. A caller saying “location” therefore means a Schema.org `Place` in this
contract. No FHIR resource is created by this builder.

`buildPublicOrganizationServiceCatalog(...)` emits deterministic flat claims
for those records plus a DCAT `Dataset` descriptor. Publication is explicit:
the organization, department, Place and Service must all be public, and a
public Service must reference at least one public Place in its own department.
Private and unknown references fail closed instead of leaking into the public
catalog.

The descriptor carries the publisher, jurisdiction, sector, version,
modification time, media type and server-owned access URL. Marketplace and BFF
caches use `evaluateOrganizationCatalogCache(...)` to reuse a fresh copy,
revalidate a stale copy, fetch a newer version, evict a withdrawn dataset, and
reject rollback or publisher/dataset mismatches.

Schedules, Slots, Appointments, subjects and clinical records do not belong in
this dataset. A later adapter may translate the neutral graph to FHIR
`Organization`, `Location` and `HealthcareService` using the FHIR utilities,
but that projection is not part of the current public-catalog write.

## Public marketplace graph

A legal provider and its operational catalog are related but different data
objects:

```text
legal Organization
  -> department/subOrganization (Schema.org Organization; FHIR Organization.partOf)
       -> offered Service[] (Schema.org)
            -> Place[] (Schema.org Place with GeoCoordinates)
       -> professional Group[] (each Group belongs to this department only)
```

The department remains the canonical Schema.org Organization. For example, one
department can offer blood donation and plasma donation without creating two
communication identities. Scheduling remains a separate professional workflow.

`buildOrganizationServiceCatalogEntry(...)` returns one JSON:API data entry.
Its UUID is the entry `id`; its versioned `type` is
`cds-<ISO jurisdiction>:v<catalog version>:<sector>`. The Schema.org
Organization is stored under `attributes`; its `sameAs` retains the stable FHIR
Organization reference, and all per-offer HealthcareService references are
exposed through each Service plus the plural JSON:API relationship for indexed queries. Each Schema.org
`Service` remains an offered catalog item, not a separate sender or endpoint.

Supported catalog sectors are explicit and remain separate:

- animal care and human health care;
- animal and human health insurance; and
- animal, human and One Health laboratories.

The common structure is shared; each product owns the actual allowed service
options for its sector. A portal must never offer a human-health service code
in an animal-care catalog merely because both use the same component.

## Specialty mapping

The reviewed C80-to-LOINC candidate table lives in
`fhir-data-utils-ts/healthcare-service-specialty-map`. A consumer may apply
`findAutomaticLoincSpecialty(...)` only when that table declares a strict
equivalence, then pass the resulting coding to this builder. The department's
Schema.org `additionalType` becomes the LOINC concept URL. Wider, related,
inexact and unmatched rows require terminology review and are never silently
converted.

FHIR `HealthcareService.type`, clinical specialty and Schema.org department
`additionalType` remain separate concepts.

## Places and governed images

Each department can publish multiple Schema.org Places with address and
optional coordinates. A later profile may attach governed public images.
Department logos and public images use the same immutable object reference,
MIME type and SHA-256 contract.

A public extraction/donation point is a Schema.org `Place`. Independently
identifiable rooms, booths, chairs or beds may be child Places whose
`containedInPlace` references that point. Schedules and Slots are not stored as
properties of this catalog.

Equipment is not represented as another Place or Service. An apheresis machine
is a FHIR `Device` and can join the child Location and PractitionerRole in the
Schedule actor list. Suspending one Location or blocking/deactivating its
Schedule removes only that unit of capacity.

`buildOrganizationEquipmentCatalogEntry(...)` publishes the public identity of
an installed machine as a Schema.org `IndividualProduct`, with its serial
number, model, manufacturer, stable FHIR Device reference and installation
relationships. Public operating certifications use Schema.org
`hasCertification`; each `Certification` keeps its issuer, identifier, active
or inactive status, validity and corresponding FHIR R5
`RegulatedAuthorization` reference.

Technical calibration is intentionally absent from the public Schema.org
entry. It is protected operational evidence represented by the neutral FHIR
graph: a Device-focused `Procedure`, the `DeviceMetric.calibration` state/time
and an optional hashed `DocumentReference`. Maintenance performer,
certification holder, public regulator and authenticated submitter remain
different actors. The sector product decides which verified credentials and
assignments may create each record.

Evidence of the official legal address is verification material, not public
marketplace content. It must use `verification-private` visibility and is
removed by the public catalog builder. The BFF/storage adapter authorizes and
resolves object references; this data package never emits storage credentials
or temporary download URLs.

## Professional Group and department

A professional Group has one singular department Organization assignment in
the first implementation. A professional may be a member of several Groups,
but the same Group cannot span several departments. This makes the visible
service origin deterministic while preserving shift and holiday coverage.

The department does not require its own `did.json` merely to own a service or
Group. The communication runtime registers a stable endpoint for the Group and
resolves it after authorization. Group membership is descriptive and never
grants subject search, read, break-glass or message access by itself.

An accepted Encounter movement uses these exact HealthcareService assignments
to update only the future professional audience of an emergency thread. A
permanent transfer replaces the departed service Groups with the destination
Groups. A temporary visit retains the source Groups until the return movement
removes the temporary Groups. Past Communication recipient snapshots never
change.

## Author, attester, sender and recipient

These identities are never aliases:

| Concern | Identity |
| --- | --- |
| Clinical document created by a legal provider | legal `Organization` author |
| Professional confirmation | acting `PractitionerRole` attester |
| Network/audit submission | authenticated employee or device transport actor |
| Professional text/IP/video transport | authenticated member, device or `PractitionerRole` transport actor |
| Professional text/IP/video FHIR sender | department `Organization` |
| Reply to a department service | associated professional `Group` recipient |

A Group can receive and queue a reply, but it is not the document author or
FHIR sender. The authenticated professional/device remains independently
auditable as the transport actor. Personal authoring policy remains a separate
product rule because the sender may be the individual Organization or one of
its authorized members.

## Emergency ServiceRequest journey

1. A controller or member sends a ServiceRequest to the selected
   HealthcareService.
2. The server creates an independent triage Task owned by the professional
   Group assigned to that service's department.
3. An authorized Group member accepts the Task. The Task lifecycle does not
   rewrite the ServiceRequest.
4. The member can send text, start an IP/video call or leave an encrypted
   fallback message. The department Organization is the FHIR Communication
   sender; the member/PractitionerRole or device is the authenticated transport
   actor.
5. A controller/member reply is addressed to the stable Group recipient, so a
   different authorized shift member can continue the same thread.
6. Clinical documents created later keep the legal Organization author and the
   acting professional attester; calls and messages do not attest or publish
   clinical data.

Signaling, WebRTC endpoints, TURN credentials, telephone numbers and encryption
keys remain transport state outside the catalog and FHIR claims.

## Registration and access are separate

This catalog does not register or activate an SOSChain tenant. Test-network
onboarding for municipalities, public-health entities, veterinary clinics and
human-health providers is a separate organization-verification flow. Publishing
a department or service also grants no clinical access. Break-glass and
continuity-of-care access still require the exact actor, role, subject, purpose,
scope, policy and auditable emergency authorization.
