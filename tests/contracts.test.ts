import { describe, expect, it } from "vitest";

import {
  agentRequestSchema,
  retrieveMemoriesInputSchema,
  retrieveMemoriesToolInputSchema,
  storeMemoryInputSchema,
  storeMemoryToolInputSchema,
} from "../src/shared/contracts";

const sessionId = "00000000-0000-4000-8000-000000000201";

describe("strict request contracts", () => {
  it("accepts the bounded synthetic agent request", () => {
    expect(
      agentRequestSchema.parse({
        sessionId,
        message: "Remember this synthetic lesson.",
        syntheticDataConfirmed: true,
      }),
    ).toBeTruthy();
  });

  it("rejects missing confirmation, oversized messages, and extra fields", () => {
    expect(() =>
      agentRequestSchema.parse({
        sessionId,
        message: "Remember this.",
        syntheticDataConfirmed: false,
      }),
    ).toThrow();
    expect(() =>
      agentRequestSchema.parse({
        sessionId,
        message: "x".repeat(601),
        syntheticDataConfirmed: true,
      }),
    ).toThrow();
    expect(() =>
      agentRequestSchema.parse({
        sessionId,
        message: "Remember this.",
        syntheticDataConfirmed: true,
        arbitrarySql: "DROP TABLE memories",
      }),
    ).toThrow();
  });

  it("rejects extra tool fields and enforces the retrieval bound", () => {
    expect(() =>
      storeMemoryInputSchema.parse({
        sessionId,
        memoryKey: "handover-focus",
        content: "Protect an interruption-free handover period.",
        category: "handover",
        source: "unknown",
      }),
    ).toThrow();
    expect(() =>
      storeMemoryToolInputSchema.parse({
        sessionId,
        memoryKey: "handover-focus",
        content: "Protect an interruption-free handover period.",
        category: "handover",
      }),
    ).toThrow();
    expect(() =>
      retrieveMemoriesToolInputSchema.parse({
        sessionId,
        query: "What did we learn?",
        limit: 1,
      }),
    ).toThrow();
    expect(() =>
      retrieveMemoriesInputSchema.parse({
        sessionId,
        query: "What did we learn?",
        limit: 4,
      }),
    ).toThrow();
  });
});
