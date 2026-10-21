<!-- Copyright 2026 Connecting Solution & Applications Ltd under the Apache License, Version 2.0. -->
# Changelog

## Unreleased

- Allow a governed animal-card directory entry to identify either UNID or
  VetChain as its index provider while preserving taxonomy, checksum and
  relationship validation.
- Define product-neutral public BFF route roots for profile, subjects, cards,
  notifications and assistants so separate portal, telephone and KIA hosts can
  share one versioned operation contract.
- Document the review-stage public notification dataset MVP for blood and
  plasma donation, veterinary and public-health topics, including publisher
  authority, subscriber-side exclusions and multichannel parity.

## 0.6.13 - 2026-10-16

- Add the shared SOS GW application identity normalizer so every portal BFF
  derives the same reverse-DNS `AppId` and version headers from its stable URL.
- Parse only the species-bound VetChain animal DID and reject split 5+16 paths
  instead of normalizing them.

- Limit the shared SOSChain professional Demo catalog to health care, animal
  care, animal shelter and public safety. Reuse the governed veterinarian,
  veterinary-assistant and receptionist occupations for animal shelters while
  keeping research absent and every selector explicitly non-authorizing.
- Add the 2026 development-owner notice and re-establish the public repository
  from a clean source snapshot while
  retaining this changelog as the package release record.

- Consume the product-neutral HL7 v2-0203 identifier catalog from
  `fhir-data-utils-ts` instead of duplicating its codes locally. Extend the
  jurisdictional SOS profile to citizenship cards, health cards, member and
  subscriber numbers, donor records and patient identifiers.
- Remove downstream product and repository references from maintained shared
  package narratives, replace the consumer matrix with a neutral ownership
  boundary, and enforce that boundary with an executable documentation test.

## 0.6.12 - 2026-10-12

- Scope subject registration to one exact Organization or Department and keep
  exact subject-Group membership management in a separate filtered Consent.
- Remove the unfiltered `Patient.c` and `Group.u` workflow capabilities so
  employee assignment cannot implicitly grant clinical read or broad Group
  mutation.

## 0.6.11 - 2026-10-11

- Add the runtime-neutral confidential profile-index contact normalization,
  canonical HMAC lookup message, and versioned `HMAC-SHA-256` locator contract
  shared by portal, telephone and native channels.

## 0.6.10 - 2026-10-10

- Replace the invented `org.unid.role|researcher` permission claim with the
  standardized animal/life-science occupation `ISCO-08|2131` so every channel
  persists and presents the same governed research-professional code.

- Add a claims-first organization subject-Group contract for separately
  governed membership management and read-only passenger-transport
  immunization verification. Group membership remains descriptive and every
  Consent is authored and read through the shared Bundle APIs.
- Add separate stable subject communication Group references for emergency
  updates and care continuity. Preserve the historical subject-access Group
  reference unchanged for compatibility; no Group reference grants membership,
  Consent or delivery authority.

## 0.6.9 - 2026-10-05

- Add the Test Network `clinical-contribution` workflow Group with the exact
  multisector `Subject/Composition.cuds` capability, keeping clinical read,
  attestation, index projection and delivery outside that membership.

## 0.6.8 - 2026-10-05

- Bind every organization workflow Consent to its exact governed FHIR Group
  through `Consent.sourceReference`, while keeping Group membership descriptive
  and the active Consent as the separately revocable authority.

## 0.6.7 - 2026-10-05

- Add the Test Network organization-controller assignment plan for a verified
  employee owned by another account. The controller still assigns only the
  exact server-resolved `PractitionerRole`; Group membership remains
  descriptive and the separate active Consent carries workflow authority.

## 0.6.6 - 2026-10-04

- Add the Test Network organization-controller self-assignment plan for
  Encounter and scheduling operation Groups. Group membership remains
  descriptive; a separate active Consent carries the exact Encounter,
  EncounterHistory, Appointment, Schedule or Slot capability.
  Preserve the selected member profile's governed role instead of rewriting
  every controller-authorized assignment to `RESPRSN`.
- Add exact subject-controller Consent plans for a RelatedPerson to read only
  the current Encounter, all open Encounters, or the complete Encounter and
  EncounterHistory journey. Subject Group membership remains non-authorizing.

## 0.6.5 - 2026-10-04

- Add an Encounter-driven emergency-channel audience reconciler for permanent
  handover, temporary service visits and return movements. It validates exact
  HealthcareService Group assignments, preserves historical Communication
  recipients and emits a family-safe journey event without membership or
  transport state.

- Add the exact-recipient Communication delivery contract for patient-only,
  authorized-person, explicit-group-member and emergency-service messages.
  Bind every delivery to one profile-device or service endpoint, forbid
  implicit fan-out, expand explicit current/selected/all-authorized device
  snapshots into independent routes, calculate the shortest applicable content
  lifetime and retain content-free audit metadata after cooperating-client
  deletion.

## 0.6.4 - 2026-10-04

- Add the stable opaque FHIR `Group` reference builder shared by personal and
  professional communications, so controller/caregiver recipients are never
  replaced by per-device identities in the canonical message.

## 0.6.3 - 2026-10-04

- Add the governed ISCO-08 insurance-clerk occupation to animal and health
  insurance demo permission selectors.
- Add the non-authorizing researcher role to animal/health care, laboratory
  and public-health recipient selectors.
- Add the governed `public-health` recipient sector for municipal police,
  firefighters, lifeguards and paramedics, while retaining `public-safety` as
  a compatibility sector.
- Distinguish ISCO-08 flight attendants (`5111`) from airline ground clerks
  (`4221`) in the shared passenger-transport role catalogue.
- Make the multichannel JSON Schema the single clinical form contract used by
  portal, voice, chat and WhatsApp adapters. Add reusable helpers that validate
  schema values, create canonical flat claims through `BundleEditor`, and
  restore the same values from authoritative `BundleReader` readback.
- Cover every claim exposed by the minimum IPS editors, keep profile-specific
  Observation categories separate, preserve update `ifMatch`, filter unknown
  claims from forms and accept both FHIR date and dateTime precision for an
  immunization administration time.

## 0.6.2 - 2026-10-02

- Enable the non-authorizing SOSChain demo catalog for doctor, nurse,
  paramedic, firefighter, lifeguard and police profiles. Add the public-safety
  Emergency response context while keeping every selected role, sector and
  department as presentation only.

- Pin `fhir-data-utils-ts@0.6.3` so the reusable encounter demo identities use
  the published FHIR instant and exported `*.data.ts` fixture contracts.
- Add the shared SOSChain Personal, Partner, Test Network and Demo access-mode
  catalog plus non-authorizing human-care and animal-care demo profiles.

- Add one reusable cross-channel demo identity catalog with `Doe` individuals,
  role-labelled professionals, fictional `555` contacts and readable encounter
  business identifiers. Preserve the original FHIR instant and require atomic
  provider allocation plus assigner-and-subject readback for same-second
  collisions.
- Remove the `VISA` input alias; jurisdictional identifier readers and writers
  now accept only the canonical HL7 `VS` base code.
- Publish the final location, subject-directory and animal-card ownership
  guide with the package; no product compatibility aliases are retained.
- Rename the shared emergency Group and ServiceRequest API to neutral final
  names; no SOSChain-prefixed exports remain.

- Move the cross-sector Schema.org Place, IndividualProduct, proximity Event
  and emergency-recipient contracts out of UHC into this shared data layer.
  The public API uses neutral final names and exposes no temporary Device or
  SOSChain-prefixed compatibility aliases.
- Add the shared human/animal subject-card directory contract. It validates
  the species-bound animal card with its explicit NCBI Taxonomy identifier,
  keeps directory discovery separate from authorization, and rejects removed
  `family-member` and `employee` relationship aliases.
- Remove the temporary FHIR reexport subpaths and SOSChain-prefixed emergency
  evidence aliases. Consumers must import each contract from its single owner.
- Add the shared species-bound parser for visible animal-card numbers so SOS
  and human-health surfaces can recognize an animal without importing Vet.

## 0.5.1 - 2026-09-29

- Pin `fhir-data-utils-ts@0.6.0` so SOS, Vet and UHC share the canonical
  Communication Bundle validators and Appointment/DocumentReference
  projection tools without moving high-level editor sessions into the data
  package.

## 0.5.0 - 2026-09-29

- Add the shared legal-Organization-rooted URN hierarchy for department,
  service, place, schedule and slot identities. Slot identity uses one
  second-precision `<startEpochSeconds>-<endEpochSeconds>` segment; the exact
  URN remains the logical Identifier and a SHA3-256 base58btc multihash becomes
  the bounded FHIR `Resource.id`.

- Add a governed Schema.org `IndividualProduct` equipment catalog entry with
  installation relationships and public `Certification` metadata linked to
  independent R5 RegulatedAuthorization records. Keep protected calibration
  evidence outside the marketplace entry.

- Preserve one independently schedulable FHIR HealthcareService reference per
  offered Schema.org Service instead of collapsing a department's services
  into one aggregate relationship. Permit distinct Locations to clone public
  coordinates and images while retaining separate operational identities.
- Mark Schedule and Slot flat claims and R5 conversion as available while
  keeping their multichannel editing schemas explicitly deferred.
- Add nested Schema.org Place capacity through `containedInPlace`, allowing
  cloned coordinates/media with distinct reservable identities while keeping
  equipment outside Place and Service models.
- Add One Health animal-card reading from canonical Schema.org flat claims.
  SOS channels now obtain the stable NCBI Taxonomy coding and validate the
  species-bound card checksum without importing Vet packages, inferring species
  from identifier digits or depending on online terminology labels.
- Add the shared multisector jurisdictional identifier contract for `NN`,
  `DL`, `JHN`, `PPN`, `PRC`, `WP`, `SP`, `VS`, `VP`, `TPR` and the
  data-space `BN` extension, using ISO 3166-1 alpha-2 or ISO 3166-2 suffixes
  while preserving exact HL7 provenance. Keep `UUID` and `OID` as separate
  technical types, preserve `EN` and `TAX` as distinct HL7 organization
  types, leave country-specific PPN/DLN NamingSystem conversion to FHIR
  adapters, and prohibit silent rewrites of historical identity hashes.
- Make recipient-role resolution audience-aware so country-wide permission
  forms never offer administrative roles that validation must reject.
- Added the shared `Consent.recipient-sector` claim key so portal, telephone,
  chat and messaging adapters persist the same recipient-sector dimension.

## 0.4.6 - 2026-09-29

- Separate the protected data sector from the recipient organization sector
  in the shared multichannel permission form, with sector- and
  jurisdiction-aware role resolution and fail-closed audience choices for
  public safety, passenger transport and insurance.
- Export the recipient-sector audience-choice resolver so graphical and
  conversational channels render the same country, organization and exact
  professional choices.

- Add the shared fail-closed mapping from `public-safety` and
  `passenger-transport` Organizations to the animal-care and health-care data
  channels they may request. The mapping never replaces employee-role policy,
  exact-subject SMART authorization or active Consent.

- Document the coordinated SOS/Vet/UHC adoption boundary for typed clinical
  Bundle accessors and defer optional portal/assistant fields until their
  shared multichannel form release instead of forcing unrelated dependency
  updates.

## 0.4.5 - 2026-09-28

- Model each department/suborganization as the canonical Schema.org/FHIR
  Organization with one department-level HealthcareService projection and any
  number of offered Services, rather than assigning a HealthcareService
  identity to every individual offer.
- Require professional outbound Communication to use the department
  Organization as its FHIR sender while preserving the authenticated
  professional/device as an independent transport actor and the professional
  Group solely as the inbound queue.

## 0.4.4 - 2026-09-27

- Add the shared minimum subject-demographics scope automatically to clinical
  and emergency-contact permissions, while keeping it visible in the final
  multichannel review and separate from unrelated scheduling or billing data.

- Add the cross-sector JSON:API/Schema.org department service catalog with
  versioned jurisdiction/sector types, LOINC `additionalType`,
  HealthcareService relationships, Place coordinates and governed public
  PNG/JPEG media while excluding private official-address evidence.
- Bind each professional Group to exactly one department and document that the
  department needs no DID merely to own the Group or service.
- Separate legal Organization document author, PractitionerRole attester,
  authenticated transport actor, actual Communication sender and Group reply
  recipient; require emergency triage ownership to be a Group.

## 0.4.3 - 2026-09-27

- Canonicalize frozen emergency and alert cohort identifiers as searchable
  FHIR `system|value` tokens under the shared SOSChain naming system.

- Govern FHIR `Account` as the shared billing resource target for
  organization-scoped multichannel administrative permissions.

- Add the channel-neutral permission-set JSON Schema and fail-closed policy
  validator used by portal, telephone, chat and messaging adapters. Keep
  audience, role and data scope independent; forbid country-wide
  administrative grants, restrict administrative roles to organization
  billing, and require jurisdiction-enabled paramedics plus explicit IPS
  section selection for human clinical access.

- Complete the shared standard FHIR Task status catalog needed by responder
  triage, including received, accepted, rejected, ready, on-hold and
  entered-in-error without introducing product-specific workflow claims.

## 0.4.2 - 2026-09-27

- Require one version change only after grouped changes are merged and tested,
  and preserve every exact published version on an immutable stable branch.

- Add the provider-neutral immutable prompt-audio descriptor and localized
  numeric-code fragment planner shared by Vet, UHC, SOSChain and Connect ICA.
  Live OTPs remain verification-service state and are never emitted as one
  cacheable phrase.

- Make the release order executable: full local Vet portal, phone service,
  chatbot or other supported channel -> BFF/service -> SDK -> GW VET proof
  without skips, merge/push source to main, publish exact npm commits, pin
  registry versions, and only then promote to staging.

## 0.4.1 - 2026-09-26

- Allow resilient emergency intake to target either a HealthcareService or its
  owning Organization.
- Generalize governed alerts beyond blood donation with explicit public-risk
  campaigns and server-authorized FHIR SearchParameter eligibility criteria,
  while retaining required donor-specific blood-group and interval filters.

## 0.4.0 - 2026-09-26

- Index the shared ownership and lifecycle boundaries for Encounter care
  continuity, resilient emergency ServiceRequest intake and governed
  donation/public-risk alerts before the VetChain proving implementation.
- Replace the historical emergency ServiceRequest split-code and copied-member
  claims with the canonical `fhir-data-utils-ts` compact-code entry and an
  enumerated Group that exclusively owns its members.
- Add validated shared records for Appointment-to-Encounter transitions,
  emergency request/triage correlation, donor campaign filters, frozen cohort
  snapshots and fail-closed per-recipient delivery audits.
- Pin `fhir-data-utils-ts@0.3.7` and consume its canonical DocumentReference
  claim catalog.

## 0.3.9 - 2026-09-25

- Add the versioned multi-recipient ML-KEM secure-message envelope shared by
  written and binary-audio messages: one authenticated ciphertext, protected
  content type and one independently wrapped CEK entry per current recipient.
- Add fail-closed validation for malformed envelopes, unsupported algorithms,
  empty recipient lists and duplicate recipient key identifiers without
  adding cryptographic runtime behavior to the data package.

## 0.3.8 - 2026-09-24

- Add the shared ISCO-08 catalog for emergency, public-safety and passenger-
  transport occupations. Export stable claims, English fallback labels and
  nested-object i18n keys ending at `org.ilo.isco-08.<roleCode>`; product
  authorization remains subject/Consent/purpose/section/action specific.

- Clarify that `sos-sdk-core-ts` and `sos-sdk-node-ts` are shared,
  product-neutral layers at the same architectural level for SOSChain, Vet and
  UHC, while each product keeps its own core/Node specialization and
  SOSChain-only behavior remains an explicit optional boundary.
- Add one fail-closed JSON Schema registry for individual and legal-
  organization onboarding plus the clinical operations exposed by portal,
  telephone, WhatsApp and chat. Preserve Composition subject/author/attester
  boundaries, validate create/update and draft/confirmed state, and map only
  validated values to canonical flat claims.
- Migrate the product-neutral Schema.org organization, person and action claim
  names needed by new onboarding code into `sos-data-utils-ts`, leaving frozen
  `gdc-*` packages unchanged.
- Consume the published `fhir-data-utils-ts@0.3.1` canonical claim exports so
  schemas do not duplicate FHIR claim literals.
- Add Task to the shared JSON Schema registry and an executable coverage
  inventory for all 28 IPS CapabilityStatement resource types plus Location,
  Appointment, Task and Communication. Track claims, FHIR conversion and form
  readiness independently; keep Schedule and Slot explicitly deferred.

- Add channel-neutral JSON Schema 2020-12 forms for RelatedEntity contacts and
  permission grants, plus typed BundleEditor authoring, shared FHIR
  Communication search construction, BundleReader/importer readback and
  fail-closed required-field validation for portal, telephone, WhatsApp and
  chat consumers.

## 0.3.7 - 2026-09-22

- Add the shared index, personal-backup and digital-twin service-offering
  roles, with `DocumentReference` as the primary personal-backup capability
  and optional `ImagingStudy` and `Binary` content capabilities.

- Consume `fhir-data-utils-ts@0.2.4` so SOS, VET and UHC share the restored
  parent-owned `Observation.has-member` graph, independently indexable reduced
  components and native FHIR `Observation.component[]` reconstruction.
- Pin the validated neutral FHIR flat-claim and Observation base at
  `fhir-data-utils-ts@0.2.3` so clean consumer installs do not require the
  unpublished historical package.
- Add governed synthetic legal-organization name and nine-digit business
  number fixtures so consumers never repeat operational organization data in
  tests, examples or local browser configurations.
- Reexport the exact neutral flat-claim coding-review implementation and
  package-owned examples from `fhir-data-utils-ts`, without creating a
  SOSChain-specific contract or duplicated literals.

- Add the shared claims-first Immunization graph for human and animal channels,
  including a WHO ATC influenza fixture for UHC without a commercial product
  lookup.

- Create recommendation-linked immunization reminder Tasks at one month, one
  week and one day before coverage ends, with ordered multichannel candidates
  that dispatch must filter by current preference, Consent and acknowledgement.
  Export the deterministic next-channel selector so an acknowledged reminder
  stops and an unopened or unanswered reminder advances only to an allowed,
  preferred and not-yet-attempted channel.

- Add the shared professional role-and-jurisdiction evaluator. Country grants
  cover their ISO 3166-2 subdivisions; subdivision grants remain exact, and
  inactive, expired, wrong-role or wrong-jurisdiction access fails closed.

- Add product-neutral clinical terminology systems, source scopes, candidate
  contracts and deterministic human/animal fixtures for SOS, Vet, UHC and the
  terminology service.

- Reexport flat-claim resource graphs from the new dependency-neutral
  `fhir-data-utils-ts`; existing SOS import paths remain compatible.

## 0.3.4

- Add governed synthetic repository examples and a privacy validator that
  rejects personal workstation paths, ungoverned telephone examples,
  operational domains and values supplied by an ignored local denylist.
- Keep violation output value-free so a CI or pre-push report does not repeat
  the private datum it detected.

## 0.3.3

- Make the main-before-publish local-first release order canonical in the package README, synchronization guide, layering guide and repository skills.

## 0.3.2

- Add neutral emergency-evidence names and retain the older `Soschain*` names
  as deprecated references to the same immutable contracts.
- Define the canonical two-layer shared architecture:
  `sos-data-utils-ts` for deterministic contracts and `sos-sdk-core-ts` for
  runtime-neutral orchestration consumed by Vet, UHC and SOSChain runtimes.

## 0.3.1

- Add the product-neutral flat-claims resource graph with parent-owned
  `<ResourceType>.contained-reference-list` links and graph identity kept
  separate from clinical `identifier`.
- Add reusable PDF/JPG/PNG `DocumentReference` entries, XHTML/language
  narrative claims and legacy containment-flag normalization without emitting
  `is-contained` or `contained-parent-reference` on new writes.

## 0.3.0

- Own the reusable emergency evidence vocabulary, flat emergency Group and
  ServiceRequest claims, and card-to-Place/vehicle association contracts.
- Allow SOS, Vet and UHC SDKs to consume one deterministic data layer while
  keeping authorization and orchestration in their respective SDKs.

## 0.2.3

- Add the verified technical-controller telephone as a governed veterinary
  alternative to the official marketplace telephone.
- Make the human-health production activation gate explicit: the organization
  remains inactive until its postal code is confirmed against the immutable
  form-PDF hash.
- Define the shared professional-invitation OTP contract: both employee email
  and phone are required, initial delivery uses email, organization activation
  is required first, and DCR stays separate.

## 0.2.2

- Add the product-neutral `speciesId7 + cardNumber20` preimage and lowercase
  SHA3-256 asset-id builder shared by human and animal subject cards.
- Bind human cards implicitly to NCBI Taxonomy `9606` as `0009606`, without
  displaying species or asking a person for it.
- Keep species outside every printed 21-digit card and exclude its final Damm
  check digit from blockchain identity material.

## 0.2.1

- Add the shared product-neutral Task artifact schema backed by canonical flat
  FHIR-like claims from `gdc-common-utils-ts`.
- Require standard `Task.status` and `Task.intent` instead of making a UI
  display label mandatory for machine-created jobs.

## 0.2.0

- Add the shared sector-and-country organization-verification policy for
  Canadian and US veterinary and human-health organizations.
- Keep veterinary official-marketplace-phone OTP confirmation distinct from
  human-health authenticated-email plus postal-code verification.
- Keep production hostnames outside the public package contract; deployments
  supply them through private environment configuration.
- Require legal organizations to use `Organization/_transaction` and keep any
  later DCR activation code separate from verification challenges.

## 0.1.0

- Add the dependency-free shared BFF API-layer contract.
- Require capability-based public assistant routes and keep internal routes
  explicitly separate.
- Reject product-name public API prefixes by construction.
