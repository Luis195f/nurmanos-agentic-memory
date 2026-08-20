import { z } from "zod";

export const MAX_BODY_BYTES = 12_288;
export const MAX_MESSAGE_LENGTH = 600;
export const MAX_TOOL_ROUNDS = 1;
export const MAX_AGENT_DURATION_MS = 24_000;

export const categorySchema = z.enum([
  "handover",
  "family-communication",
  "equipment-readiness",
  "learning-review",
]);

const sessionIdSchema = z.string().uuid();
const memoryKeySchema = z
  .string()
  .min(3)
  .max(64)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

const storeMemoryFields = {
  memoryKey: memoryKeySchema,
  content: z.string().trim().min(8).max(500),
  category: categorySchema,
};

const retrieveMemoryFields = {
  query: z.string().trim().min(3).max(500),
  limit: z.number().int().min(1).max(3),
};

export const agentRequestSchema = z
  .object({
    sessionId: sessionIdSchema,
    message: z.string().trim().min(3).max(MAX_MESSAGE_LENGTH),
    syntheticDataConfirmed: z.literal(true),
  })
  .strict();

export const storeMemoryToolInputSchema = z.object(storeMemoryFields).strict();

export const storeMemoryInputSchema = z
  .object({ sessionId: sessionIdSchema, ...storeMemoryFields })
  .strict();

export const retrieveMemoriesToolInputSchema = z
  .object(retrieveMemoryFields)
  .strict();

export const retrieveMemoriesInputSchema = z
  .object({ sessionId: sessionIdSchema, ...retrieveMemoryFields })
  .strict();

export const activityEventSchema = z
  .object({
    type: z.enum([
      "tool_requested",
      "input_validated",
      "embedding_created",
      "memory_stored",
      "vector_retrieval",
      "local_text_retrieval",
      "final_response",
    ]),
    label: z.string().max(120),
    operation: z.enum(["store", "retrieve"]).optional(),
    outcome: z.enum(["stored", "updated", "retrieved"]).optional(),
    memoryKeys: z.array(memoryKeySchema).max(3).optional(),
    categories: z.array(categorySchema).max(3).optional(),
    resultCount: z.number().int().min(0).max(3).optional(),
    similarities: z.array(z.number().min(0).max(1)).max(3).optional(),
    durationMs: z.number().int().min(0).max(MAX_AGENT_DURATION_MS).optional(),
    dimensions: z.literal(1024).optional(),
  })
  .strict();

export const agentResponseSchema = z
  .object({
    answer: z.string().max(1800),
    events: z.array(activityEventSchema).max(12),
    memoryKeys: z.array(memoryKeySchema).max(3),
    requestId: z.string().uuid(),
    durationMs: z.number().int().min(0).max(MAX_AGENT_DURATION_MS),
  })
  .strict();

export type AgentRequest = z.infer<typeof agentRequestSchema>;
export type AgentResponse = z.infer<typeof agentResponseSchema>;
export type ActivityEvent = z.infer<typeof activityEventSchema>;
export type StoreMemoryToolInput = z.infer<typeof storeMemoryToolInputSchema>;
export type RetrieveMemoriesToolInput = z.infer<
  typeof retrieveMemoriesToolInputSchema
>;
export type StoreMemoryInput = z.infer<typeof storeMemoryInputSchema>;
export type RetrieveMemoriesInput = z.infer<typeof retrieveMemoriesInputSchema>;
