import type { ContentBlock } from "@aws-sdk/client-bedrock-runtime";
import { describe, expect, it, vi } from "vitest";

import { runAgent } from "../src/lambda/agent";
import type { BedrockGateway } from "../src/lambda/bedrock";
import type { MemoryDatabase } from "../src/lambda/database";

const request = {
  sessionId: "00000000-0000-4000-8000-000000000201",
  message: "Remember the synthetic handover lesson.",
  syntheticDataConfirmed: true as const,
};
const requestId = "00000000-0000-4000-8000-000000000299";
const embedding = Array.from({ length: 1024 }, () => 0.01);

function bedrockWithResponses(responses: ContentBlock[][]): BedrockGateway {
  return {
    embed: vi.fn().mockResolvedValue(embedding),
    converse: vi.fn(async () => responses.shift() ?? []),
  };
}

function databaseMock(): MemoryDatabase {
  return {
    store: vi.fn().mockResolvedValue({
      memoryKey: "handover-focus",
      category: "handover",
      content: "Protect an interruption-free handover period.",
    }),
    retrieve: vi.fn().mockResolvedValue([
      {
        memoryKey: "handover-focus",
        category: "handover",
        content: "Protect an interruption-free handover period.",
      },
    ]),
  };
}

describe("bounded Bedrock tool loop", () => {
  it("validates and executes an autonomous store request before the final answer", async () => {
    const bedrock = bedrockWithResponses([
      [
        {
          toolUse: {
            toolUseId: "store-1",
            name: "store_supervisor_memory",
            input: {
              sessionId: request.sessionId,
              memoryKey: "handover-focus",
              content: "Protect an interruption-free handover period.",
              category: "handover",
            },
          },
        },
      ],
      [{ text: "Stored the lesson under memory key handover-focus." }],
    ]);
    const database = databaseMock();

    const result = await runAgent(request, requestId, bedrock, database);

    expect(database.store).toHaveBeenCalledOnce();
    expect(result.memoryKeys).toEqual(["handover-focus"]);
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
      [
        {
          toolUse: {
            toolUseId: "retrieve-1",
            name: "retrieve_supervisor_memories",
            input: {
              sessionId: request.sessionId,
              query: "What did we learn?",
              limit: 3,
            },
          },
        },
      ],
      [{ text: "The unit learned to protect handover time [handover-focus]." }],
    ]);
    const database = databaseMock();

    const result = await runAgent(request, requestId, bedrock, database);

    expect(database.retrieve).toHaveBeenCalledOnce();
    expect(result.memoryKeys).toEqual(["handover-focus"]);
    expect(
      result.events.some((event) => event.type === "vector_retrieval"),
    ).toBe(true);
  });

  it("rejects a third tool round", async () => {
    const tool = {
      toolUse: {
        toolUseId: "retrieve",
        name: "retrieve_supervisor_memories",
        input: {
          sessionId: request.sessionId,
          query: "What did we learn?",
          limit: 1,
        },
      },
    } satisfies ContentBlock;
    const bedrock = bedrockWithResponses([[tool], [tool], [tool]]);
    await expect(
      runAgent(request, requestId, bedrock, databaseMock()),
    ).rejects.toThrow("Tool round limit exceeded");
  });

  it("rejects model attempts to cross the anonymous session namespace", async () => {
    const bedrock = bedrockWithResponses([
      [
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
    ]);
    await expect(
      runAgent(request, requestId, bedrock, databaseMock()),
    ).rejects.toThrow("Session mismatch");
  });
});
