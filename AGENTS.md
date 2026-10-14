# AGENTS.md - sos-data-utils-ts

## Repository privacy is a release blocker

- Use `.codex/skills/protect-repository-privacy/SKILL.md` before editing tests,
  docs, examples, manifests, env templates, skills or release material.
- Import governed synthetic values from `sos-data-utils-ts/repository-privacy`.
  Do not repeat telephone, tenant, domain, DID or path literals in consumers.
- `$HOME` is portable; a username, absolute workstation path or assumed
  directory layout below it is not.
- Keep real domains, phone numbers, tenant/company identifiers and deployment
  routing only in ignored local files or external secret/configuration stores.
- Run privacy validation before every commit, merge, publish and push. A
  private repository is not an exception.

## Coordinated releases

Accumulate every grouped functional change and changelog entry without changing
the package version. Merge them all into `main`, run the cumulative local gate,
and only then create one version-only release branch. Preserve each released
version at its exact published SHA as immutable `stable/v<version>` so rollback
never depends on reconstructing history. Never increment once per feature.

Follow `docs/MVP_SNAPSHOT_RELEASES.md`. Merge and push validated shared sources
to `main`, then use immutable `npm pack` artifacts with temporary `--no-save`
installs to prove the real local Vet channel (portal, phone service, chatbot or
other supported channel) -> BFF or channel service -> high-level SDK -> GW VET
journey without skips. Merge and push validated consumer sources to `main`,
publish exact commits to the public registry, pin exact registry versions, and
only then promote to staging.
