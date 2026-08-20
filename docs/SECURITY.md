# Security posture

## Implemented controls

- Strict Zod objects reject extra properties and bound messages, categories,
  memory keys, queries, result limits, activity events, and model output.
- The runtime owns the UUID namespace; tool schemas intentionally omit `sessionId`.
- The tool allowlist contains only store and retrieve, with one operation and two
  model turns maximum. The system instruction treats tool-policy changes as hostile.
- Likely personal data is rejected both at the browser request and model-produced
  tool content boundaries.
- All SQL values are parameterized. Upserts are transactional and idempotent;
  serializable retries, query timeouts, and namespace-prefixed retrieval are bounded.
- API CORS uses one exact HTTPS origin. API and frontend emit CSP, anti-framing,
  no-sniff, referrer, permissions, no-store, and HSTS controls where applicable.
- Lambda reads one named secret and may invoke only the required Bedrock models.
  No IAM statement uses a bare `Resource: "*"`.
- Logs and client evidence are sanitized. Error responses omit exception details.
- The public bundle contains no source maps. CI audits dependencies, repository
  history, working tree, build artifacts, formatting, types, tests, and builds.
- API throttling and reserved concurrency reduce public abuse and runaway cost.

## Residual risks

- There is no authentication. The UUID in browser storage is an untrusted bearer
  namespace suitable only for synthetic demonstration data.
- Pattern-based personal-data rejection is fallible and is not a substitute for
  DLP, governance, policy enforcement, or human review.
- Rate limits are stack-level coarse limits, not per-user quotas or WAF controls.
- The language model can misunderstand intent. Database and tool schemas remain
  the authority; model prose must not be treated as a safety control.
- v0.1.0 has no automated data expiry or user-facing deletion operation.
- Alarms have no notification action until an operator supplies an approved target.

## Secret handling

The repository contains examples only. `VITE_*` values are public by definition
and may contain only the API origin. Database connection material belongs in a
dedicated Secrets Manager secret with `host`, `port`, `database`, `username`,
`password`, and `ca`. Never print, download, paste into an issue, or commit its
value. Rotate the database password first, update the secret, test health and one
synthetic transaction, then revoke the old credential.

## Reporting

Do not place exploit details or secrets in a public issue. Contact the repository
owner through GitHub with a minimal, sanitized reproduction. This project makes
no medical-security or regulatory-readiness claim.
