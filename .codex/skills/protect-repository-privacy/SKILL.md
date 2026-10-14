---
name: protect-repository-privacy
description: Prevent private operator or deployment data from entering tests, docs, examples, env templates, manifests, skills, snapshots, commits, releases or push history. Use before editing or pushing a repository and whenever a change includes paths, domains, DIDs, tenant/company identifiers, telephone numbers, credentials or test fixtures.
---

# Protect repository privacy

## Enforce before writing

- Treat public and private repositories identically.
- Use `$HOME` only when a path is necessary. Never encode a username, absolute
  workstation path or assumed directory layout below it.
- Keep operational domains, DIDs, tenant/company identifiers, telephone
  numbers and credentials in ignored local files or external configuration and
  secret stores. Versioned manifests declare required keys, not real values.
- Import synthetic examples from `sos-data-utils-ts/repository-privacy`.
  Never duplicate those literals in consumer tests or docs.
- Never copy a detected private value into a test denylist, error, changelog or
  commit message. Load exact denylist values from an ignored local file or CI
  secret and report only file, line and violation category.

## Gate every transition

1. Scan the diff and every changed documentation, test, fixture, example,
   manifest, env template and skill with `assertRepositoryPrivacy`.
2. Run strict-example mode for tests, env templates and deployment examples.
3. Run the gate before commit, before local merge, before package publication
   and before push.
4. Stop on any violation. A private repository or test-only value is not an
   exception.
5. Confirm the ignored local denylist finds no match without printing the
   matched value itself.

## Release and snapshot boundary

Follow [MVP_SNAPSHOT_RELEASES.md](../../../docs/MVP_SNAPSHOT_RELEASES.md).
Merge and push validated shared sources to `main`, build the unpublished
commits with `npm pack`, install them temporarily with `--no-save`, and prove
the affected local journey through every changed boundary without skips. Merge
and push validated consumer sources to `main`, publish those exact commits to
the public registry, reinstall exact registry versions, and only then promote
to staging.
