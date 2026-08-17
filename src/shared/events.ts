import type { ActivityEvent } from "./contracts";

const SAFE_LABELS: Record<ActivityEvent["type"], string> = {
  tool_requested: "Bedrock requested a bounded memory tool",
  input_validated: "Typed tool input passed strict validation",
  embedding_created: "Titan created a 1,024-dimensional embedding",
  memory_stored: "CockroachDB committed the synthetic memory",
  vector_retrieval: "CockroachDB executed vector retrieval",
  final_response: "Bedrock returned a grounded final response",
};

export function activityEvent(
  type: ActivityEvent["type"],
  details: Pick<ActivityEvent, "memoryKeys" | "dimensions"> = {},
): ActivityEvent {
  return { type, label: SAFE_LABELS[type], ...details };
}

export function eventsContainOnlySanitizedFields(
  events: ActivityEvent[],
): boolean {
  return events.every((event) => {
    const keys = Object.keys(event);
    return keys.every((key) =>
      ["type", "label", "memoryKeys", "dimensions"].includes(key),
    );
  });
}
