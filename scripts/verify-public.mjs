import { randomUUID } from "node:crypto";

const apiBaseUrl = process.env.H1_API_BASE_URL;
if (!apiBaseUrl || !apiBaseUrl.startsWith("https://")) {
  throw new Error("Set H1_API_BASE_URL to the deployed HTTPS API origin");
}

const sessionId = randomUUID();
const memoryKey = `handover-proof-${Date.now()}`;

async function agent(message) {
  const response = await fetch(`${apiBaseUrl}/api/agent`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: process.env.H1_FRONTEND_ORIGIN ?? "",
    },
    body: JSON.stringify({ sessionId, message, syntheticDataConfirmed: true }),
  });
  const body = await response.json();
  if (!response.ok)
    throw new Error(`Agent request failed with HTTP ${response.status}`);
  return body;
}

const healthResponse = await fetch(`${apiBaseUrl}/api/health`);
if (!healthResponse.ok)
  throw new Error(`Health request failed with HTTP ${healthResponse.status}`);

const stored = await agent(
  `Remember this synthetic Aurora Demo Unit lesson: protect a ten-minute interruption-free handover period. Use memory key ${memoryKey} and category handover.`,
);
if (!stored.memoryKeys?.includes(memoryKey))
  throw new Error("Store journey did not return the memory key");
if (!stored.events?.some((event) => event.type === "memory_stored")) {
  throw new Error("Store journey did not report a sanitized memory event");
}

const retrieved = await agent(
  "What did Aurora Demo Unit learn about protecting handover time?",
);
if (!retrieved.memoryKeys?.includes(memoryKey)) {
  throw new Error("Retrieval journey did not rank the stored memory");
}
if (!retrieved.events?.some((event) => event.type === "vector_retrieval")) {
  throw new Error("Retrieval journey did not report vector retrieval");
}

console.log(
  JSON.stringify(
    {
      health: healthResponse.status,
      store: {
        requestId: stored.requestId,
        memoryKey,
        eventTypes: stored.events.map((event) => event.type),
      },
      retrieve: {
        requestId: retrieved.requestId,
        memoryKeys: retrieved.memoryKeys,
        eventTypes: retrieved.events.map((event) => event.type),
      },
      sessionNamespace: "generated for this test; value withheld",
    },
    null,
    2,
  ),
);
