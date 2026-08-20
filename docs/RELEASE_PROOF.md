# v0.1.0 release proof

This file contains sanitized, reproducible evidence only. It must not contain
credentials, connection strings, account IDs, hostnames, vectors, full prompts,
memory content, or raw provider responses.

## Repository baseline

- Repository: `Luis195f/nurmanos-agentic-memory` (public).
- Release branch: `codex/h1-agentic-memory-vertical-slice`.
- H0 historical commit on `main`: `ce56ae5ccffb7c56b77e2e30a56b1e9bd0e5e21a`.
- Safe H1 hardening checkpoint: `6f9970d`.
- License: MIT.

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

- `pnpm install --frozen-lockfile`: lockfile current, no packages downloaded.
- Prettier: all files matched.
- ESLint: passed with zero findings.
- TypeScript: passed with zero errors.
- Vitest: `10` files, `34` tests passed.
- Vite: `1,896` modules; JS `281.19 kB` (`85.80 kB` gzip), CSS
  `10.73 kB` (`3.17 kB` gzip), HTML `0.86 kB` (`0.46 kB` gzip).
- Lambda: one Node.js 22 CJS bundle, `1.9 MB`; no source map.
- Production dependency audit: no known vulnerabilities.
- Secret scan: working tree `0`; complete Git history `0` high-confidence matches.
- Public artifact audit: `5` current files checked; `0` findings and no stale hashed assets.
- `git diff --check`: passed; line-ending notices are informational on Windows.
- UI audit: production preview at 1,440×1,000 and 390×844, English and Spanish,
  semantic DOM, keyboard focus indicator, reduced-motion rule, empty/offline states,
  and 44 px interactive targets verified. The public API flow remains a deployment gate.

## Deployment and public E2E

To be filled only from the deployed stack and unauthenticated browser journey:

- final frontend/API origins;
- sanitized CloudFormation resources and health status;
- migration 003 postflight constraints/indexes;
- synthetic store/update/retrieve request IDs and keys;
- namespace-isolation result;
- Bedrock tool transition and vector-index evidence;
- HTTP, CORS, CSP, security headers, mobile/desktop, keyboard, and failure checks;
- explicitly removed temporary keys and retained demo keys.

Release status remains pre-release until these fields and GitHub CI are verified.
