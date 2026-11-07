---
name: preserve-demo-test-network-adapter-parity
description: Preserve one use-case and Confidential Storage architecture across Demo, Test Network, production web, offline browser and Expo applications.
---

# Preserve Demo and Test Network adapter parity

Demo and Test Network execute the same application use cases, BFF contracts,
high-level SDK operations and GW managers. Demo changes only synthetic seeding,
authority evidence and the adapter selected at the composition root. It never
owns routes, stores, DTOs, editors, viewers or navigation that compete with the
Test Network path.

Use the canonical `IVaultRepository`/Confidential Storage port everywhere:

- `memory` for `all-local`, including GW and portal BFF state;
- `expo-sqlite` for Expo Android/iOS;
- `indexeddb` for explicitly offline browser custody;
- `firestore` or `postgresql` only for configured durable deployments.

Keep execution profiles distinct: the CH all-local portal profile does not
start or require Chat, the telephone assistant or the optional web assistant.
Audio/video uses a dedicated RTC provider. Persist only invitations, terminal
call events and optional unanswered audio through Communication.

Never import Firestore, PostgreSQL, SQLite or IndexedDB from a Demo use case or
route. Only a composition root may instantiate an adapter. IPFS/blob storage is
optional externalization behind a durable adapter and never selects business
behavior.

Every change must include a negative architecture test that rejects direct
adapter imports below the composition root and a real local UI -> BFF -> SDK ->
GW journey using `networkKind=test` and memory storage. Expo tests inject the
SQLite implementation into the same use cases rather than copying them.
