# Coordinated MVP beta snapshots

An MVP snapshot is an immutable, cross-repository compatibility point. It is
not inferred from `latest`, a moving branch or a staging deployment.

## Release transaction

1. Merge and push every validated shared dependency source and release version
   to `main`; prove each local shared `main` equals `origin/main`.
2. Build those unpublished shared main commits with `npm pack` and install each
   immutable tarball temporarily with `--no-save`; never commit local, Git,
   workspace or vendored dependencies.
3. Prove the affected local application journey through every changed
   boundary without skips, in addition to every affected package and service
   test.
4. Merge and push every validated consumer source and release version to
   `main`; prove each consumer `main` equals `origin/main` and keep the exact
   tarball hashes in the candidate manifest.
5. Publish those exact pushed package commits bottom-up to the public registry.
   Never publish an unmerged, unpushed or locally unproven package.
6. Install exact registry versions in consumers, commit pins and lockfiles,
   repeat the affected local gates, and merge/push those dependency-only
   updates.
7. Promote the exact registry-backed main commits to staging. Run the complete
   live staging E2E and preserve its evidence; a staging failure returns to the
   source branch and repeats the local-to-publication sequence with a new
   immutable version.
8. Create the same annotated snapshot tag in every participating repository.
9. Promote the verified manifest to production without rebuilding or
   substituting a later commit.

## Snapshot identity

Use `mvp-beta-N` for the manifest and `snapshot/mvp-beta-N` for annotated Git
tags. Tags are the immutable evidence. Create `release/mvp-beta-N` branches
only when that beta needs maintained fixes; a branch never replaces the tag.

Each snapshot manifest must record:

- repository URL, exact commit SHA and clean `main` proof;
- exact npm package versions plus integrity hashes;
- exact container image digests;
- included contracts and user-visible journeys;
- Node/runtime versions and every local gate result;
- privacy-gate result and confirmation that no private denylist value was
  echoed into logs;
- deployment promotions and live verification evidence.

Keep manifests in the release coordinator repository under
`docs/mvp-snapshots/mvp-beta-N.yaml`. Never place credentials, real telephone
numbers, tenant identifiers, operational domains or workstation paths in a
snapshot manifest.
