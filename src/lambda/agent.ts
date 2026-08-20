import type {
  ContentBlock,
  Message,
  ToolUseBlock,
} from "@aws-sdk/client-bedrock-runtime";
import type { DocumentType } from "@smithy/types";

import {
  MAX_TOOL_ROUNDS,
  retrieveMemoriesToolInputSchema,
  storeMemoryToolInputSchema,
  type ActivityEvent,
  type AgentRequest,
  type AgentResponse,
} from "../shared/contracts";
import { activityEvent } from "../shared/events";
import { containsLikelyPersonalData } from "../shared/privacy";
import type { BedrockGateway } from "./bedrock";
import type { MemoryDatabase } from "./database";

function isToolUse(
  block: ContentBlock,
): block is ContentBlock & { toolUse: ToolUseBlock } {
  return "toolUse" in block && Boolean(block.toolUse);
}

function finalText(content: ContentBlock[]): string | undefined {
  const text = content
    .flatMap((block) =>
      "text" in block && typeof block.text === "string" ? [block.text] : [],
    )
    .join("\n")
    .replace(/<thinking>[\s\S]*?<\/thinking>/gi, "")
    .replace(/<[^>]+>/g, "")
    .trim();
  return text ? text.slice(0, 1800) : undefined;
}

function toolResultMessage(toolUseId: string, result: DocumentType): Message {
  return {
    role: "user",
    content: [
      {
        toolResult: {
          toolUseId,
          status: "success",
          content: [{ json: result }],
        },
      },
    ],
  };
}

function elapsedMs(startedAt: number): number {
  return Math.min(
    24_000,
    Math.max(0, Math.round(performance.now() - startedAt)),
  );
}

export async function runAgent(
  request: AgentRequest,
  requestId: string,
  bedrock: BedrockGateway,
  database: MemoryDatabase,
): Promise<AgentResponse> {
  const agentStartedAt = performance.now();
  const messages: Message[] = [
    {
      role: "user",
      content: [
        {
          text: `Synthetic-data confirmation: true\nUser message: ${request.message}`,
        },
      ],
    },
  ];
  const events: ActivityEvent[] = [];
  const memoryKeys = new Set<string>();

  for (let round = 0; round <= MAX_TOOL_ROUNDS; round += 1) {
    const converseStartedAt = performance.now();
    const turn = await bedrock.converse(messages);
    const { content } = turn;
    const toolUses = content.filter(isToolUse);
    if (toolUses.length === 0) {
      if (turn.stopReason !== "end_turn") {
        throw new Error("Model did not complete the turn");
      }
      const answer = finalText(content);
      if (!answer) throw new Error("Model did not return a final response");
      events.push(
        activityEvent("final_response", {
          durationMs: elapsedMs(converseStartedAt),
        }),
      );
      return {
        answer,
        events,
        memoryKeys: [...memoryKeys],
        requestId,
        durationMs: elapsedMs(agentStartedAt),
      };
    }
    if (
      turn.stopReason !== "tool_use" ||
      round === MAX_TOOL_ROUNDS ||
      toolUses.length !== 1
    ) {
      throw new Error("Tool round limit exceeded");
    }

    const tool = toolUses[0]!.toolUse;
    if (!tool.toolUseId) throw new Error("Tool request identifier missing");
    messages.push({ role: "assistant", content });

    if (tool.name === "store_supervisor_memory") {
      events.push(
        activityEvent("tool_requested", {
          operation: "store",
          durationMs: elapsedMs(converseStartedAt),
        }),
      );
      const input = storeMemoryToolInputSchema.parse(tool.input);
      if (containsLikelyPersonalData(input.content)) {
        throw new Error("Tool content failed synthetic-data validation");
      }
      events.push(activityEvent("input_validated", { operation: "store" }));
      const embeddingStartedAt = performance.now();
      const embedding = await bedrock.embed(input.content);
      events.push(
        activityEvent("embedding_created", {
          operation: "store",
          dimensions: 1024,
          durationMs: elapsedMs(embeddingStartedAt),
        }),
      );
      const databaseStartedAt = performance.now();
      const stored = await database.store(
        { ...input, sessionId: request.sessionId },
        embedding,
      );
      memoryKeys.add(stored.memoryKey);
      events.push(
        activityEvent("memory_stored", {
          operation: "store",
          outcome: stored.outcome,
          memoryKeys: [stored.memoryKey],
          categories: [stored.category],
          resultCount: 1,
          durationMs: elapsedMs(databaseStartedAt),
        }),
      );
      messages.push(
        toolResultMessage(tool.toolUseId, {
          stored: true,
          outcome: stored.outcome,
          memoryKey: stored.memoryKey,
          category: stored.category,
          synthetic: true,
        }),
      );
      continue;
    }

    if (tool.name === "retrieve_supervisor_memories") {
      events.push(
        activityEvent("tool_requested", {
          operation: "retrieve",
          durationMs: elapsedMs(converseStartedAt),
        }),
      );
      const input = retrieveMemoriesToolInputSchema.parse(tool.input);
      events.push(activityEvent("input_validated", { operation: "retrieve" }));
      const embeddingStartedAt = performance.now();
      const embedding = await bedrock.embed(input.query);
      events.push(
        activityEvent("embedding_created", {
          operation: "retrieve",
          dimensions: 1024,
          durationMs: elapsedMs(embeddingStartedAt),
        }),
      );
      const databaseStartedAt = performance.now();
      const memories = await database.retrieve(
        { ...input, sessionId: request.sessionId },
        embedding,
      );
      memories.forEach((memory) => memoryKeys.add(memory.memoryKey));
      events.push(
        activityEvent("vector_retrieval", {
          operation: "retrieve",
          outcome: "retrieved",
          memoryKeys: memories.map((memory) => memory.memoryKey),
          categories: memories.map((memory) => memory.category),
          resultCount: memories.length,
          similarities: memories.map((memory) => memory.similarity),
          durationMs: elapsedMs(databaseStartedAt),
        }),
      );
      messages.push(
        toolResultMessage(tool.toolUseId, {
          synthetic: true,
          memories: memories.map(
            ({ memoryKey, category, content, similarity }) => ({
              memoryKey,
              category,
              content,
              similarity,
            }),
          ),
        }),
      );
      continue;
    }

    throw new Error("Unsupported tool requested");
  }

  throw new Error("Tool round limit exceeded");
}
