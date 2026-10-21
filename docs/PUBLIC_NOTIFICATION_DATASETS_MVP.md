# Public notification datasets MVP

## Status and scope

This document defines the MVP for review. The shared dataset grammar, browser
schema, flat-claim mapping and subscriber suppression rules are implemented in
this package. That does not by itself prove a deployed dataset, an authorized
gateway write or delivery to a real subscriber.

The MVP lets a verified organization publish a public notification to a
jurisdictional dataset. A person's BFF subscribes to selected datasets and
decides privately whether and how to deliver each notification.

The MVP includes:

- public notifications only;
- blood and plasma donation notifications from verified health-care services;
- public veterinary notifications from verified animal-care services;
- environment, animal and human notifications from verified public-health
  services; and
- push, web, email or SMS selection downstream in the subscriber's BFF.

Professional-only notifications, addressed private warnings and targeting of
specific homes, offices, floors or buildings are outside this MVP.

## Dataset name

The dataset name is a lowercase public routing identifier. Underscore (`_`)
separates the semantic segments. The MVP uses these three bounded families:

```text
<jurisdiction>_health-care_public_blood-donation_<donation-segments>
<jurisdiction>_animal-care_public_veterinary_<species>_<communication-category>
<jurisdiction>_animal-care_public_blood-donation_<species>_<communication-category>
<jurisdiction>_public-health_<environment|animal|human>_<topic>_<communication-category>
```

Rules:

- `jurisdiction` is the governed country or subdivision used by SOSChain, for
  example `ca-bc`;
- `publisher-sector` describes the verified publishing service, not the
  subscriber;
- every dataset is public in this MVP; the explicit `public` segment is
  retained in the health-care and animal-care families already selected for
  this contract, while `public-health` uses its shorter family name;
- topic segments use short English slugs; and
- the final segment is one of `alert`, `notification`, `reminder` or
  `instruction` when the dataset family needs a communication category.

The dataset name deliberately contains no LOINC, SNOMED CT, NCBI Taxonomy,
FHIR resource type, legal identifier or confidential routing value. More
specific terminology may be carried as optional record metadata in a future
increment without changing the MVP names.

## Blood and plasma donation datasets

A verified hospital, clinic or donation centre publishes through its active
health-care blood-donation service.

Whole-blood datasets include the requested blood group:

```text
ca-bc_health-care_public_blood-donation_whole-blood_a-rh-positive
ca-bc_health-care_public_blood-donation_whole-blood_a-rh-negative
ca-bc_health-care_public_blood-donation_whole-blood_b-rh-positive
ca-bc_health-care_public_blood-donation_whole-blood_b-rh-negative
ca-bc_health-care_public_blood-donation_whole-blood_ab-rh-positive
ca-bc_health-care_public_blood-donation_whole-blood_ab-rh-negative
ca-bc_health-care_public_blood-donation_whole-blood_o-rh-positive
ca-bc_health-care_public_blood-donation_whole-blood_o-rh-negative
```

Plasmapheresis and plateletpheresis do not require a blood-group segment in the MVP:

```text
ca-bc_health-care_public_blood-donation_plasmapheresis
ca-bc_health-care_public_blood-donation_plateletpheresis
```

The final segment names the applicable donation procedure without adding a
blood-group segment to the MVP name.

## Public veterinary datasets

A verified animal-care service may publish a public veterinary notification:

```text
ca-bc_animal-care_public_veterinary_dog_alert
ca-bc_animal-care_public_veterinary_cat_alert
ca-bc_animal-care_public_veterinary_dog_instruction
ca-bc_animal-care_public_veterinary_cat_instruction
```

The same verified animal-care service can request animal blood donation using
the simple MVP species channels:

```text
ca-bc_animal-care_public_blood-donation_dog_alert
ca-bc_animal-care_public_blood-donation_cat_alert
```

Animal blood groups and compatibility evidence belong in the notification body
or a governed future extension, not in the MVP dataset name.

The MVP uses the readable species values `dog` and `cat`. It does not put an
external species terminology code in the dataset name.

## Public-health datasets

Public-health datasets have three simple families.

### Environment

```text
ca-bc_public-health_environment_heat_alert
ca-bc_public-health_environment_allergy_notification
ca-bc_public-health_environment_fire_alert
ca-bc_public-health_environment_heat_instruction
```

### Animal

```text
ca-bc_public-health_animal_dog_alert
ca-bc_public-health_animal_cat_alert
ca-bc_public-health_animal_dog_instruction
ca-bc_public-health_animal_cat_instruction
```

### Human

```text
ca-bc_public-health_human_epidemic_alert
ca-bc_public-health_human_epidemic_instruction
ca-bc_public-health_human_pandemic_alert
ca-bc_public-health_human_pandemic_instruction
```

The concrete disease, affected area, recommendation and validity period belong
to the notification record. The MVP does not create a different dataset for
influenza, COVID or every other named condition.

## Dataset entry and shared writing schema

One dataset may contain requests from multiple verified organizations. Each
canonical entry is a FHIR `CommunicationRequest` represented as flat claims.
It carries the verified requester `PractitionerRole`, publishing organization,
topic Endpoint, public audience Group, priority, active period and references
to its content. Images, PDF files and the Markdown body are independent
`DocumentReference` entries.

The browser screen is driven by `PUBLIC_ALERT_FORM_SCHEMA`. It behaves like an
email editor and exposes only:

```text
datasetName
subject
bodyMarkdown
priority
validUntil
attachments
```

The BFF supplies the identifier, status, intent, requester, information
provider, topic Endpoint and audience Group after it verifies the employee's
active assignment. Those authority-bearing values are deliberately absent
from the JSON Schema and browser request.

The separate operational claim `sos.CommunicationRequest.public-dataset`
retains the exact dataset name needed for routing and discovery. It is not
presented as an official FHIR SearchParameter and it carries no authority.

The layers are therefore complementary, not alternatives:

1. the **dataset name** is the public topic address;
2. the **JSON Schema** renders and validates the shared writing screen; and
3. the **FHIR CommunicationRequest flat claims** are the canonical stored
   request.

If delivery is later performed, a delivery service may record the result as a
FHIR `Communication`. It must not rewrite the request into a proprietary
`PublicNotification` resource.

## Public catalogue projection

The public catalogue and the governed operational request remain separate
views of the same publication:

- the topic is described as a Schema.org `Dataset`, which is a kind of
  `CreativeWork`;
- a publicly readable notice may be projected as a Schema.org `CreativeWork`
  using `name`, `text`, `expires` and `publisher`; and
- downloadable representations use `encoding` with a `MediaObject`.
  Images may use the more specific `ImageObject`; a PDF uses a `MediaObject`
  with `encodingFormat` set to `application/pdf`.

This Schema.org view supports catalogue discovery and public presentation. It
does not carry employee authority, Consent, subscriber identity or delivery
state and does not replace the canonical FHIR `CommunicationRequest` and
`DocumentReference` flat claims.

The shared editor does not make the two audience models equivalent. An
addressed care-transition operation identifies one subject and the BFF resolves
only that subject's authorized caregivers. A public-dataset operation identifies
one dataset and never exposes subscriber references to the publisher.

The organization reference is stable and protected. A tax number, registration
number or other raw legal identifier must not appear in the dataset name,
broker key or general logs. Updating, revoking or completing a request
preserves its identity so subscriber BFFs can apply the change idempotently.

## Publisher authority

Membership in a sector does not grant publication authority. Before accepting
a record, the publishing service must verify:

1. the legal organization and active tenant;
2. the organization's governed publisher sector and jurisdiction;
3. the active department or service relevant to the dataset;
4. the acting employee's active assignment and publication capability; and
5. that the requested dataset is within that exact authority.

For example, a generic health-care tenant cannot publish blood-donation
notifications without an active blood-donation service and an authorized
actor. A municipality does not inherit every public-health capability merely
because it is a public body.

## Subscriber BFF rules

The public dataset contains no subscriber list, contact destination, blood
group, donation history, device token or current user location. Those remain
inside the subscriber's BFF.

The BFF may store and apply:

- subscribed dataset names;
- excluded issuer references;
- a temporary mute for a dataset or issuer;
- a user-selected maximum distance from a notification location;
- preferred delivery channels and quiet periods; and
- a configured minimum interval since the user's last donation.

The last-donation value may be entered voluntarily or read from authorized
data. It is used only to suppress a notification locally. It is not sent to
the publisher and does not assert that the person is eligible or ineligible to
donate.

A distant organization can therefore remain a valid publisher while one BFF
silences it because of distance or an explicit issuer exclusion. Another
subscriber may continue to receive the same public notification.

## Channel parity

The notification, subscription, issuer exclusion, mute and delivery-preference
shapes are channel-neutral. Personal portals, mobile applications, telephone
assistants and chat adapters must send the same canonical operation to their
authenticated BFF. A channel may change prompts and presentation, but it must
not define its own topic grammar or suppression semantics.

This does not require one deployed portal shell. Human, animal and emergency
portals may remain separate applications while importing the same versioned
contracts, complete screens where applicable and typed BFF client. The host
supplies a trusted product/jurisdiction capability manifest and adapters. A
browser or assistant cannot select a publisher sector, jurisdiction or
delivery authority that the BFF did not authorize.

The data package owns the operation payloads and validation rules. Public BFF
paths and client orchestration are shared application/SDK contracts; delivery
adapters for push, web, email and SMS remain runtime concerns. This boundary
prevents separate portals or channels from silently evolving incompatible
notification formats.

## Boundary with governed targeted campaigns

This public subscription flow is separate from the existing governed alert
campaign contract that evaluates a clinical cohort and records per-recipient
delivery authority. The public MVP publishes one notification and lets each
BFF match its own subscriptions and suppression rules. It does not create a
shared Group of eligible people and does not expose recipient references to
the publisher.
