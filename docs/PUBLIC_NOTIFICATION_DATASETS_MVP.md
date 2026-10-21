# Public notification datasets MVP

## Status and scope

This document is a design contract for review. It does not claim that the
datasets, publisher authorization, subscriptions or delivery flow are already
implemented.

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
ca-bc_health-care_public_blood-donation_whole-blood_a-positive
ca-bc_health-care_public_blood-donation_whole-blood_a-negative
ca-bc_health-care_public_blood-donation_whole-blood_b-positive
ca-bc_health-care_public_blood-donation_whole-blood_b-negative
ca-bc_health-care_public_blood-donation_whole-blood_ab-positive
ca-bc_health-care_public_blood-donation_whole-blood_ab-negative
ca-bc_health-care_public_blood-donation_whole-blood_o-positive
ca-bc_health-care_public_blood-donation_whole-blood_o-negative
```

Plasma donation does not require a blood-group segment in the MVP:

```text
ca-bc_health-care_public_blood-donation_plasma
```

`plasma` describes the requested donation. The extraction method is not part
of the dataset name.

## Public veterinary datasets

A verified animal-care service may publish a public veterinary notification:

```text
ca-bc_animal-care_public_veterinary_dog_alert
ca-bc_animal-care_public_veterinary_cat_alert
ca-bc_animal-care_public_veterinary_dog_instruction
ca-bc_animal-care_public_veterinary_cat_instruction
```

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

## Notification record

One dataset may contain notifications from multiple verified organizations.
Each record carries at least:

```text
notificationId
datasetName
issuerReference
issuerName
title
message
locations
publishedAt
validUntil
status
```

`issuerReference` is a stable protected organization reference. A tax number,
registration number or other raw legal identifier must not appear in the
dataset name, broker key or general logs.

`status` supports `active`, `cancelled` and `expired`. Updating or cancelling a
notification preserves its identity so BFFs can apply the change
idempotently.

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
assistants, chat and KIA templates must send the same canonical operation to
their authenticated BFF. A channel may change prompts and presentation, but it
must not define its own topic grammar or suppression semantics.

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
