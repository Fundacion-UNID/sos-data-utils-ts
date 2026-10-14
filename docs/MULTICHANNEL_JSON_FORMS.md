# Multichannel JSON forms

One business action has one JSON Schema Draft 2020-12 form, regardless of how
the person completes it.

```text
JSON Schema
  ├── portal form
  ├── telephone prompts and DTMF
  ├── WhatsApp questions
  └── chat or spoken assistant
          ↓
typed builder/editor
          ↓
authenticated BFF transport
          ↓
GW persistence
          ↓
shared reader/importer and authoritative readback
```

The schema owns field names, data types, enumerations and which values are
required. A portal can render text boxes while a telephone flow asks sequential
questions, but both must reject the same incomplete draft. Channel YAML owns
navigation, localized prompts, retry behavior and a reference to the schema
`$id`; it does not own another required-field list. WhatsApp, chatbot and
speech-to-text proposals are untrusted form fillers: they must pass the same
validator before a typed builder or transport is called.

## One registry for all assisted writes

`MULTICHANNEL_OPERATION_SCHEMAS` is the shared registry. It covers individual
organization create/update, legal organization registration, Appointment,
Immunization, AllergyIntolerance, MedicationStatement, Observation, Procedure,
Condition, DiagnosticReport, DocumentReference and Task. RelatedPerson/contact
and Consent permission forms remain the existing specialized schemas.

Every clinical form requires the operation, resource UUID, exact subject,
BCP-47 language, creation timestamp, data author, attestation state and a
resource-specific `claims` object. Update requires `ifMatch`. A confirmed write
also requires the attester assignment reference, FHIR Composition attester mode
and attestation timestamp. Drafts deliberately do not invent an attester.

The resource schema separately declares its required and optional flat claims.
For example, an Observation requires status, local `code-text`, effective
date/time and at least one supported value representation. An Immunization
requires status, administration date and local vaccine text.
MedicationStatement accepts either an effective date/time or a period start.
DocumentReference requires its content type and at least one protected content
locator: hash/CID, inline data or URL.

`mapMultichannelOperationToFlatClaims(...)` adds the shared section provenance:

```text
Composition.subject       <- selected individual
Composition.date          <- creation timestamp
Composition.author        <- author of this data
Composition.attester      <- authenticated assignment, only after confirmation
Composition.attester-mode <- personal | professional | legal | official
Composition.attester-time <- explicit confirmation time
<Resource>.identifier     <- resource UUID
<Resource>.subject        <- selected individual
<Resource>.language       <- BCP-47 language
```

The authenticated transport sender remains separate and is never inferred as
author or attester. A telephone service that transcribes a statement is the
submitter, not automatically its clinical author.

## Bundle editor and reader ownership

The shared component or channel adapter supplies ordinary JSON Schema values;
it must not assemble its own flat-claim object. The reusable path is:

1. Resolve the clinical operation with
   `resolveMultichannelClinicalOperationId(resourceType)`.
2. Render and validate `MULTICHANNEL_OPERATION_SCHEMAS[operationId]`.
3. Call `buildMultichannelOperationBundle(operationId, values)`. This validates
   the values, creates the canonical claims and stages the create or update in
   the shared `BundleEditor` (including `ifMatch` for an update).
4. Submit that Bundle through the authenticated BFF.
5. Reopen authoritative readback with
   `readMultichannelOperationFromBundle(operationId, bundle, options)`. This
   uses `BundleReader`, restores the JSON Schema values and exposes only claims
   declared by that schema.

For a native FHIR import, the FHIR adapter first converts the resource to flat
claims and `selectMultichannelOperationClaimValues(...)` selects the same
schema-owned fields. Subject, provenance, authorization and transport identity
remain host-owned. Unknown claims never become editable merely because a
provider returned them.

The executable round-trip contract proves create and update (`ifMatch`) paths,
filters unrelated claims, and checks that every IPS editor claim is represented
by the multichannel JSON Schema. `Immunization.date` accepts either a FHIR date
or a complete FHIR dateTime; adapters must not truncate a valid time value.

Individual and legal-organization forms use the migrated neutral
`schema-org-claims` surface. It preserves the established flat Schema.org names
without changing frozen `gdc-*` packages. The onboarding action records its
initiating author and timestamp with Schema.org Action claims; it does not
misuse a clinical Composition.

## IPS and supporting-resource coverage

The executable source of truth is
`IPS_AND_MULTICHANNEL_RESOURCE_COVERAGE`. It tracks flat claims, FHIR
conversion and multichannel JSON Schema separately. `planned` means the type is
accounted for but cannot yet be advertised as working.

The inventory is derived from the official HL7 IPS material:

- [IPS Server CapabilityStatement](https://build.fhir.org/ig/HL7/fhir-ips/en/CapabilityStatement-ips-server.html)
- [IPS Bundle profile](https://build.fhir.org/ig/HL7/fhir-ips/en/StructureDefinition-Bundle-uv-ips.html)
- [IPS Composition profile](https://build.fhir.org/ig/HL7/fhir-ips/en/StructureDefinition-Composition-uv-ips.html)
- [IPS Bundle with all sections](https://build.fhir.org/ig/HL7/fhir-ips/en/Bundle-bundle-ips-all-sections.html)

All 28 CapabilityStatement resource types are represented: Bundle,
Composition, Patient, AllergyIntolerance, Condition, MedicationRequest,
MedicationStatement, CarePlan, ClinicalImpression, Consent, Device,
DeviceUseStatement, DiagnosticReport, DocumentReference, Flag, ImagingStudy,
Immunization, ImmunizationRecommendation, Medication,
MedicationAdministration, MedicationDispense, Observation, Organization,
Practitioner, PractitionerRole, Procedure, RelatedPerson and Specimen.

The all-sections example currently contains 18 of those types. The
`IpsAllSectionsExampleResourceType` catalog and `ipsAllSectionsExample` flag
preserve that exact subset, while the 28-type CapabilityStatement remains the
broader implementation roadmap. Adding a type to an example must never be the
only way it enters the supported-resource inventory.

The shared non-IPS support inventory additionally includes Location,
Appointment, Task and Communication. FHIR Organization, Practitioner,
PractitionerRole, RelatedPerson and Location are support/provenance resources;
they are not automatically user-editable clinical sections. Their conversion
status remains explicit because IPS and SHC projections may reference them.

Task has a shared SOS JSON Schema now. Schedule and Slot claims-first storage
and R5 projection are available in `fhir-data-utils-ts`, but their forms are intentionally
`deferred`: full scheduling is a later scope and must not be implied by the
current Appointment/Task forms.

## Contacts before permissions

A contact does not grant access. The sequence is always:

The accessible interaction order is decision (`permit` or `deny`), data
scopes, recipient sector, audience, roles, one complete review and
confirmation. `sector` is the target data channel (`animal-care` or
`health-care`); `recipientSector` describes who will receive access. They must
never be collapsed into one field.

The shared recipient policy is rendered in every channel:

| Recipient sector | Audience choices | Role source |
| --- | --- | --- |
| Animal or human clinical care | country, exact organization, exact professional | clinical roles for the matching target channel; jurisdiction may narrow them |
| Public safety | exact organization or professional; country only when explicitly enabled | public-safety roles, narrowed by jurisdiction |
| Passenger transport | exact airline, rail operator, handler or professional; never a whole country | flight/train/transport roles |
| Animal or health insurance | exact organization or professional; never a whole country | governed insurance-administration roles |

An airport operator, airline and ground-handling provider are different
organizations. Selecting one never authorizes the others merely because they
operate in the same airport. If no country is known, role menus use only the
safe base set. When a country is known, the deployment policy can narrow that
set and can explicitly enable jurisdiction-dependent roles such as paramedic.

Clinical and emergency-contact scopes include minimum subject demographics so
a recipient can identify whose authorized information is being handled.
Revoking an existing permission is a separate lifecycle operation; it is not
disguised as creating a new denial.

1. Validate the submitted values with
   `MULTICHANNEL_RELATED_ENTITY_SCHEMA`.
2. Persist the contact with `buildRelatedEntityBundle(...)`.
3. Let the user select that persisted contact.
4. Validate the grant with `MULTICHANNEL_PERMISSION_GRANT_SCHEMA`.
5. Persist Consent with `buildPermissionConsentBundle(...)`.
6. Search the exact subject with
   `buildSubjectPermissionConsentSearchBundle(...)`.
7. Parse the response with `readPermissionConsentBundle(...)` and report
   success only when identifier, subject and contact reference all match.

The BFF keeps only transport responsibilities: wallet/DCR and SMART session,
tenant route, protected carrier, submit/poll and retry. It must not construct a
second RelatedPerson or Consent claim bag.

## Adding another form

Add the schema and public types in the lowest product-neutral data package,
write positive and missing-required-field tests, add typed authoring and
readback helpers where persistence is involved, then connect every channel to
that export. Sector-specific taxonomy and clinical policy stay outside this
shared data package. Do not add new functionality to frozen lower-level
packages.
