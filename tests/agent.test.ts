import type { ContentBlock } from "@aws-sdk/client-bedrock-runtime";
import { describe, expect, it, vi } from "vitest";

import { runAgent } from "../src/lambda/agent";
import type { BedrockGateway, BedrockTurn } from "../src/lambda/bedrock";
import type { MemoryDatabase } from "../src/lambda/database";

const request = {
  sessionId: "00000000-0000-4000-8000-000000000201",
  message: "Remember the synthetic handover lesson.",
  syntheticDataConfirmed: true as const,
};
const requestId = "00000000-0000-4000-8000-000000000299";
const embedding = Array.from({ length: 1024 }, () => 0.01);

function bedrockWithResponses(responses: BedrockTurn[]): BedrockGateway {
  return {
    embed: vi.fn().mockResolvedValue(embedding),
    converse: vi.fn(
      async () => responses.shift() ?? { stopReason: "end_turn", content: [] },
    ),
  };
}

function databaseMock(): MemoryDatabase {
  return {
    store: vi.fn().mockResolvedValue({
      memoryKey: "handover-focus",
      category: "handover",
      content: "Protect an interruption-free handover period.",
      outcome: "stored",
    }),
    retrieve: vi.fn().mockResolvedValue([
      {
        memoryKey: "handover-focus",
        category: "handover",
        content: "Protect an interruption-free handover period.",
        similarity: 0.91,
      },
    ]),
  };
}

describe("bounded Bedrock tool loop", () => {
  it("validates and executes an autonomous store request before the final answer", async () => {
    const bedrock = bedrockWithResponses([
      {
        stopReason: "tool_use",
        content: [
          {
            toolUse: {
              toolUseId: "store-1",
              name: "store_supervisor_memory",
              input: {
                memoryKey: "handover-focus",
                content: "Protect an interruption-free handover period.",
                category: "handover",
              },
            },
          },
        ],
      },
      {
        stopReason: "end_turn",
        content: [
          { text: "Stored the lesson under memory key handover-focus." },
        ],
      },
    ]);
    const database = databaseMock();

    const result = await runAgent(request, requestId, bedrock, database);

    expect(database.store).toHaveBeenCalledOnce();
    expect(result.memoryKeys).toEqual(["handover-focus"]);
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
    expect(
      result.events.find((event) => event.type === "memory_stored")?.outcome,
    ).toBe("stored");
    expect(result.events.map((event) => event.type)).toEqual([
      "tool_requested",
      "input_validated",
      "embedding_created",
      "memory_stored",
      "final_response",
    ]);
  });

  it("executes semantic retrieval and returns supporting keys", async () => {
    const bedrock = bedrockWithResponses([
      {
        stopReason: "tool_use",
        content: [
          {
            toolUse: {
              toolUseId: "retrieve-1",
              name: "retrieve_supervisor_memories",
              input: {
                query: "What did we learn?",
                limit: 3,
              },
            },
          },
        ],
      },
      {
        stopReason: "end_turn",
        content: [
          {
            text: "The unit learned to protect handover time [handover-focus].",
          },
        ],
      },
    ]);
    const database = databaseMock();

    const result = await runAgent(request, requestId, bedrock, database);

    expect(database.retrieve).toHaveBeenCalledOnce();
    expect(result.memoryKeys).toEqual(["handover-focus"]);
    expect(
      result.events.some((event) => event.type === "vector_retrieval"),
    ).toBe(true);
    expect(
      result.events.find((event) => event.type === "vector_retrieval")
        ?.similarities,
    ).toEqual([0.91]);
  });

  it("rejects a second tool operation instead of allowing an unbounded chain", async () => {
    const tool = {
      toolUse: {
        toolUseId: "retrieve",
        name: "retrieve_supervisor_memories",
        input: {
          query: "What did we learn?",
          limit: 1,
        },
      },
    } satisfies ContentBlock;
    const bedrock = bedrockWithResponses(
      [tool, tool].map((content) => ({
        stopReason: "tool_use",
        content: [content],
      })),
    );
    await expect(
      runAgent(request, requestId, bedrock, databaseMock()),
    ).rejects.toThrow("Tool round limit exceeded");
  });

  it("rejects model attempts to inject an anonymous session namespace", async () => {
    const bedrock = bedrockWithResponses([
      {
        stopReason: "tool_use",
        content: [
          {
            toolUse: {
              toolUseId: "retrieve-1",
              name: "retrieve_supervisor_memories",
              input: {
                sessionId: "00000000-0000-4000-8000-000000000202",
                query: "What did we learn?",
                limit: 1,
              },
            },
          },
        ],
      },
    ]);
    await expect(
      runAgent(request, requestId, bedrock, databaseMock()),
    ).rejects.toThrow();
  });

  it("rejects a final response without Bedrock end_turn", async () => {
    const bedrock = bedrockWithResponses([
      { stopReason: "max_tokens", content: [{ text: "Incomplete" }] },
    ]);
    await expect(
      runAgent(request, requestId, bedrock, databaseMock()),
    ).rejects.toThrow("did not complete");
  });

  it("rejects likely personal data introduced in tool content", async () => {
    const bedrock = bedrockWithResponses([
      {
        stopReason: "tool_use",
        content: [
          {
            toolUse: {
              toolUseId: "store-unsafe",
              name: "store_supervisor_memory",
              input: {
                memoryKey: "unsafe-memory",
                content:
                  "Contact person@example.com after the fictional review.",
                category: "learning-review",
              },
            },
          },
        ],
      },
    ]);
    const database = databaseMock();
    await expect(
      runAgent(request, requestId, bedrock, database),
    ).rejects.toThrow("synthetic-data validation");
    expect(database.store).not.toHaveBeenCalled();
  });
});
