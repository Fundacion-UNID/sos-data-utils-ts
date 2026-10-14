# Shared organization-verification synchronization

## Blocking local-first release order

First merge and push every validated shared dependency source to `main`. Build
still-unpublished main commits with `npm pack`, install their immutable
tarballs temporarily with `--no-save`, and prove the affected local journey
without skips. Publish only exact validated commits, pin exact registry
versions and lockfiles, repeat the affected local gates, and only then promote
to staging. Never commit `file:`, Git, workspace or vendored dependencies.

`fhir-data-utils-ts` owns FHIR SearchParameter flat claims, resource graphs,
narrative claims and version projection helpers. `sos-data-utils-ts` owns the
reusable cross-sector clinical catalogs and fixtures, sector/country policy,
and test-data shape. SDKs consume these contracts but do not own or redefine
them. Deployment hostnames remain private environment configuration.

For immunization, shared catalogs describe terminology candidates and their
source/version/labels. Callers supply the exact taxonomy context used to
filter veterinary terminology or apply human policy. Vaccine product name is
free text in the MVP. Product authorization and barcode lookup are deferred
and remain separate from `Immunization.vaccine-code` and
`Immunization.target-disease`.

`buildImmunizationFlatGraph` is the cross-sector graph builder. It creates the
independent Immunization, optional Medication/DocumentReference entries,
ImmunizationRecommendation and its three 1m/1w/1d Tasks. Callers add species
or human policy and terminology such as WHO ATC
`J07BB02`. The shared next-channel selector never dispatches: services must
still enforce live preference, Consent, delivery adapters and acknowledgement.

The package boundary is documented in
[docs/SDK_LAYERING.md](docs/SDK_LAYERING.md). This deterministic data package
does not define consumer dependency graphs, application ownership or product
specialization.

The neutral FHIR package owns the version-neutral clinical resource graph.
Every resource is an independent flat-claims entry with an
internal `entryId` that is never copied into its business `identifier`. Parents
own a comma-separated `<ResourceType>.contained-reference-list`; child entries
do not persist `is-contained` or `contained-parent-reference`. Import adapters
may strip those legacy flags, while R4/R5/R6 export adapters choose contained
versus ordinary references.

All resource families preserve `<ResourceType>.language`,
`<ResourceType>.narrative-status` and `<ResourceType>.xhtml`. Each PDF, JPEG or
PNG is one independent DocumentReference entry; several parents may reference
the same evidence without duplicating it.

It also owns the cross-sector subject-card ledger-key profile. Callers validate
the 21-digit card first and hash `speciesId7 + cardNumber21[0..19]` with
SHA3-256. Human subjects use the fixed taxonomy context `0009606`; animal
subjects use separately stored taxonomy context. The card, species and
preimage never enter the ledger.

For Canada and the United States:

- veterinary (`animal-care`) uses the immutable application PDF plus outbound
  OTP to the marketplace organization's official telephone; confirmation may
  occur on the authenticated portal or telephone callback, and the marketplace
  primary location is the address evidence;
- human health (`health-care`) uses the immutable application PDF,
  authenticated representative/controller email and a numeric code delivered
  to the legal postal address; confirmation is web-only.

Both legal-organization flows use `Organization/_transaction`, never
`Organization/_batch`. `Order/_batch` follows only a newly returned host Offer.
The later licence/DCR activation code is independent. Individual organizations
continue on `individual/.../Organization/_transaction`.

Consumers import this contract and keep adapter, authorization and delivery
policy outside the data package.
