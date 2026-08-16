# Hackathon compliance gate

Status date: 2026-08-16 (Europe/Paris)

Authoritative source: [CockroachDB x AWS Hackathon official rules](https://cockroachdb-ai.devpost.com/rules).
If this document conflicts with the current official rules, the official rules
control. The rules may change, so they must be checked again immediately before
submission.

## Account and eligibility gate

- Devpost registration: **CONFIRMED** on 2026-08-16. The authenticated
  submission page displayed **Thanks for registering!** and offered the
  project-submission workflow.
- Entrant eligibility: **NOT CONFIRMED**. An eligible individual must be at
  least 18 or the age of majority in their jurisdiction. Teams may have up to
  five individuals. Organizations may enter if already organized or
  incorporated.
- Exclusions include jurisdictions where participation or receipt of a prize is
  prohibited and the specific exclusions listed in the official rules, plus
  promotion entities, their covered personnel/households/affiliates, judges,
  and conflicts of interest.
- A team or organization must appoint an eligible authorized representative.
- Registration requires joining on Devpost and accepting the Devpost Terms of
  Service and AWS Event Terms and Conditions.

These identity, residence, affiliation, authority, and acceptance facts require
human confirmation; repository evidence cannot establish them.

## Official dates

- Submission period: **June 30, 2026 at 10:00 EDT through August 18, 2026 at
  17:00 EDT**.
- Local deadline supplied by Devpost for Europe/Paris: **August 18, 2026 at
  23:00 CEST (UTC+02:00)**.
- Judging period: August 19, 2026 at 10:00 EDT through September 15, 2026 at
  17:00 EDT.
- Winners announced: on or around September 21, 2026 at 15:00 EDT.
- A submission cannot be altered after the submission period except for a
  narrowly permitted correction authorized by the Sponsor and Devpost.

## Mandatory project technologies and behavior

The entry must:

1. Be an agentic application.
2. Use CockroachDB as its persistent memory layer.
3. Be deployed on AWS.
4. Meaningfully integrate at least two of these CockroachDB tools, rather than
   merely initialize them:
   - CockroachDB Cloud Managed MCP Server;
   - CockroachDB Distributed Vector Indexing;
   - ccloud CLI (Agent-Ready);
   - CockroachDB Agent Skills Repo.
5. Meaningfully use at least one AWS service that powers the agent environment,
   including Amazon Bedrock, Lambda, ECS/EKS, S3, SageMaker, Bedrock Agents, or
   another qualifying AWS service.
6. Install and run consistently on its intended platform and behave as depicted
   in the submission materials.
7. Use only authorized third-party SDKs, APIs, and data under their applicable
   terms and licenses.

## New-project and pre-existing-work disclosure

Projects must be newly created by the entrant during the submission period, and
the submitted work must have been built during that period. Standard development
tools, frameworks, libraries, starter templates, and AI coding assistants are
expressly permitted. Any **other** pre-existing code or work incorporated into
the project must be disclosed.

The separate-repository strategy is compatible with the rule on its face: this
repository was initialized during the submission period and contains no private
NurManOS remote or imported private code. That is necessary but not sufficient.
The entrant must disclose any pre-existing work actually incorporated later,
including text, prompts, assets, schemas, designs, documentation, datasets, or
code. This document therefore does **not** claim "pre-existing work: none."

The final entry must be original, solely owned by the entrant/team/organization,
respect third-party intellectual-property and privacy rights, comply with open
source licenses, and not be derived from a project that received prohibited
financial or preferential support from the Sponsor or Administrator.

## Repository and public-demo requirements

The submission must provide:

- a public open-source repository URL;
- all necessary source code, dependencies, example configuration or datasets
  where applicable, and clear setup/run documentation;
- a visible open-source license file (MIT or Apache-2.0 recommended), detectable
  at the top of the repository page/About section;
- a functional demo URL available free of charge and without restriction for
  judging/testing through the judging period;
- a text description of features and functionality;
- an identification of the CockroachDB tools and AWS services used and an
  explanation of what the agent actually did with each.

If a private demo is used, testing credentials must be supplied in the testing
instructions. This H0 plan instead requires a public URL and will not put
credentials in the repository.

## Video and language requirements

The demonstration video must:

- be **less than three minutes** (judges need not watch beyond three minutes);
- show the project functioning on its intended device/platform;
- show the CockroachDB memory layer at work;
- be publicly visible on YouTube or Vimeo, with its URL in the submission;
- avoid third-party trademarks, copyrighted music, or other protected material
  unless the entrant has permission.

Submission materials must be in English. If any material is not in English, an
English translation must accompany the video, description, testing instructions,
and other submitted material.

## Judging

Stage One is a pass/fail baseline viability review: the project must fit the
theme and reasonably apply the required featured APIs/SDKs. Passing entries are
then judged on five equally weighted criteria:

1. Agentic Memory Design.
2. Technological Implementation.
3. Real-World Impact.
4. Product Readiness.
5. Creativity and Originality.

Judges specifically consider whether CockroachDB is a meaningful production-grade
memory layer, whether the CockroachDB tools are used correctly and safely, and
whether the system is secure, observable, scalable, and resilient.

## H0 compliance interpretation

Runtime proof—not configuration or intent—is required before this repository can
claim H0 GO. At minimum, the evidence record must prove the live CockroachDB
memory operations, two meaningful CockroachDB tool integrations, a real AWS
agentic invocation, and a reachable AWS-hosted public URL. Evidence must be
sanitized and based only on synthetic data.

Open human gates:

- Confirm the entrant eligibility facts that cannot be established by runtime
  or repository evidence (age, jurisdiction, affiliation, and authority).
- Confirm ownership and disclose any pre-existing work that may later be
  incorporated.
- Before submission, create the public GitHub repository, make the MIT license
  visible, publish the under-three-minute English demo, and complete the
  Devpost submission fields.
