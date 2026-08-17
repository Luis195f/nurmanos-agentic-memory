import type {
  ContentBlock,
  Message,
  ToolUseBlock,
} from "@aws-sdk/client-bedrock-runtime";
import type { DocumentType } from "@smithy/types";

import {
  MAX_TOOL_ROUNDS,
  retrieveMemoriesInputSchema,
  storeMemoryInputSchema,
  type ActivityEvent,
  type AgentRequest,
  type AgentResponse,
} from "../shared/contracts";
import { activityEvent } from "../shared/events";
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

export async function runAgent(
  request: AgentRequest,
  requestId: string,
  bedrock: BedrockGateway,
  database: MemoryDatabase,
): Promise<AgentResponse> {
  const messages: Message[] = [
    {
      role: "user",
      content: [
        {
          text: `Anonymous demo session: ${request.sessionId}\nSynthetic-data confirmation: true\nUser message: ${request.message}`,
        },
      ],
    },
  ];
  const events: ActivityEvent[] = [];
  const memoryKeys = new Set<string>();

  for (let round = 0; round <= MAX_TOOL_ROUNDS; round += 1) {
    const content = await bedrock.converse(messages);
    const toolUses = content.filter(isToolUse);
    if (toolUses.length === 0) {
      const answer = finalText(content);
      if (!answer) throw new Error("Model did not return a final response");
      events.push(activityEvent("final_response"));
      return { answer, events, memoryKeys: [...memoryKeys], requestId };
    }
    if (round === MAX_TOOL_ROUNDS || toolUses.length !== 1) {
      throw new Error("Tool round limit exceeded");
    }

    const tool = toolUses[0]!.toolUse;
    if (!tool.toolUseId) throw new Error("Tool request identifier missing");
    events.push(activityEvent("tool_requested"));
    messages.push({ role: "assistant", content });

    if (tool.name === "store_supervisor_memory") {
      const input = storeMemoryInputSchema.parse(tool.input);
      if (input.sessionId !== request.sessionId)
        throw new Error("Session mismatch");
      events.push(activityEvent("input_validated"));
      const embedding = await bedrock.embed(input.content);
      events.push(activityEvent("embedding_created", { dimensions: 1024 }));
      const stored = await database.store(input, embedding);
      memoryKeys.add(stored.memoryKey);
      events.push(
        activityEvent("memory_stored", { memoryKeys: [stored.memoryKey] }),
      );
      messages.push(
        toolResultMessage(tool.toolUseId, {
          stored: true,
          memoryKey: stored.memoryKey,
          category: stored.category,
          synthetic: true,
        }),
      );
      continue;
    }

    if (tool.name === "retrieve_supervisor_memories") {
      const input = retrieveMemoriesInputSchema.parse(tool.input);
      if (input.sessionId !== request.sessionId)
        throw new Error("Session mismatch");
      events.push(activityEvent("input_validated"));
      const embedding = await bedrock.embed(input.query);
      events.push(activityEvent("embedding_created", { dimensions: 1024 }));
      const memories = await database.retrieve(input, embedding);
      memories.forEach((memory) => memoryKeys.add(memory.memoryKey));
      events.push(
        activityEvent("vector_retrieval", {
          memoryKeys: memories.map((memory) => memory.memoryKey),
        }),
      );
      messages.push(
        toolResultMessage(tool.toolUseId, {
          synthetic: true,
          memories: memories.map(({ memoryKey, category, content }) => ({
            memoryKey,
            category,
            content,
          })),
        }),
      );
      continue;
    }

    throw new Error("Unsupported tool requested");
  }

  throw new Error("Tool round limit exceeded");
}
