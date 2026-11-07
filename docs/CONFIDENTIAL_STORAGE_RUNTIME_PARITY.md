# Confidential Storage runtime parity

Demo and Test Network run the same use cases. Demo supplies resettable synthetic
inputs and non-authoritative selections; it does not define a second storage or
API model.

All domain and channel state crosses the canonical `IVaultRepository` /
Confidential Storage port. The application composition root selects `memory`
for all-local, Expo SQLite for native applications, IndexedDB for explicit
browser-offline custody, or a configured Firestore/PostgreSQL adapter for a
durable deployment. Firestore must not be imported by Demo routes or use cases.

Communication is canonical GW state. Chat may keep transient delivery,
presence, active-call and WebRTC signaling state, but a completed, missed or
received call is materialized through the same Communication use case as Test
Network. Optional IPFS/blob externalization remains behind the storage adapter.
