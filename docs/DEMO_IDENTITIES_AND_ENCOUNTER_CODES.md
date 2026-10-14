# Demo identities and encounter codes

All demonstrations reuse the named exports from
`sos-data-utils-ts/demo-identities`. Portals, tests and documentation must not
invent names, telephone numbers, encounter codes or professional labels.

## People and roles

- A demo individual uses the shared synthetic `Doe` family name.
- Emergency contacts use the North American fictional `555` exchange supplied
  by the shared fixture.
- A professional display may show the person's synthetic given name followed
  by a governed role label.
- A role label never replaces the person's actual FHIR name and never proves a
  PractitionerRole, licence, employment relationship or permission.

## Encounter identity

The original FHIR instant, `Encounter.id`, provider business identifier and
human display code are different values.

The display convention keeps all ten derived epoch-second digits and groups
them for reading. If several encounters are created in the same second, the
provider allocates a short sequence atomically. It never changes the clinical
time to manufacture uniqueness.

Creation and lookup remain provider operations:

1. the provider assigns a UUID resource id;
2. it atomically reserves the business identifier within the assigning
   organization;
3. it stores the exact subject reference;
4. authoritative readback verifies both assigner and subject before returning
   the encounter.

The browser-visible code is therefore a search aid, not authority and not a
globally unique resource id. Reusable named values are exposed by
`SOS_ENCOUNTER_IDENTIFIER_EXAMPLE`; high-level documentation should reference
those names instead of copying raw values.
