import type { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { createHash, randomUUID } from "node:crypto";
import { ZodError } from "zod";

import {
  agentRequestSchema,
  MAX_AGENT_DURATION_MS,
  MAX_BODY_BYTES,
} from "../shared/contracts";
import { containsLikelyPersonalData } from "../shared/privacy";
import { runAgent } from "./agent";
import { AwsBedrockGateway } from "./bedrock";
import { CockroachMemoryDatabase } from "./database";

const allowedOrigin = process.env.ALLOWED_ORIGIN;
const bedrock = new AwsBedrockGateway();
const database = new CockroachMemoryDatabase();

async function withAgentDeadline<T>(operation: Promise<T>): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      operation,
      new Promise<never>((_, reject) => {
        timeout = setTimeout(
          () => reject(new Error("Agent execution deadline exceeded")),
          MAX_AGENT_DURATION_MS,
        );
      }),
    ]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

function response(statusCode: number, body: unknown) {
  return {
    statusCode,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
      "content-security-policy": "default-src 'none'; frame-ancestors 'none'",
      "referrer-policy": "no-referrer",
      "permissions-policy": "camera=(), microphone=(), geolocation=()",
      "x-frame-options": "DENY",
    },
    body: JSON.stringify(body),
  };
}

function opaqueKeyHash(value: string): string {
  return createHash("sha256").update(value).digest("hex").slice(0, 12);
}

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  const requestId = randomUUID();
  const method = event.requestContext.http.method;
  const path = event.rawPath;

  if (method === "GET" && path === "/api/health") {
    return response(200, {
      status: "ok",
      service: "nurmanos-agentic-memory",
      region: process.env.AWS_REGION ?? "eu-west-1",
      syntheticOnly: true,
    });
  }

  if (method !== "POST" || path !== "/api/agent") {
    return response(404, { error: "Not found", requestId });
  }

  if (!allowedOrigin || event.headers.origin !== allowedOrigin) {
    return response(403, { error: "Request origin is not allowed", requestId });
  }

  try {
    const startedAt = performance.now();
    const declaredLength = Number(event.headers["content-length"] ?? 0);
    if (declaredLength > MAX_BODY_BYTES || !event.body) {
      return response(413, {
        error: "Request body is invalid or too large",
        requestId,
      });
    }
    const decodedBody = event.isBase64Encoded
      ? Buffer.from(event.body, "base64").toString("utf8")
      : event.body;
    if (Buffer.byteLength(decodedBody, "utf8") > MAX_BODY_BYTES) {
      return response(413, {
        error: "Request body is invalid or too large",
        requestId,
      });
    }
    const request = agentRequestSchema.parse(JSON.parse(decodedBody));
    if (containsLikelyPersonalData(request.message)) {
      return response(422, {
        error:
          "Use fictional synthetic workflow data only; remove likely personal identifiers",
        requestId,
      });
    }
    console.info(
      JSON.stringify({
        event: "agent_request_started",
        requestId,
        payloadBytes: Buffer.byteLength(decodedBody, "utf8"),
      }),
    );
    const result = await withAgentDeadline(
      runAgent(request, requestId, bedrock, database),
    );
    console.info(
      JSON.stringify({
        event: "agent_request_completed",
        requestId,
        activityCount: result.events.length,
        memoryKeyCount: result.memoryKeys.length,
        durationMs: Math.round(performance.now() - startedAt),
        operations: result.events
          .filter((item) => item.outcome)
          .map((item) => ({
            operation: item.operation,
            outcome: item.outcome,
            resultCount: item.resultCount,
            durationMs: item.durationMs,
            categories: item.categories,
            memoryKeyHashes: item.memoryKeys?.map(opaqueKeyHash),
          })),
      }),
    );
    return response(200, result);
  } catch (error) {
    const reason =
      error instanceof ZodError || error instanceof SyntaxError
        ? "validation"
        : "runtime";
    console.error(
      JSON.stringify({ event: "agent_request_failed", requestId, reason }),
    );
    return response(reason === "validation" ? 400 : 500, {
      error:
        reason === "validation"
          ? "Request or tool input failed validation"
          : "The synthetic memory service could not complete the request",
      requestId,
    });
  }
};
