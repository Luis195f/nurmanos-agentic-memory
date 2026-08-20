import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  createLocalDemoClient,
  localDemoStorageKey,
  localDemoSeeds,
} from "../src/frontend/memory-client";

const WORKSPACE_A = "11111111-1111-4111-8111-111111111111";
const WORKSPACE_B = "22222222-2222-4222-8222-222222222222";

function request(sessionId: string, message: string) {
  return { sessionId, message, syntheticDataConfirmed: true as const };
}

const HYDRATION =
  "Recuerda esta lección sintética: una botella de hidratación azul mejoró la transición. Usa la clave hydration-transition y la categoría learning-review.";

describe("browser-only local memory client", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it("stores and retrieves without fetch, AWS, Bedrock, or CockroachDB", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const client = createLocalDemoClient();

    await client.submit(request(WORKSPACE_A, HYDRATION));
    const result = await client.submit(
      request(WORKSPACE_A, "¿Qué aprendimos sobre la hidratación azul?"),
    );

    expect(result.memoryKeys).toContain("hydration-transition");
    expect(result.answer).toContain("botella de hidratación azul");
    expect(result.answer).not.toContain("categoría learning-review");
    expect(
      result.events.some((event) => event.type === "local_text_retrieval"),
    ).toBe(true);
    expect(JSON.stringify(result)).not.toMatch(/AWS|Bedrock|CockroachDB/i);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("survives a client reload because the validated state remains in localStorage", async () => {
    await createLocalDemoClient().submit(request(WORKSPACE_A, HYDRATION));

    const reloadedClient = createLocalDemoClient();
    const result = await reloadedClient.submit(
      request(WORKSPACE_A, "Recupera la hidratación azul"),
    );

    expect(result.memoryKeys).toContain("hydration-transition");
  });

  it("upserts idempotently by memory key", async () => {
    const client = createLocalDemoClient();
    await client.submit(request(WORKSPACE_A, HYDRATION));
    const updated = await client.submit(
      request(
        WORKSPACE_A,
        "Recuerda esta lección sintética: una cantimplora verde mejoró la transición. Usa la clave hydration-transition y la categoría learning-review.",
      ),
    );

    expect(updated.events.find((event) => event.outcome)?.outcome).toBe(
      "updated",
    );
    const state = JSON.parse(
      window.localStorage.getItem(localDemoStorageKey) ?? "{}",
    ) as {
      workspaces: Record<string, Array<{ memoryKey: string }>>;
    };
    expect(
      state.workspaces[WORKSPACE_A]?.filter(
        (memory) => memory.memoryKey === "hydration-transition",
      ),
    ).toHaveLength(1);
    const retrieved = await client.submit(
      request(WORKSPACE_A, "¿Qué sabemos de la cantimplora verde?"),
    );
    expect(retrieved.answer).toContain("cantimplora verde");
  });

  it("isolates custom memories by anonymous workspace", async () => {
    const client = createLocalDemoClient();
    await client.submit(request(WORKSPACE_A, HYDRATION));

    const otherWorkspace = await client.submit(
      request(WORKSPACE_B, "¿Qué sabemos de la hidratación azul?"),
    );

    expect(otherWorkspace.memoryKeys).not.toContain("hydration-transition");
  });

  it("resets only the selected workspace and restores synthetic seeds", async () => {
    const client = createLocalDemoClient();
    await client.submit(request(WORKSPACE_A, HYDRATION));
    await client.submit(request(WORKSPACE_B, HYDRATION));

    client.resetDemo?.(WORKSPACE_A);

    const resetResult = await client.submit(
      request(WORKSPACE_A, "¿Qué sabemos de la hidratación azul?"),
    );
    const preservedResult = await client.submit(
      request(WORKSPACE_B, "¿Qué sabemos de la hidratación azul?"),
    );
    const seedResult = await client.submit(
      request(WORKSPACE_A, "¿Qué aprendimos del relevo sin interrupciones?"),
    );
    expect(resetResult.memoryKeys).not.toContain("hydration-transition");
    expect(preservedResult.memoryKeys).toContain("hydration-transition");
    expect(seedResult.memoryKeys).toContain(localDemoSeeds[0]?.memoryKey);
  });

  it("rejects likely personal data before writing it", async () => {
    const client = createLocalDemoClient();
    await expect(
      client.submit(
        request(
          WORKSPACE_A,
          "Recuerda el correo real nombre@example.com con clave contact-real y categoría handover.",
        ),
      ),
    ).rejects.toThrow(/dato personal/i);
    expect(window.localStorage.getItem(localDemoStorageKey)).toBeNull();
  });
});
