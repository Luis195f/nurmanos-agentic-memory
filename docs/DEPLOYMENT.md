# Deployment hold and future procedure

## Current decision

H1 is intentionally **not deployed**. Do not create or update CloudFormation,
Lambda, API Gateway, Amplify, Bedrock, Secrets Manager, SSM, CloudWatch, or other
AWS resources for v0.1.0. Do not query or write CockroachDB Cloud for the local
demo. This hold is a conscious zero-new-cost decision, not an abandoned backend.

Run the supported local runtime with `pnpm dev:local`; it uses browser
`localStorage`, deterministic textual matching, and no external network request.

Everything below is retained only as a future, explicitly authorized procedure.

## Prerequisites

- Node.js `22.14.0` and pnpm `10.15.0`.
- AWS access to `eu-west-1`, Bedrock model access, CloudFormation, Lambda, API
  Gateway, S3, IAM, Logs, Alarms, Secrets Manager, and Amplify.
- CockroachDB Cloud access and a dedicated runtime role.
- No production secret in shell history, source, build arguments, or `VITE_*`.

## Validate and build the prepared code

```bash
pnpm install --frozen-lockfile
pnpm check
pnpm audit --prod --audit-level high
pnpm security:scan
pnpm audit:public
git diff --check
```

The outputs are `dist/frontend` and `dist/lambda/index.js`; no `.map` file should
exist. Local mode uses `VITE_APP_MODE=local-demo`. A future AWS build must be
selected explicitly and would use:

```dotenv
VITE_APP_MODE=aws
VITE_API_BASE_URL=https://example.execute-api.eu-west-1.amazonaws.com
```

## Database

For a clean database, execute `001_h1_memory.sql`, replace the role placeholder and
execute `002_h1_runtime_grants.sql`, then apply `003_h1_require_synthetic_metadata.sql`.
For upgrade, run the documented preflight counts in `RELEASE_PROOF.md`, add the strict
constraint first, verify it, then drop the legacy constraint through `003`.

Recovery: H1 is isolated from H0. Before a non-empty migration, capture sanitized
counts and use managed backup/restore. The strict constraint can be removed as a
forward recovery only after writes are stopped and the incident is understood.
Both clean install and upgrade require explicit metadata; no default may label
unknown input as synthetic.

## Lambda and API

Zip `dist/lambda/index.js` at archive root and upload it to a private versioned S3
artifact location. Create/update `infra/template.yaml` with:

- `ArtifactBucket` and immutable `ArtifactKey`;
- dedicated `DatabaseSecretArn`;
- exact final `FrontendOrigin`;
- default Bedrock IDs unless a reviewed regional change is required.

CloudFormation may create IAM resources. Review the change set, then verify stack
outputs, log retention, alarms, reserved concurrency, throttling, exact CORS, health,
and generic error handling. Keep the artifact bucket private.

## Amplify

Build the frontend with the deployed API origin. Deploy `dist/frontend` and include
root `customHttp.yml`, or connect Amplify to this repository with the equivalent
build configuration. Verify HTTPS, the CSP meta policy, Amplify response headers,
desktop/mobile rendering, and an unauthenticated session.

AWS supports repository-root `customHttp.yml` for Amplify custom response headers:
<https://docs.aws.amazon.com/amplify/latest/userguide/setting-custom-headers.html>.

## Public verification

```bash
H1_API_BASE_URL=https://example.execute-api.eu-west-1.amazonaws.com \
H1_FRONTEND_ORIGIN=https://example.amplifyapp.com \
pnpm verify:public
```

Also complete the same store → new conversation → semantic retrieve journey in a
fresh browser, repeat the stable key to verify update idempotency, verify a different
workspace cannot retrieve it, inspect network errors for leakage, and capture only
request IDs, counts, keys, categories, outcomes, similarities, and timings.

## Rollback

Redeploy the prior immutable Lambda artifact and prior Amplify deployment, or roll
back the CloudFormation stack to the last successful template/parameters. If runtime
integrity is uncertain, set reserved concurrency to zero first. Database rollback is
restore/forward-fix; do not delete H0 resources or unknown rows.
