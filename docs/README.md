# Documentation index

This directory documents the reusable data contracts owned by
`sos-data-utils-ts`. Start with the package boundary, then follow the topic
area relevant to the workflow being implemented or reviewed.

## Start here

- [Shared data-package boundary](SDK_LAYERING.md) — what this package owns and
  what remains in FHIR utilities, SDK orchestration, gateways and applications.
- [Public notification datasets MVP](PUBLIC_NOTIFICATION_DATASETS_MVP.md) —
  public blood-donation, veterinary and public-health datasets, the shared
  JSON Schema writing form, CommunicationRequest flat claims and BFF-side
  subscription rules.
- [Shared care-continuity, emergency-request and alert contracts](CARE_CONTINUITY_EMERGENCY_AND_ALERT_CONTRACTS.md)
  — inventory and boundaries for care, emergency and governed alert records.

## Organizations, services and authority

- [Organization departments, services and communication identity](ORGANIZATION_SERVICE_CATALOG.md)
  — department, service, place, professional Group and communication roles.
- [Organization-scoped resource identities](ORGANIZATION_SCOPED_RESOURCE_IDENTITIES.md)
  — stable identities for organization-owned resources.
- [Organization subject-Group access](ORGANIZATION_SUBJECT_GROUP_ACCESS.md) —
  controlled subject populations, municipal animal groups and transport access.
- [Organization workflow access](ORGANIZATION_WORKFLOW_ACCESS.md) — controller,
  employee, subject and family workflow authorization.
- [Multisector jurisdictional identifier types](JURISDICTIONAL_IDENTIFIER_TYPES.md)
  — country and subdivision-scoped identifier composition.

## Discovery, identity and One Health

- [Location and subject discovery](LOCATION_AND_SUBJECT_DISCOVERY.md) — neutral
  Place, Event and human/animal card-directory discovery boundaries.
- [Animal-card One Health interoperability](ANIMAL_CARD_ONE_HEALTH_INTEROPERABILITY.md)
  — animal-card parsing, species identity and terminology enrichment.
- [Demo identities and encounter codes](DEMO_IDENTITIES_AND_ENCOUNTER_CODES.md)
  — governed synthetic identities and readable encounter fixtures.

## Communication and emergency messaging

- [Exact-recipient emergency messaging](EXACT_RECIPIENT_EMERGENCY_MESSAGING.md)
  — exact patient, authorized-person, Group, device and emergency-service
  routing.
- [Encounter-driven emergency-channel audience](ENCOUNTER_DRIVEN_COMMUNICATION_AUDIENCE.md)
  — audience changes across temporary and permanent Encounter movement.
- [Secure message envelopes](SECURE_MESSAGE_ENVELOPES.md) — encrypted text and
  audio envelope format and recipient lifecycle.

## Clinical and multichannel authoring

- [Clinical typed accessor adoption](CLINICAL_TYPED_ACCESSOR_ADOPTION.md) —
  adoption and promotion rules for typed clinical accessors.
- [Multichannel JSON forms](MULTICHANNEL_JSON_FORMS.md) — one form registry for
  assisted writes, Bundle editing and supporting-resource coverage.

## Release process

- [Coordinated MVP beta snapshots](MVP_SNAPSHOT_RELEASES.md) — cumulative
  local-first validation, immutable snapshots and release ordering.

## Maintenance rule

Every new document in this directory must be linked from this index in the
appropriate topic area. When a document is superseded, update the link and
state the replacement instead of leaving two apparent sources of truth.
