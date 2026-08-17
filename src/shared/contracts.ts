import { z } from "zod";

export const MAX_BODY_BYTES = 12_288;
export const MAX_MESSAGE_LENGTH = 600;
export const MAX_TOOL_ROUNDS = 2;

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

export const agentRequestSchema = z
  .object({
    sessionId: sessionIdSchema,
    message: z.string().trim().min(3).max(MAX_MESSAGE_LENGTH),
    syntheticDataConfirmed: z.literal(true),
  })
  .strict();

export const storeMemoryInputSchema = z
  .object({
    sessionId: sessionIdSchema,
    memoryKey: memoryKeySchema,
    content: z.string().trim().min(8).max(500),
    category: categorySchema,
  })
  .strict();

export const retrieveMemoriesInputSchema = z
  .object({
    sessionId: sessionIdSchema,
    query: z.string().trim().min(3).max(500),
    limit: z.number().int().min(1).max(3),
  })
  .strict();

export const activityEventSchema = z
  .object({
    type: z.enum([
      "tool_requested",
      "input_validated",
      "embedding_created",
      "memory_stored",
      "vector_retrieval",
      "final_response",
    ]),
    label: z.string().max(120),
    memoryKeys: z.array(memoryKeySchema).max(3).optional(),
    dimensions: z.literal(1024).optional(),
  })
  .strict();

export const agentResponseSchema = z
  .object({
    answer: z.string().max(1800),
    events: z.array(activityEventSchema).max(12),
    memoryKeys: z.array(memoryKeySchema).max(3),
    requestId: z.string().uuid(),
  })
  .strict();

export type AgentRequest = z.infer<typeof agentRequestSchema>;
export type AgentResponse = z.infer<typeof agentResponseSchema>;
export type ActivityEvent = z.infer<typeof activityEventSchema>;
export type StoreMemoryInput = z.infer<typeof storeMemoryInputSchema>;
export type RetrieveMemoriesInput = z.infer<typeof retrieveMemoriesInputSchema>;
