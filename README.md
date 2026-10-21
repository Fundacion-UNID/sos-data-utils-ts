<!-- Copyright 2026 Connecting Solution & Applications Ltd under the Apache License, Version 2.0. -->
# sos-data-utils-ts

Copyright 2026 Connecting Solution & Applications Ltd.
Licensed under the Apache License, Version 2.0; see [`NOTICE`](NOTICE).

## Documentation

The [documentation index](docs/README.md) is the entry point for architecture,
organization and authorization contracts, communication and emergency flows,
interoperability guidance, public notification datasets and release policy.

## Public source history

The public repository begins from a clean 2026 source snapshot. The retained
[`CHANGELOG.md`](CHANGELOG.md) records package releases without republishing
the former Git push history.

The [Organization subject-Group access](docs/ORGANIZATION_SUBJECT_GROUP_ACCESS.md)
contract defines municipality-managed populations, mobile passenger-transport
groups, read-only verification and emergency ownership.

Exact-recipient patient, authorized-person, explicit-group-member and
emergency-service routing is documented in
[`docs/EXACT_RECIPIENT_EMERGENCY_MESSAGING.md`](docs/EXACT_RECIPIENT_EMERGENCY_MESSAGING.md).

Accepted Encounter handovers can reconcile the future professional audience
without changing historical Communication recipients. See
[`docs/ENCOUNTER_DRIVEN_COMMUNICATION_AUDIENCE.md`](docs/ENCOUNTER_DRIVEN_COMMUNICATION_AUDIENCE.md).

New subject-owned messaging uses separate opaque Groups for emergency updates
and care continuity through
`buildSubjectCommunicationPurposeGroupReference(...)`. The earlier
`buildSubjectCommunicationGroupReference(...)` wire identity remains readable
for compatibility and is not rewritten. Every Group is only an audience
address: active membership, exact recipients, Consent and device delivery are
authorized separately.

FHIR coding review and flat-claim resource graphs are owned and imported
directly from `fhir-data-utils-ts`; this package does not reexport them.

## Blocking local-first release order

First merge and push every validated shared dependency source to `main`. Build
still-unpublished main commits with `npm pack`, install their immutable
tarballs temporarily with `--no-save`, and prove the affected local journey
without skips. Publish only exact validated commits, pin exact registry
versions and lockfiles, repeat the affected local gates, and only then promote
to staging. Never commit `file:`, Git, workspace or vendored dependencies.

Coordinated beta/MVP compatibility points use the immutable manifest and tag
contract in [docs/MVP_SNAPSHOT_RELEASES.md](docs/MVP_SNAPSHOT_RELEASES.md).
Repository-safe fixtures and value-free privacy validation are exported from
`sos-data-utils-ts/repository-privacy`.

Shared synthetic people, role-labelled professional displays, fictional `555`
contacts and readable encounter identifiers are exported from
`sos-data-utils-ts/demo-identities`. The format and concurrency boundary are
documented in
[`docs/DEMO_IDENTITIES_AND_ENCOUNTER_CODES.md`](docs/DEMO_IDENTITIES_AND_ENCOUNTER_CODES.md).

The [multisector jurisdictional identifier contract](docs/JURISDICTIONAL_IDENTIFIER_TYPES.md)
composes governed HL7 person-document base meanings with ISO 3166-1 alpha-2 or
ISO 3166-2 jurisdictions. It keeps each Schema.org identifier type paired with
its value, treats external HL7 NamingSystems as import/export aliases, and
does not rewrite historical identifiers or hashes.

This package owns product-neutral data contracts. It may reuse canonical
vocabulary from lower-level shared utilities, but it has no dependency on a
gateway, application, portal or sector-specific package.

Cross-sector location and subject discovery are available through
`sos-data-utils-ts/location-proximity` and
`sos-data-utils-ts/subject-card-directory`. They expose final neutral names:
Schema.org `Place`, `IndividualProduct` and `Event` remain standard concepts,
while human/animal card-directory discovery remains explicitly separate from
Consent, policy and provider-issued authorization. There are no product
compatibility aliases for these APIs.
See [Location and subject discovery](docs/LOCATION_AND_SUBJECT_DISCOVERY.md)
for the canonical flat-claim, species and authorization boundaries.

The package boundary is maintained in
[docs/SDK_LAYERING.md](docs/SDK_LAYERING.md). This repository defines data
shapes, deterministic builders and validators only. Runtime orchestration,
transport, persistence adapters, application policy and presentation remain
outside this package.

The BFF contract defines capability-based route roots. `/api/profile`,
`/api/subjects`, `/api/cards`, `/api/notifications` and `/api/assistant/*` are
the shared public families; `/api/internal/*` is reserved for authenticated
service-to-service adapters. Product-name prefixes are not public API
surfaces.

Emergency data contracts are defined once in this package. They include the
shared evidence vocabulary, flat Group and ServiceRequest claims, and stable
card-to-Place/vehicle associations. SDKs consume these types and deterministic
builders. Shared runtime-neutral authorization and orchestration belong to
`sos-sdk-core-ts`; gateway calls and product workflows remain outside this data
package.

The current emergency writer stores members only on an enumerated Group and
uses `fhir-data-utils-ts` to create a standard compact-coded ServiceRequest.
The shared `care-emergency-alert-records` subpath validates the idempotent
Appointment-to-Encounter transition, emergency intake/triage correlation,
bounded blood-donation or FHIR SearchParameter public-risk filters, frozen
Group snapshots and fail-closed per-recipient delivery audits. It never stores communication destinations,
WebRTC signaling, TURN credentials or encryption keys.

## Secure text and audio envelopes

`sos-data-utils-ts/secure-message-envelope` owns only the versioned,
runtime-neutral persisted envelope. A text message and an audio message have
the same shape: one AES-256-GCM ciphertext and one independently protected CEK
entry per current ML-KEM recipient. The protected content type distinguishes
`text/plain;charset=utf-8`, `audio/ogg`, or another allowed binary media type;
audio is never converted to text by this layer.

Cryptographic operations belong to `sos-sdk-core-ts`. Runtime packages inject
only a CSPRNG adapter. Adding a new device rewraps the existing CEK for its
ML-KEM public key without decrypting or replacing the stored ciphertext.
Removing a temporary service recipient removes its wrapped CEK entry; business
authorization for changing recipients remains outside this data contract. See
[docs/SECURE_MESSAGE_ENVELOPES.md](docs/SECURE_MESSAGE_ENVELOPES.md).

The shared Task authoring schema uses canonical flat FHIR-like claims from
`gdc-common-utils-ts`. `Task.status` and `Task.intent` are mandatory; display,
correlation and output claims remain optional so the same contract supports
human work items and machine-created asynchronous jobs.

The shared immunization graph keeps international terminology, regional
product text and evidence separate:

```text
Immunization
  ├── Medication (optional product text, lot, expiry, barcode)
  ├── DocumentReference[] (optional PDF/JPEG/PNG evidence)
  └── ImmunizationRecommendation (coverage/due date)
        └── Task[1m, 1w, 1d]
```

`Immunization.date` is administration, while the recommendation uses LOINC
`30980-7` for the due date. Delivery selects the next untried channel only when
it remains enabled by current preferences and Consent; acknowledgement stops
escalation. Channel adapters and secrets belong to services, never this data
package.

## Multichannel forms and permission persistence

Portal, telephone, WhatsApp and chat must render the same JSON Schema Draft
2020-12 form. Channel navigation may change, but required/optional fields may
not. Subject contacts and access grants are deliberately separate:

1. `MULTICHANNEL_RELATED_ENTITY_SCHEMA` collects and persists a selectable
   RelatedEntity/RelatedPerson contact.
2. `MULTICHANNEL_PERMISSION_GRANT_SCHEMA` selects that persisted contact and
   creates Consent.
3. `MULTICHANNEL_PERMISSION_SET_SCHEMA` captures the complete reviewed
   audience, role and data-scope selection before it is expanded into one or
   more contact-bound Consent records.
4. `validateMultichannelPermissionSet(...)` keeps the target data sector,
   recipient organization sector, audience, role and data scope separate. The
   recipient sector is selected before the audience: passenger transport and
   insurance accept only an exact organization or professional, while
   country-wide public-safety access must be enabled by jurisdiction policy.
   Every adapter persists that selection with
   `MultichannelPermissionClaim.RecipientSector` instead of defining a local
   claim key.
   `resolveMultichannelPermissionRoles(...)` also removes administrative roles
   from country audiences before a channel renders them. Together with
   `resolveMultichannelPermissionAudienceKinds(...)`, it supplies the same
   sector- and country-aware audience and role choices to portal, telephone,
   WhatsApp and chat. The
   validator also forbids country-wide administrative access, restricts
   administrative roles to organization billing, and applies human
   IPS/paramedic policy. Clinical
   or emergency-contact access automatically carries the minimum subject
   identity context needed to identify the individual: display/usual name,
   birth date or year, administrative sex when recorded and animal species
   when applicable. That context is read aloud or displayed in the final
   review; it is not hidden as a second permission.
5. `buildRelatedEntityBundle(...)` and `buildPermissionConsentBundle(...)`
   author typed bundles through the shared editors.
6. `buildSubjectPermissionConsentSearchBundle(...)` and
   `readPermissionConsentBundle(...)` perform authoritative readback through
   the shared search shape and importer.

See [docs/MULTICHANNEL_JSON_FORMS.md](docs/MULTICHANNEL_JSON_FORMS.md) for the
beginner-oriented channel boundary and extension rules.

The same guide defines the shared operation registry for individual and legal-
organization onboarding plus Appointment, Immunization, AllergyIntolerance,
MedicationStatement, Observation, Procedure, Condition, DiagnosticReport and
DocumentReference authoring. Portals, telephone, WhatsApp and chat consume the
same required/optional flat-claim schemas and fail-closed validator; channel
YAML never maintains a second field list.

The [clinical typed accessor adoption guide](docs/CLINICAL_TYPED_ACCESSOR_ADOPTION.md)
records which canonical clinical details already survive FHIR conversion and
which optional fields remain to be added to the shared multichannel schema.

The executable IPS roadmap in `ips-resource-coverage` distinguishes the 18
resource types physically present in the official all-sections Bundle from all
28 resource types declared by the IPS Server CapabilityStatement. It
separately marks flat-claim, FHIR-conversion and multichannel-form readiness,
so a planned type cannot be advertised as implemented. FHIR conversion for
Organization, PractitionerRole and Location is available; Practitioner and
the remaining planned resources stay visible in the roadmap. Task has a
shared SOS JSON Schema now; Account is the governed organization-billing
permission target. Schedule and Slot claims/conversion are available in the
neutral FHIR package, while their multichannel editing forms remain deferred. See
[docs/MULTICHANNEL_JSON_FORMS.md](docs/MULTICHANNEL_JSON_FORMS.md).

Subject-card index resolution uses one product-neutral 27-digit preimage:

```text
speciesId7 + first20DigitsOfValidatedCardNumber21
```

The final printed Damm digit is validation only and is excluded. Animal
products provide the animal's NCBI Taxonomy identifier separately from the
printed card. Human-health products use Homo sapiens (`9606`, projected as
`0009606`) implicitly and never display or request species. Only the lowercase
SHA3-256 digest of the 27 ASCII digits may cross the blockchain boundary; it
locates the active index provider and grants no data access.

The neutral reader can classify a resolved animal card and obtain its stable
NCBI Taxonomy coding without importing a sector package. The current card DID
does not embed species: `readAnimalCardFromFlatClaims(...)` requires the
canonical Schema.org taxonomy claim and validates the species-bound checksum.
Terminology enriches labels later and is never required to retain the code identity. See
[Animal-card One Health interoperability](docs/ANIMAL_CARD_ONE_HEALTH_INTEROPERABILITY.md).

The organization-verification contract resolves policy by business sector and
ISO country. The governed CA/US profiles are:

- `animal-care`: immutable form/PDF, existing marketplace organization,
  outbound OTP to its official telephone or the technical controller telephone
  supplied in the application, confirmation by web or telephone, and
  marketplace primary-location evidence;
- `health-care`: immutable form/PDF, existing marketplace organization,
  authenticated representative/controller email, and a numeric code delivered
  to the legal postal address and confirmed only in the authenticated portal.
  The organization remains inactive until that code is confirmed against the
  exact form-PDF hash.

After organization activation, a professional invitation records both employee
email and employee phone. Its initial OTP channel is employee email; this proves
only invitation reachability and remains separate from licence and DCR.

Both use `Organization/_transaction`. `Order/_batch` is used only when a new
host Offer exists; the later licence/DCR activation code is a different secret.
Ungoverned sector/country combinations fail closed. Deployment hostnames and
DID domains are private environment configuration and are never package data.

Organization controllers can publish departments/suborganizations and their
sector-scoped services through `organization-service-catalog`. The JSON:API
entry keeps Schema.org Organization, Place/GeoCoordinates, governed public
images, nested reservable Places and one stable FHIR HealthcareService
projection per offered Service aligned. Multiple independently schedulable
Services and child Places remain inside that department. One
professional Group belongs to one department; the department needs no DID just
to own that Group. Legal document author, professional attester, authenticated
transport actor, department Organization Communication sender and Group
recipient remain distinct.
See [the organization service catalog and emergency communication contract](docs/ORGANIZATION_SERVICE_CATALOG.md).

Operational Encounter and scheduling team membership is descriptive and must
be paired with separate active Consent authority. The shared Test Network
controller bootstrap and the three subject/family journey views are documented
in [organization workflow access](docs/ORGANIZATION_WORKFLOW_ACCESS.md).

All organization-owned resource identities derive from the legal Organization
URN. Department, Service, Place and Schedule append a typed UUID segment; Slot
appends one `<startEpochSeconds>-<endEpochSeconds>` interval segment. The full
URN remains the logical Identifier and its SHA3-256 multibase multihash is the
bounded FHIR `Resource.id`. See
[organization-scoped resource identities](docs/ORGANIZATION_SCOPED_RESOURCE_IDENTITIES.md).

The same catalog surface can publish an installed machine as a Schema.org
`IndividualProduct` and expose only its governed public `Certification`
records. Protected calibration history stays in the separate FHIR
Procedure/DeviceMetric/DocumentReference graph; public certification links to
its independent R5 RegulatedAuthorization.

The shared emergency-professional catalog exposes ISCO-08 claims for police,
firefighters, lifeguards, ambulance/paramedic workers, security guards and
passenger-transport staff. Each descriptor supplies an English fallback and an
i18n key ending at `org.ilo.isco-08.<roleCode>`; Next.js applications keep the
translated nested object in their own locale files. Occupation lookup never
grants access: application policy must still bind the exact actor,
subject, jurisdiction, purpose, section, action and active Consent.

The `prompt-audio` export defines immutable public-prompt descriptors and
localized numeric-code fragment plans shared by telephone, portal, chat,
messaging and Connect ICA. It contains no provider client, credential or
storage adapter. The verification service retains each live code; the audio
plan exposes only a static prefix and independently reusable digit prompts.

## Verify

```bash
npm ci
npm run check
```
