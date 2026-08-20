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

In the current local demo, the browser stores bounded synthetic content, category,
opaque workspace UUID, and stable memory key in versioned `localStorage`. Nothing
is sent to AWS or CockroachDB. Browser storage is validated before use and can be
restored from the interface, but it is not encrypted or suitable for real data.

The prepared future backend would store bounded synthetic content and embeddings
in CockroachDB and send sanitized operational fields to CloudWatch. It is not
active in v0.1.0. Full prompts, memory content, embeddings, SQL, credentials,
hostnames, and model reasoning must never be logged.

The anonymous workspace UUID is a bearer namespace, not authentication. Anyone
who obtains it may address that synthetic workspace. This is acceptable only for
the public synthetic demo and must be replaced before any professional pilot.

## Retention

Local demo memory has no automated expiry in v0.1.0. The user can replace only the
current workspace with curated synthetic seeds using **Restaurar ejemplos**, or
clear site data through the browser. A pilot requires an approved retention
schedule, deletion workflow, subject-rights process, and verified backups before
accepting any regulated data.
