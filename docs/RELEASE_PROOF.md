# v0.1.0 local synthetic demo release proof

This file contains sanitized, reproducible evidence only. It must not contain
credentials, connection strings, account IDs, hostnames, vectors, full prompts,
memory content, or raw provider responses.

## Repository baseline

- Repository: `Luis195f/nurmanos-agentic-memory` (public).
- Release branch: `codex/h1-agentic-memory-vertical-slice`.
- H0 historical commit on `main`: `ce56ae5ccffb7c56b77e2e30a56b1e9bd0e5e21a`.
- Safe H1 hardening checkpoint: `6f9970d`.
- Local-demo implementation commit:
  `77dfcea6eccaa99fc3af98fc3fcd3c69239d1ff0`.
- License: MIT.

## Zero-cost runtime decision

- Release title: `NurManOS Agentic Memory v0.1.0 — Local Synthetic Demo`.
- H1 AWS deployment: intentionally not created or updated.
- Local runtime: browser-only `localStorage` plus deterministic textual overlap.
- External runtime calls in `local-demo`: none; an automated fetch spy verifies it.
- AWS adapter: retained for future explicit activation and never selected
  automatically.
- CockroachDB evidence below is historical, sanitized pre-release evidence. No
  CockroachDB query or write was performed while finalizing local-demo.
- Incremental cloud cost caused by this release: EUR 0.00 expected; normal local
  electricity and internet access are outside repository control.

## CockroachDB preflight

- Cluster engine: CockroachDB CCL v26.2.5, AWS region `eu-west-1`.
- H1 table rows: `0`.
- Null metadata: `0`.
- Missing `synthetic`: `0`.
- Non-boolean `synthetic`: `0`.
- `synthetic` other than JSON boolean true: `0`.
- H0 historical rows: `3`; H0 was not targeted by H1 migration statements.
- H1 shape verified: UUID primary key and namespace, unique namespace/key pair,
  `VECTOR(1024)`, JSONB metadata, timestamps, and a session-prefixed cosine index.
- `EXPLAIN` selected the session-prefixed vector index for bounded retrieval and the
  unique `(session_id, memory_key)` arbiter for the transactional upsert.

Recovery before migration: because H1 is empty, no H1 row recovery is required;
add the strict constraint and remove the permissive column default before removing
the legacy constraint. H0 remains in its independent table. For any future non-empty
migration, use managed backup/restore.

## CockroachDB migration 003 postflight

- Applied to `defaultdb` on 2026-08-20 through the authenticated Cloud SQL shell,
  one statement per transaction: strict constraint (`30 ms`), metadata default
  removal (`30 ms`), and legacy constraint removal (`40 ms`).
- `h1_synthetic_required` is validated and is the only synthetic-metadata check.
- The live `metadata` column is `JSONB NOT NULL` with no default.
- All primary, unique, length, category, and synthetic constraints are validated.
- UUID, `VECTOR(1024)`, JSONB, timestamps, unique namespace/key, global L2 vector,
  and session-prefixed cosine vector indexes are present.
- H1 postflight remains `0` rows and all five synthetic-boundary exception counts
  remain `0`. H0 remains `3` rows and was not modified.

## Local release-candidate verification

- `pnpm install --frozen-lockfile`: lockfile current; `0` packages downloaded.
- Prettier: all files matched.
- ESLint: passed with zero findings.
- TypeScript: passed with zero errors.
- Vitest: `11` files, `41` tests passed.
- Local-mode coverage includes no network/AWS/Bedrock/Cockroach execution,
  store/reload/retrieve, new-conversation continuity, idempotent upsert, workspace
  isolation, local reset, disclosure, likely-personal-data rejection, and CSP.
- Vite local-demo build: `1,898` modules; JS approximately `292.4 kB`
  (`89.4 kB` gzip), CSS `11.18 kB` (`3.24 kB` gzip), HTML `0.86 kB`.
- Lambda: one Node.js 22 CJS bundle, `1.9 MB`; no source map.
- Production dependency audit: no known vulnerabilities.
- Secret scan: working tree `0`; complete Git history `0` high-confidence matches.
- Public artifact audit: `6` current files checked; `0` findings and no stale hashed assets.
- `git diff --check`: passed; line-ending notices are informational on Windows.
- Production CSP: `connect-src 'self'` with no configured external API origin.
- Chrome local E2E: Spanish disclosure visible; store, reload, new conversation,
  grounded textual retrieval, and idempotent update passed; no console warning or
  error was recorded. Final reset is repeated after synchronizing `main`.
- Final GitHub commit/CI references are recorded after the release candidate is
  merged.

## Deliberately unavailable in v0.1.0

- No public frontend or API URL.
- No H1 CloudFormation, Lambda, API Gateway, Amplify, Bedrock, or CockroachDB E2E.
- No claim of production readiness, AI execution, embedding generation, or vector
  retrieval in local mode.

The missing public E2E is an accepted `NO-GO` chosen to avoid new cloud cost. The
release becomes GO only for the local synthetic demonstration after GitHub CI,
merge, release publication, and a real local Chrome journey succeed.
