# Animal-card One Health interoperability

Emergency channels can recognize an animal after reading a conforming animal
card. That capability is a cross-sector contract, not sector-specific policy.

The current 21-digit card number and its `did:web` form do not embed species.
They therefore cannot be used to infer a species. The resolved subject resource
must provide these canonical Schema.org flat claims:

- `org.schema.Organization.additionalType = animal`;
- `org.schema.Organization.sameAs = <card DID>`; and
- `org.schema.Organization.member.additionalType =
  http://purl.obolibrary.org/obo/NCBITaxon_<taxId>`.

`readAnimalCardFromFlatClaims(...)` validates the species-bound Damm digit and
returns the stable NCBI coding separately from any label. A malformed card,
missing taxonomy claim, human TaxId or mismatched species fails closed.

```ts
const animalCard = readAnimalCardFromFlatClaims(subject.meta.claims)
if (animalCard) {
  // Stable offline identity; safe to use even when terminology is unavailable.
  const { system, code } = animalCard.species
}
```

## Terminology enrichment

The NCBI TaxId is the durable identity. A UI may resolve an English or local
label through the terminology stack, but the label never participates in card
validation, index lookup, authorization or a signed resource.

The intended read order is:

1. search an already verified local terminology snapshot;
2. on a miss, let the authenticated BFF call the terminology API;
3. let that service check its hosted catalog before an explicitly configured
   NCBI upstream adapter; and
4. fall back honestly to an available scientific/English label or the code.

No layer may invent a translation. The current terminology packages already
support verified local snapshots, but automatic SDK cache-miss fallback and an
NCBI Taxonomy upstream adapter remain separate implementation work.

Card providers continue to own issuance, animal onboarding and veterinary
policy. This package only reads and validates the resulting cross-sector
identity. Subject resolution never grants clinical access or break-glass authority.
