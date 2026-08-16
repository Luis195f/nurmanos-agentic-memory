# H0 runtime proof

Evidence date: 2026-08-16 (Europe/Paris)

This record contains sanitized runtime evidence only. It contains no database
passwords, AWS credentials, account number, cluster identifier, raw embedding
vectors, or private NurManOS material. All memory rows contain synthetic text.

## CockroachDB core

- Cluster: sanitized CockroachDB Cloud demo cluster, Basic plan, AWS Ireland
  (`eu-west-1`), available.
- Server: CockroachDB CCL `v26.2.5`.
- Standard driver: Psycopg `3.3.4`, TLS `verify-full`, database `defaultdb`,
  dedicated H0 SQL user (name withheld).
- Memory schema: UUID primary key, unique memory key, synthetic content,
  `VECTOR(1024)`, JSONB metadata, and timestamps.
- Embeddings: real Amazon Titan Text Embeddings V2 outputs, model
  `amazon.titan-embed-text-v2:0`, four invocations, all 1,024 dimensions.
- Stored synthetic row identifiers:
  - `00000000-0000-4000-8000-000000000101` — `h0-medication-safety`
  - `00000000-0000-4000-8000-000000000102` — `h0-hydration-plan`
  - `00000000-0000-4000-8000-000000000103` — `h0-mobility-support`
- Distributed vector index: `CREATE VECTOR INDEX
  h0_agent_memories_embedding_idx ON public.h0_agent_memories (embedding)`
  succeeded. `SHOW INDEXES` reported the visible index on `embedding`; the
  optimizer reported `vector search table:
  h0_agent_memories@h0_agent_memories_embedding_idx`.
- Semantic query result for “Which synthetic memory is about drinking water?”:
  `h0-hydration-plan` (`0.884571`), `h0-mobility-support` (`1.229282`), then
  `h0-medication-safety` (`1.277029`).
- Transaction proof: an atomic write/read CTE returned the written row; a
  separate primary-key read confirmed 1,024 dimensions. The temporary proof
  row was then removed. Psycopg independently committed an update/read-back
  transaction against `h0-hydration-plan` and returned marker `true`.
- Known non-blocking cluster limitation: `crdb_internal.gossip_nodes` is not
  implemented inside this virtual cluster (`SQLSTATE 0A000`). It was not used
  as evidence.

## Second CockroachDB tool

- Selected candidate: official CockroachDB Agent Skill `cockroachdb-sql`,
  metadata author `cockroachdb`, version `1.0`.
- Machine-readable capability: `SKILL.md` front matter plus the structured
  CockroachDB rule set in `references/cockroachdb-rules/`.
- Agent action: converted the H0 memory requirements into CockroachDB-native
  schema, DML, vector-index, vector-query, transaction, and cleanup statements;
  required UUID keys and `VECTOR(1024)`; prevented batched vector writes; and
  ran `EXPLAIN` before connected generated SELECT/DML statements.
- Runtime outcome: the generated schema, individual inserts, native distributed
  vector index, vector plan, semantic ordering, transaction, and cleanup all ran
  against the live cluster.
- Role: development/operational agent workflow, not application runtime.
- Residual weakness: the competition interpretation still depends on judges
  accepting official Agent Skills used during development as meaningful tool
  integration. The runtime evidence is stronger than installation alone, but
  the skill is not shipped inside the deployed H0 health page.

## AWS and Bedrock

- AWS identity: authenticated; account number withheld (last four digits
  retained in private console evidence only). Initial administrative CloudShell
  work ran under the account root identity.
- Runtime least privilege: Bedrock proof was repeated as assumed role
  `NurManOSH0BedrockRuntimeRole`. Its inline policy permits only
  `bedrock:InvokeModel` for Titan V2 and the EU Nova Micro profile. A bootstrap
  identity could only assume that role; every one-time access key used for the
  proof was deleted immediately.
- Region: `eu-west-1`.
- Embedding: `amazon.titan-embed-text-v2:0`; four real invocations returned
  1,024 dimensions (token counts 16, 15, 13, and 9).
- Converse: `eu.amazon.nova-micro-v1:0`.
- Typed tool: `retrieve_agent_memories`, requiring only `query` (3–200
  characters) and `limit` (integer 1–3), with additional fields forbidden.
- Sanitized loop: first stop reason `tool_use`; model requested query
  `drinking water`, limit `3`; validation passed; Titan embedded the request;
  the bounded Psycopg executor queried the Cockroach vector index; hydration
  ranked first; a matching `toolResult` was returned; second stop reason
  `end_turn`; the final answer named the hydration memory. No model reasoning
  trace is retained here.

## AWS deployment

- Method: AWS Amplify Hosting manual static deployment, used as the required
  Amplify-first H0 probe. This is an H0 health page, not product implementation.
- Region: `eu-west-1`.
- Job: `SUCCEED`, started `2026-08-16T20:36:54.785Z`, completed
  `2026-08-16T20:36:57.121Z`.
- Public URL: <https://h0.d2pzfyr2zhkqk2.amplifyapp.com>
- Verification: HTTP 200 and marker `NURMANOS_H0_RUNTIME_OK`; independently
  opened in authenticated Chrome at approximately `2026-08-16T22:37+02:00`.

## Security and cost

- Database credential: generated for the scoped SQL user, held only in browser
  memory and a non-echoing CloudShell environment variable; never printed or
  written to the repository.
- TLS: CockroachDB cluster CA downloaded only to CloudShell's standard
  PostgreSQL certificate location; driver hostname verification succeeded.
- AWS credentials: no static secret was placed in the repository. Ephemeral
  bootstrap access keys were deleted immediately after role assumption.
- Repository secret scans: zero high-confidence matches in the working tree and
  zero high-confidence matches in all Git history before this evidence commit.
- AWS Budgets: zero configured budgets were found. Creation remains a human
  action because no notification recipient was authorized for transmission.

## Scope lock

H0 proves external eligibility dependencies only. The hackathon product has not
been implemented.
