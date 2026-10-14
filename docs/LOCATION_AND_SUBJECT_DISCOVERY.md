# Location and subject discovery

`sos-data-utils-ts/location-proximity` owns the neutral Schema.org flat-claim
contracts for persistent `Place` resources, concrete `IndividualProduct`
devices or vehicles, immutable observation `Event` records and proximity
resolution. The claims in `resource.meta.claims` are canonical storage and
index input; native projections are adapter outputs.

`sos-data-utils-ts/subject-card-directory` owns discovery records for human and
animal cards. `createSubjectCardDirectoryEntry(...)` validates the provider,
subject kind and final relationship vocabulary. Directory discovery never
grants access: every protected operation still requires its consent, policy
and provider-issued authorization evidence.

Animal cards are parsed through
`sos-data-utils-ts/animal-card-interoperability`. Species is a separate NCBI
Taxonomy code resolved from governed flat claims; it is never guessed from a
card number, DID or display label.

Products may add policy and UI, but they must not publish prefixed copies or
temporary aliases of these contracts.

Executable contracts:

- `tests/location-proximity.test.mjs`
- `tests/subject-card-directory.test.mjs`
- `tests/animal-card-interoperability.test.mjs`
