import { z } from "zod";

import {
  agentRequestSchema,
  agentResponseSchema,
  categorySchema,
  type ActivityEvent,
  type AgentRequest,
  type AgentResponse,
} from "../shared/contracts";
import { containsLikelyPersonalData } from "../shared/privacy";

export type AppMode = "local-demo" | "aws" | "disabled";
export type ServiceHealth = "local" | "online" | "offline";

export interface MemoryClient {
  readonly mode: AppMode;
  checkHealth(signal?: AbortSignal): Promise<ServiceHealth>;
  submit(request: AgentRequest): Promise<AgentResponse>;
  resetDemo?(sessionId: string): void;
}

const LOCAL_STORAGE_KEY = "nurmanos-local-demo-memory-v1";
const LOCAL_STORAGE_VERSION = 1 as const;

const localMemorySchema = z
  .object({
    memoryKey: z
      .string()
      .min(3)
      .max(64)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    content: z.string().trim().min(8).max(500),
    category: categorySchema,
  })
  .strict();

const localStateSchema = z
  .object({
    version: z.literal(LOCAL_STORAGE_VERSION),
    workspaces: z.record(
      z.string().uuid(),
      z.array(localMemorySchema).max(100),
    ),
  })
  .strict();

type LocalMemory = z.infer<typeof localMemorySchema>;
type LocalState = z.infer<typeof localStateSchema>;

const SEED_MEMORIES: readonly LocalMemory[] = [
  {
    memoryKey: "handover-focus",
    category: "handover",
    content:
      "En Aurora Demo Unit, reservar diez minutos sin interrupciones hizo más claro el relevo sintético.",
  },
  {
    memoryKey: "equipment-check",
    category: "equipment-readiness",
    content:
      "En Aurora Demo Unit, comprobar el material ficticio antes de la actividad evitó pausas innecesarias.",
  },
];

const STORE_INTENT = /^(?:remember|recuerda|guardar|guarda)\b/i;
const MEMORY_KEY =
  /(?:memory\s+key|clave(?:\s+de\s+memoria)?)\s+([a-z0-9]+(?:-[a-z0-9]+)*)/i;
const CATEGORY = /(?:category|categor[ií]a)\s+([a-z]+(?:-[a-z]+)*)/i;
const TRAILING_METADATA =
  /\s*(?:use|usa)\s+(?:(?:the|la)\s+)?(?:memory\s+key|clave)[\s\S]*$/i;
const LEADING_STORE =
  /^(?:remember|recuerda|guardar|guarda)(?:\s+(?:this|esta|la))?(?:\s+(?:synthetic|sint[eé]tica))?(?:\s+(?:aurora demo unit))?(?:\s+(?:lesson|lecci[oó]n))?\s*:?\s*/i;

const STOP_WORDS = new Set([
  "a",
  "about",
  "al",
  "and",
  "aprendimos",
  "de",
  "did",
  "during",
  "el",
  "en",
  "la",
  "las",
  "lo",
  "los",
  "of",
  "por",
  "que",
  "sobre",
  "the",
  "what",
  "we",
  "y",
]);

function cloneSeeds(): LocalMemory[] {
  return SEED_MEMORIES.map((memory) => ({ ...memory }));
}

function emptyState(): LocalState {
  return { version: LOCAL_STORAGE_VERSION, workspaces: {} };
}

function readState(storage: Storage): LocalState {
  const raw = storage.getItem(LOCAL_STORAGE_KEY);
  if (!raw) return emptyState();
  try {
    return localStateSchema.parse(JSON.parse(raw) as unknown);
  } catch {
    return emptyState();
  }
}

function writeState(storage: Storage, state: LocalState): void {
  storage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
}

function workspaceMemories(
  state: LocalState,
  sessionId: string,
): LocalMemory[] {
  const existing = state.workspaces[sessionId];
  if (existing) return existing;
  const seeded = cloneSeeds();
  state.workspaces[sessionId] = seeded;
  return seeded;
}

function normalizeTokens(value: string): Set<string> {
  const tokens = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .match(/[a-z0-9]+/g);
  return new Set(
    (tokens ?? []).filter(
      (token) => token.length > 1 && !STOP_WORDS.has(token),
    ),
  );
}

function textualScore(query: string, memory: LocalMemory): number {
  const queryTokens = normalizeTokens(query);
  const memoryTokens = normalizeTokens(
    `${memory.memoryKey} ${memory.category} ${memory.content}`,
  );
  if (queryTokens.size === 0 || memoryTokens.size === 0) return 0;
  let overlap = 0;
  queryTokens.forEach((token) => {
    if (memoryTokens.has(token)) overlap += 1;
  });
  return overlap / Math.sqrt(queryTokens.size * memoryTokens.size);
}

function event(
  type: ActivityEvent["type"],
  label: string,
  details: Omit<ActivityEvent, "type" | "label"> = {},
): ActivityEvent {
  return { type, label, ...details };
}

function requestId(): string {
  return globalThis.crypto.randomUUID();
}

function isSpanish(message: string): boolean {
  return /[¿¡áéíóúñ]|\b(?:aprendimos|recuerda|sobre|qué|usa)\b/i.test(message);
}

function parseStore(message: string): LocalMemory {
  const memoryKey = MEMORY_KEY.exec(message)?.[1]?.toLowerCase();
  const category = CATEGORY.exec(message)?.[1]?.toLowerCase();
  const withoutMetadata = message.replace(TRAILING_METADATA, "").trim();
  const colonIndex = withoutMetadata.indexOf(":");
  const content = (
    colonIndex >= 0
      ? withoutMetadata.slice(colonIndex + 1)
      : withoutMetadata.replace(LEADING_STORE, "")
  )
    .trim()
    .replace(/[.!?]+$/, "");
  return localMemorySchema.parse({ memoryKey, category, content });
}

export function createLocalDemoClient(
  storage: Storage = window.localStorage,
): MemoryClient {
  return {
    mode: "local-demo",
    async checkHealth() {
      return "local";
    },
    async submit(request) {
      const started = performance.now();
      const input = agentRequestSchema.parse(request);
      if (containsLikelyPersonalData(input.message)) {
        throw new Error(
          isSpanish(input.message)
            ? "Usa únicamente información ficticia: se detectó un posible dato personal o identificador real."
            : "Use fictional information only: a possible personal detail or real identifier was detected.",
        );
      }

      const state = readState(storage);
      const memories = workspaceMemories(state, input.sessionId);
      const spanish = isSpanish(input.message);

      if (STORE_INTENT.test(input.message)) {
        let memory: LocalMemory;
        try {
          memory = parseStore(input.message);
        } catch {
          throw new Error(
            spanish
              ? "Incluye una clave válida y una categoría permitida en el ejemplo sintético."
              : "Include a valid memory key and allowed category in the synthetic example.",
          );
        }
        const existingIndex = memories.findIndex(
          (item) => item.memoryKey === memory.memoryKey,
        );
        const outcome = existingIndex >= 0 ? "updated" : "stored";
        if (existingIndex >= 0) memories[existingIndex] = memory;
        else memories.push(memory);
        writeState(storage, state);
        const durationMs = Math.max(1, Math.round(performance.now() - started));
        return agentResponseSchema.parse({
          answer: spanish
            ? `He ${outcome === "stored" ? "guardado" : "actualizado"} la lección sintética con la clave ${memory.memoryKey}.`
            : `I ${outcome === "stored" ? "stored" : "updated"} the synthetic lesson with key ${memory.memoryKey}.`,
          events: [
            event(
              "tool_requested",
              "A deterministic local rule selected storage",
              {
                operation: "store",
              },
            ),
            event("input_validated", "Synthetic local input passed validation"),
            event(
              "memory_stored",
              "Browser storage committed the local memory",
              {
                operation: "store",
                outcome,
                memoryKeys: [memory.memoryKey],
                categories: [memory.category],
                durationMs,
              },
            ),
            event(
              "final_response",
              "The local demo returned a grounded response",
            ),
          ],
          memoryKeys: [memory.memoryKey],
          requestId: requestId(),
          durationMs,
        });
      }

      writeState(storage, state);
      const matches = memories
        .map((memory) => ({
          memory,
          score: textualScore(input.message, memory),
        }))
        .filter(({ score }) => score > 0)
        .sort(
          (left, right) =>
            right.score - left.score ||
            left.memory.memoryKey.localeCompare(right.memory.memoryKey),
        )
        .slice(0, 3);
      const durationMs = Math.max(1, Math.round(performance.now() - started));
      const answer =
        matches.length === 0
          ? spanish
            ? "No encontré una memoria local coincidente. Prueba a guardar primero una lección sintética con una clave y categoría."
            : "I found no matching local memory. Store a synthetic lesson with a key and category first."
          : spanish
            ? `La memoria local más relevante indica: ${matches.map(({ memory }) => memory.content).join(" ")}`
            : `The most relevant local memory says: ${matches.map(({ memory }) => memory.content).join(" ")}`;
      return agentResponseSchema.parse({
        answer,
        events: [
          event(
            "tool_requested",
            "A deterministic local rule selected retrieval",
            {
              operation: "retrieve",
            },
          ),
          event("input_validated", "Synthetic local input passed validation"),
          event(
            "local_text_retrieval",
            "Browser memories were ranked by textual overlap",
            {
              operation: "retrieve",
              outcome: "retrieved",
              memoryKeys: matches.map(({ memory }) => memory.memoryKey),
              categories: matches.map(({ memory }) => memory.category),
              similarities: matches.map(({ score }) => score),
              resultCount: matches.length,
              durationMs,
            },
          ),
          event(
            "final_response",
            "The local demo returned a grounded response",
          ),
        ],
        memoryKeys: matches.map(({ memory }) => memory.memoryKey),
        requestId: requestId(),
        durationMs,
      });
    },
    resetDemo(sessionId) {
      const state = readState(storage);
      state.workspaces[sessionId] = cloneSeeds();
      writeState(storage, state);
    },
  };
}

function createAwsClient(apiBaseUrl: string): MemoryClient {
  const baseUrl = apiBaseUrl.replace(/\/$/, "");
  return {
    mode: "aws",
    async checkHealth(signal) {
      try {
        const response = await fetch(`${baseUrl}/api/health`, {
          signal,
          headers: { accept: "application/json" },
        });
        return response.ok ? "online" : "offline";
      } catch {
        return "offline";
      }
    },
    async submit(request) {
      const response = await fetch(`${baseUrl}/api/agent`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(request),
      });
      const payload: unknown = await response.json();
      if (!response.ok) {
        const message =
          typeof payload === "object" && payload !== null && "error" in payload
            ? String(payload.error)
            : "The synthetic memory request could not be completed.";
        throw new Error(message);
      }
      return agentResponseSchema.parse(payload);
    },
  };
}

function createDisabledClient(): MemoryClient {
  return {
    mode: "disabled",
    async checkHealth() {
      return "offline";
    },
    async submit() {
      throw new Error("No memory mode is configured.");
    },
  };
}

export function createMemoryClient(
  mode: AppMode,
  apiBaseUrl?: string,
  storage?: Storage,
): MemoryClient {
  if (mode === "local-demo") return createLocalDemoClient(storage);
  if (mode === "aws" && apiBaseUrl) return createAwsClient(apiBaseUrl);
  return createDisabledClient();
}

export const localDemoStorageKey = LOCAL_STORAGE_KEY;
export const localDemoSeeds = SEED_MEMORIES;
