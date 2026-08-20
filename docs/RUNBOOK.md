# Operations runbook

## Fast triage

1. Check `GET /api/health`. A failure points to API Gateway, Lambda routing, or
   deployment; health intentionally does not read Secrets Manager, Bedrock, or DB.
2. Correlate the opaque client request ID with structured Lambda logs. Never ask a
   user for prompt text or inspect stored content during routine triage.
3. Check Lambda errors, throttles, p95 duration, API 5xx, concurrency, and the
   seven-day access log. Access logs omit request body, IP, and user agent.
4. Determine whether the failure is validation (4xx), capacity/provider (429/5xx),
   CORS/CSP, Bedrock, database/TLS, or frontend deployment.

## Bedrock failures

- Confirm `eu.amazon.nova-micro-v1:0` and `amazon.titan-embed-text-v2:0` access in
  `eu-west-1`, then inspect sanitized stop-reason/timeout metrics.
- Validate the Lambda role still has only the required model ARNs.
- For throttling, keep concurrency bounded; do not increase quotas or spend without
  reviewing the public-abuse controls and expected recurring cost.
- Unsupported stop reasons or repeated tool validation failures indicate model-flow
  drift; preserve the allowlist and runtime-owned namespace.

## CockroachDB failures

- Confirm cluster health through the provider console without revealing connection
  data. Check TLS `verify-full`, secret field names, role grants, and SQLSTATE counts.
- Serializable retry `40001` is expected at low frequency and is retried three times.
  Persistent timeouts require query-plan and index inspection, not higher limits.
- Run `SHOW CONSTRAINTS`, `SHOW INDEXES`, and sanitized counts. Never query or export
  content for routine health checks.

## Frontend, CORS, and CSP

- Confirm the deployed frontend origin exactly equals the CloudFormation parameter
  and that `VITE_API_BASE_URL` contains only the HTTPS API base.
- Build again after either origin changes. The production CSP is generated during
  Vite build. `customHttp.yml` must be included in Amplify deployment.
- A browser CORS error with a healthy API usually means origin drift. Do not add `*`.

## Secret rotation

1. Create a new dedicated least-privilege database password through the control plane.
2. Update the existing Secrets Manager version without printing or downloading it.
3. Invoke health, then one isolated synthetic store/retrieve probe.
4. Revoke the previous credential only after verification. Record timestamp and
   operator in the private operations system, not this public repository.

## Backup and recovery

CockroachDB Cloud managed backups are the primary recovery mechanism; verify their
status and retention in the provider console before a pilot. For a faulty H1 schema
change, stop writes, restore to a separate database/cluster or apply the documented
forward fix, validate counts/constraints, and repoint the secret only after review.
H0 tables are independent and must never be dropped as part of H1 rollback.

## Temporary shutdown

Set Lambda reserved concurrency to `0` or disable the `POST /api/agent` route while
leaving the static explanatory page available. If abuse persists, disable the API
stage. Record the original configuration first so restoration is deterministic.

## Alerts and cost

The stack creates alarms for Lambda errors, throttles, p95 duration, and API 5xx,
but no notification target. Connect an approved SNS destination privately. Adding an
AWS Budget requires an operator-supplied email and is intentionally not automated.
Review Bedrock invocations, Lambda duration, API requests, log ingestion, secret,
Amplify bandwidth, and Cockroach usage weekly during public exposure.

## Low-volume cost envelope

The intended public-demo envelope is approximately **USD 1–5/month** at low traffic,
before tax and excluding any paid support: four standard alarms and one secret are
the main predictable AWS floor; Amplify, HTTP API, Lambda, logs, Nova, Titan, and S3
are usage-based. CockroachDB Basic is usage-based and eligible pay-as-you-go accounts
receive a shared monthly USD 15 usage credit, currently equivalent to 50 million RUs
and 10 GiB. This is an estimate, not a cap. Keep Cockroach capacity limits, API
throttling, and reserved concurrency enabled; review the provider calculators before
any campaign or traffic increase.

Current pricing references:

- <https://aws.amazon.com/bedrock/pricing/>
- <https://aws.amazon.com/lambda/pricing/>
- <https://aws.amazon.com/api-gateway/pricing/>
- <https://aws.amazon.com/cloudwatch/pricing/>
- <https://aws.amazon.com/secrets-manager/pricing/>
- <https://aws.amazon.com/amplify/pricing/>
- <https://www.cockroachlabs.com/docs/cockroachcloud/plan-your-cluster-basic>
