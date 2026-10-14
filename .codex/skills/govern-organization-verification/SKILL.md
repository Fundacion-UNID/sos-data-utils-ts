---
name: govern-organization-verification
description: Apply or audit the shared legal-organization verification policy by sector and ISO country. Use for marketplace onboarding, immutable form PDFs, official-phone OTP, postal address codes, portal-versus-telephone confirmation, Organization transaction and Offer/Order decisions, DCR activation separation, production hostnames, local fixtures or SYNC.md updates.
---

# Govern organization verification

Read [references/sector-country-policy.md](references/sector-country-policy.md)
before changing organization onboarding, confirmation channels, production
host identity or local tenant fixtures.

## Apply the shared contract

1. Import the sector/country policy from `sos-data-utils-ts`; do not duplicate
   the matrix in an SDK, portal or gateway. Production hostnames are private
   deployment configuration and must not be exported by this data package.
2. Resolve policy from the business sector plus ISO 3166-1 alpha-2 country.
   Fail closed when the pair is not governed.
3. Bind every challenge to the marketplace organization, application id and
   immutable PDF SHA-256.
4. Keep contact proof, legal-address proof and the later licence/DCR activation
   code as different secrets with different purposes.
5. Submit legal organizations through `Organization/_transaction`, never
   `Organization/_batch`. Use `Order/_batch` only when a new host Offer exists;
   established tenants use governed reissuance/controller binding without a
   fictional Order.
6. Keep public BFF routes capability-based. Never expose product-name route
   prefixes.

## Place behavior in its owner

- Put shared types, resolvers and non-secret fixtures here.
- Keep production hostnames only in private deployment configuration and
  secret/operator runbooks, never in public skills, README files or packages.
- Keep marketplace, official-phone, authenticated portal and postal adapters
  in their owning application layers.
- Keep reusable orchestration primitives outside this data package.
- Do not add application behavior to frozen lower-level packages.

## Prove the journey

Write the smallest red policy test first. Then prove product adapters and one
real local portal journey. A local delivery adapter may expose a challenge only
to the test runner; production routes, browser responses, logs and telephone
prompts must never expose it. Update the owning product skill and every affected
`SYNC.md` in the same change.
