import { describe, expect, it } from "vitest";

import {
  activityEvent,
  eventsContainOnlySanitizedFields,
} from "../src/shared/events";

describe("sanitized activity events", () => {
  it("contains only the public allowlist", () => {
    const events = [
      activityEvent("tool_requested"),
      activityEvent("embedding_created", { dimensions: 1024 }),
      activityEvent("memory_stored", { memoryKeys: ["handover-focus"] }),
    ];
    expect(eventsContainOnlySanitizedFields(events)).toBe(true);
    expect(JSON.stringify(events)).not.toContain("content");
    expect(JSON.stringify(events)).not.toContain('embedding":[');
  });
});
