# NurManOS Agentic Memory

NurManOS Agentic Memory is a bounded, synthetic-data demo for nursing-supervision
workflows. Amazon Bedrock autonomously decides when to store or retrieve an
operational lesson, Amazon Titan creates its embedding, and CockroachDB keeps the
memory durable and semantically searchable inside an anonymous browser session.

## H1 status

The H1 vertical slice is implemented and locally verified. It includes:

- a React public-demo interface with curated store and recall journeys;
- a typed, two-round maximum Bedrock tool loop;
- 1,024-dimensional Titan embeddings;
- session-isolated CockroachDB vector storage and retrieval;
- a least-privilege Lambda, API Gateway, and Secrets Manager CloudFormation
  template; and
- sanitized activity events that never expose prompts, vectors, SQL, model
  reasoning, or credentials.

The repository does not claim a completed H1 public deployment until sanitized
runtime evidence has been captured against the deployed API and frontend. The H0
eligibility evidence remains in [docs/H0_RUNTIME_PROOF.md](docs/H0_RUNTIME_PROOF.md).

## Safety boundary

Only synthetic demonstration data may be used. Do not add real patient,
employee, hospital, unit, protocol, incident-report, contact, account, or
institutional-document data. This application is not clinical decision support.
Never commit credentials, certificates, database connection strings, raw vectors,
or unsanitized service output.

## Architecture

1. The browser creates and retains an anonymous UUID session.
2. API Gateway sends a bounded request to Lambda.
3. Bedrock Nova selects either `store_supervisor_memory` or
   `retrieve_supervisor_memories`.
4. Strict Zod contracts validate the model's tool input and enforce the browser
   session namespace.
5. Titan Text Embeddings V2 creates a normalized 1,024-dimensional embedding.
6. CockroachDB commits the synthetic memory or executes a session-prefixed cosine
   vector search.
7. Nova receives only the bounded tool result and returns a concise answer with
   supporting memory keys.

## Local development

Required runtime:

- Node.js 22.14.0
- pnpm 10.15.0

Install dependencies and validate the complete slice:

```bash
pnpm install --frozen-lockfile
pnpm check
```

For a frontend connected to a deployed API, copy `.env.example` to `.env.local`
and set `VITE_API_BASE_URL` to the API Gateway HTTPS origin. The same value is
used to generate the frontend Content Security Policy.

```bash
pnpm dev
```

## Deployment inputs

Run each schema statement as its own CockroachDB transaction:

- apply `infra/sql/001_h1_memory.sql` for a new H1 table;
- `infra/sql/002_h1_runtime_grants.sql` after replacing the role placeholder in
  an authenticated console; and
- apply `infra/sql/003_h1_require_synthetic_metadata.sql` once when upgrading a
  table created before the strict synthetic metadata constraint.

The AWS stack is defined in `infra/template.yaml`. It expects a Lambda artifact
in S3, a Secrets Manager secret ARN, and the exact deployed frontend origin. The
secret JSON must contain `host`, `port`, `database`, `username`, `password`, and
the CockroachDB CA certificate in `ca`.

Build artifacts locally with:

```bash
pnpm build
```

After deploying the API and frontend, run the sanitized end-to-end store/recall
probe:

```bash
H1_API_BASE_URL=https://api.example \
H1_FRONTEND_ORIGIN=https://frontend.example \
pnpm verify:public
```

The probe prints request IDs, memory keys, and sanitized event types only.

## License

[MIT](LICENSE)
