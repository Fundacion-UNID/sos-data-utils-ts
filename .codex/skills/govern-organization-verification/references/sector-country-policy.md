# Sector and country policy

## Governed CA/US matrix

| Sector | Contact proof | Legal-address proof | Confirmation | Telephone legal activation |
| --- | --- | --- | --- | --- |
| `animal-care` | Numeric OTP sent outbound to the marketplace organization's official telephone | Verified marketplace primary location | Authenticated web portal or outbound telephone callback | Yes |
| `health-care` | Authenticated representative/controller email | Numeric one-time code delivered to the legal postal address | Authenticated web portal only | No |

Both profiles require an existing marketplace organization and an immutable
application PDF whose SHA-256 is stored with the challenge. Marketplace
membership does not itself prove the controller or legal address.

For human health, the authenticated email session is the contact proof; do not
invent a second application-email OTP. The postal code is the user-entered
address proof. The later GW licence/DCR code is not either challenge.

## Existing marketplace organizations

- Marketplace record without an active host tenant: verify the application,
  submit `Organization/_transaction`, and accept `Order/_batch` only if the
  host returns a new Offer required for provisioning.
- Active host tenant: reissue or bind the independently authorized controller;
  do not manufacture another commercial Offer or Order.

An individual organization uses its separate
`individual/.../Organization/_transaction` route and is not a legal-organization
compatibility exception.

## Production operator identities

Production operator hostnames and root `did:web` domains are private deployment
configuration. Do not place their literal values, deprecated aliases or DNS
inventory in public skills, README files, examples or data packages. Product
adapters receive the approved value through their private environment/profile
and fail closed when it is absent.

## Test adapter

The one-command local stack starts the owning portal, product GW, ICA and
assistant. It creates the application through the portal, records the immutable
PDF digest, invokes the selected delivery adapter, obtains the test-only code
out of band, confirms it through the real protected portal route, provisions or
reuses the tenant, and only then runs telephone/profile/DCR journeys. Never
preauthorize ICA merely to fabricate a product tenant.
