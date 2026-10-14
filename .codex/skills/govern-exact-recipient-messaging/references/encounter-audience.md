# Encounter-driven audience

Reconcile a channel only after the destination accepts handover. Resolve the
source and destination as exact `HealthcareService` references and supply only
their server-authorized professional Group assignments.

- Permanent transfer: source `completed`, destination `in-progress`; remove
  source Groups and add destination Groups.
- Temporary transfer: source `on-hold`, destination `in-progress`; retain
  source Groups and add destination Groups.
- Return: temporary source `completed`, resumed destination `in-progress`;
  remove temporary Groups and retain/restore the home Groups.

Keep the subject-facing/family journey event separate from the professional
channel delta. Never include Group membership, endpoints or internal messages
in that projection. Never alter a historical Communication recipient list.

The data helper validates deterministic inputs. The BFF and high-level SDK own
authorization, atomic persistence, idempotency and emission of subsequent
Communications.
