import { describe, expect, it } from "vitest";

import { containsLikelyPersonalData } from "../src/shared/privacy";

describe("likely-personal-data detection", () => {
  it.each([
    "Email the owner at person@example.com",
    "Call +44 20 7946 0958",
    "AWS account ID: 123456789012",
    "Use MRN 12345",
    "This is a real patient record",
  ])("rejects %s", (value) => {
    expect(containsLikelyPersonalData(value)).toBe(true);
  });

  it("allows the curated fictional Aurora Demo Unit lesson", () => {
    expect(
      containsLikelyPersonalData(
        "Aurora Demo Unit learned to protect a ten-minute interruption-free handover period.",
      ),
    ).toBe(false);
  });
});
