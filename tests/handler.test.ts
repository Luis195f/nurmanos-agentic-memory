import { randomUUID } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const runAgentMock = vi.fn();

vi.mock("../src/lambda/agent", () => ({ runAgent: runAgentMock }));

function event(
  method: "GET" | "POST",
  path: string,
  body?: unknown,
  origin = "https://demo.example",
) {
  const serialized = body === undefined ? undefined : JSON.stringify(body);
  return {
    version: "2.0",
    routeKey: "$default",
    rawPath: path,
    rawQueryString: "",
    headers: {
      origin,
      ...(serialized
        ? { "content-length": String(Buffer.byteLength(serialized)) }
        : {}),
    },
    requestContext: {
      accountId: "anonymous",
      apiId: "local",
      domainName: "demo.example",
      domainPrefix: "demo",
      http: {
        method,
        path,
        protocol: "HTTP/1.1",
        sourceIp: "192.0.2.1",
        userAgent: "vitest",
      },
      requestId: randomUUID(),
      routeKey: "$default",
      stage: "$default",
      time: "20/Aug/2026:00:00:00 +0000",
      timeEpoch: 0,
    },
    isBase64Encoded: false,
    body: serialized,
  };
}

async function loadHandler() {
  vi.stubEnv("ALLOWED_ORIGIN", "https://demo.example");
  vi.resetModules();
  return (await import("../src/lambda/handler")).handler;
}

async function invoke(
  handler: Awaited<ReturnType<typeof loadHandler>>,
  request: ReturnType<typeof event>,
) {
  const result = await handler(request as never, {} as never, () => undefined);
  if (!result || typeof result === "string") {
    throw new Error("Expected a structured API Gateway response");
  }
  return result;
}

describe("public Lambda handler", () => {
  beforeEach(() => {
    runAgentMock.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns a secret-free health response without loading runtime secrets", async () => {
    const handler = await loadHandler();
    const response = await invoke(handler, event("GET", "/api/health"));
    expect(response?.statusCode).toBe(200);
    expect(response?.headers).toMatchObject({
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
      "x-frame-options": "DENY",
    });
    expect(response?.body).not.toContain("secret");
    expect(runAgentMock).not.toHaveBeenCalled();
  });

  it("enforces the exact frontend origin before processing a request", async () => {
    const handler = await loadHandler();
    const response = await invoke(
      handler,
      event(
        "POST",
        "/api/agent",
        {
          sessionId: randomUUID(),
          message: "Remember this synthetic lesson.",
          syntheticDataConfirmed: true,
        },
        "https://attacker.example",
      ),
    );
    expect(response?.statusCode).toBe(403);
    expect(runAgentMock).not.toHaveBeenCalled();
  });

  it("rejects likely personal data with a sanitized error", async () => {
    const handler = await loadHandler();
    const response = await invoke(
      handler,
      event("POST", "/api/agent", {
        sessionId: randomUUID(),
        message: "Email a real patient at person@example.com",
        syntheticDataConfirmed: true,
      }),
    );
    expect(response?.statusCode).toBe(422);
    expect(response?.body).toContain("fictional synthetic workflow data only");
    expect(response?.body).not.toContain("person@example.com");
  });

  it("does not expose runtime exception details", async () => {
    runAgentMock.mockRejectedValueOnce(
      new Error("database failure at private-host with credential detail"),
    );
    const handler = await loadHandler();
    const response = await invoke(
      handler,
      event("POST", "/api/agent", {
        sessionId: randomUUID(),
        message: "Recall the synthetic hydration lesson.",
        syntheticDataConfirmed: true,
      }),
    );
    expect(response?.statusCode).toBe(500);
    expect(response?.body).not.toContain("private-host");
    expect(response?.body).not.toContain("credential detail");
  });

  it("ends a stalled agent request at the bounded runtime deadline", async () => {
    vi.useFakeTimers();
    runAgentMock.mockReturnValueOnce(new Promise(() => undefined));
    const handler = await loadHandler();
    const responsePromise = invoke(
      handler,
      event("POST", "/api/agent", {
        sessionId: randomUUID(),
        message: "Recall the synthetic handover lesson.",
        syntheticDataConfirmed: true,
      }),
    );
    await vi.advanceTimersByTimeAsync(24_000);
    const response = await responsePromise;
    expect(response.statusCode).toBe(500);
    expect(response.body).not.toContain("deadline");
  });
});
