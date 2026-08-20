# Synthetic data boundary

## Allowed

Only invented operational-demo material is allowed: fictional units, shifts,
handover routines, hydration reminders, staffing exercises, and arbitrary memory
keys. Test emails, numbers, and identifiers may appear only in automated tests to
prove rejection and must not represent a person.

## Prohibited

Do not enter patient, worker, hospital, facility, incident, protocol, contact,
account, or institutional-document data. Do not upload clinical PDFs or content
from private NurManOS repositories. Do not use the demo to diagnose, prescribe,
triage, or recommend treatment.

The browser confirmation is a policy acknowledgement, not consent, de-identification,
or a legal basis for processing. Conservative pattern checks reject common email,
telephone, identifier, and record-like inputs, but they are not a DLP system.

## Storage and observability

CockroachDB stores the bounded synthetic content, embedding, category, opaque
workspace UUID, stable memory key, strict synthetic metadata, and timestamps.
CloudWatch receives request IDs, event types, categories, result counts, durations,
and outcomes only. It must never receive full prompts, memory content, embeddings,
SQL, credentials, hostnames, or model reasoning.

The anonymous workspace UUID is a bearer namespace, not authentication. Anyone
who obtains it may address that synthetic workspace. This is acceptable only for
the public synthetic demo and must be replaced before any professional pilot.

## Retention

Demo memory has no automated expiry in v0.1.0. Operators may remove explicitly
identified synthetic test rows. CloudWatch log retention is seven days. A pilot
requires an approved retention schedule, deletion workflow, subject-rights process,
and verified backups before accepting any regulated data.
