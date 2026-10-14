<!-- Copyright 2026 Connecting Solution & Applications Ltd under the Apache License, Version 2.0. -->
# Organization subject-Group access

## Ownership and dependency direction

This package owns reusable emergency and cross-sector data contracts. It does
not describe or depend on consumer repositories. The acyclic dependency
direction is:

```text
fhir-data-utils + gdc-common-utils
                 ↓
          sos-data-utils
                 ↓
     runtime and application layers
```

Existing `gdc-*` packages are consumed without product-specific changes. A
product package must not be imported by any lower layer.

## Records that must remain separate

- The legal `Organization` controls the subject population.
- An enumerated subject `Group` lists exact `Patient` references. Animals are
  represented by animal Patients; the Group is not a replacement digital twin.
- An enumerated practitioner `Group` lists exact active `PractitionerRole`
  references.
- One employee-workflow `Consent` authorizes the exact PractitionerRole to
  join the practitioner Group.
- A second active `Consent` names the subject Group as subject and the
  practitioner Group as actor. It carries only the allowed operation.
- A `Location`, including a mobile vehicle Location, supplies operational
  context and never grants authority.

Every Group and Consent is an independent claims-first resource. Native FHIR
R4/R5 is restricted to explicit import or presentation adapters. Consent
authoring and readback use the shared `BundleEditor`, typed Consent setters and
`BundleReader`; application code does not write a parallel Demo model.

## Municipal cat colony

1. A municipal controller creates or selects an enumerated animal Group for a
   colony. The municipality may be its broad Location and a park or managed
   colony area may be a narrower Location.
2. The controller issues a separate municipality employee profile to a
   veterinarian and assigns it to the subject-registration practitioner Group.
3. That profile may register an organization-controlled animal only when its
   employee Consent contains the organization-filtered `Subject.c` capability.
   It may update the colony Group membership only when the separate Consent
   contains the exact Group identifier and managing Organization filters and
   both authorities remain active.
4. The veterinarian creates and clinically attests chip, vaccination and other
   veterinary facts under the applicable veterinary authority. Membership
   management does not grant clinical read or clinical authorship.
5. Removing the PractitionerRole from the manager Group, removing the animal
   from the colony Group, or inactivating either Consent ends that route.

One person may therefore have three independently unlocked profiles:

1. municipality-issued veterinarian/subject-manager;
2. private-clinic organization controller; and
3. private-clinic veterinarian.

They may share a verified login email for discovery, but never a wallet,
profile PIN/passkey session, PractitionerRole, organization authority or
Consent. The UI groups them by Organization and asks which profile to unlock.

## Passenger transport and emergency access

1. A breeder or other controlling Organization creates the animal record.
2. A veterinarian separately attests identity, chip and vaccination facts.
3. The controller accepts time-bounded membership in the exact flight animal
   Group. The aircraft is a mobile FHIR Location and the flight Group is the
   authorization subject; neither the aircraft nor the airline sector grants
   access.
4. The airline controller manages an exact cabin-crew practitioner Group.
5. An active Group-scoped Consent may grant that Group read-only access to the
   IPS immunization section for passenger administration. It carries no create,
   update or delete operation.
6. The flight attendant may verify the SHC and view only the authorized
   projection. They must not create or change clinical data.
7. Flight completion expires/removes the transport membership and its bounded
   permission. Emergency treatment or break-glass remains a distinct audited
   Consent journey.

Applications execute identity verification, SHC verification, emergency
requests, break-glass and limited cross-sector viewing. Providers supply
governed subject identity and professional attestations through explicit
interfaces; those facts do not execute or authorize the emergency journey.

## Demo and Test Network parity

Demo and Test Network use the same UI and BFF operations:

- `get` returns the current claims-first Group and Consent resources;
- `set` validates the whole intended replacement and returns readback;
- Demo persists them in a resettable synthetic adapter; and
- Test Network calls the high-level SOS SDK and authoritative GW route.

The browser submits opaque profile and resource references. The BFF reopens
the selected profile, resolves current organization and Group membership,
applies optimistic versioning, and invokes the SDK. Demo may replace only the
persistence adapter; it may not bypass authorization decisions or expose a
different form.

## Proof state

The SOS data contracts and focused tests are implemented. High-level SOS SDK,
GW enforcement, portal BFF integration and complete municipality/transport
browser journeys remain required before either use case is described as
locally proven or deployed.
