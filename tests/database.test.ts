import { describe, expect, it, vi } from "vitest";

import { CockroachMemoryDatabase } from "../src/lambda/database";

const sessionId = "00000000-0000-4000-8000-000000000301";
const vector = Array.from({ length: 1024 }, () => 0.01);

describe("CockroachDB memory adapter", () => {
  it("uses a transactional namespace-scoped idempotent upsert and read-back", async () => {
    const query = vi
      .fn()
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({
        rows: [
          {
            memory_key: "handover-focus",
            category: "handover",
            content: "Protect the fictional handover period.",
            inserted: false,
          },
        ],
      })
      .mockResolvedValueOnce({ rows: [{ memory_key: "handover-focus" }] })
      .mockResolvedValueOnce({ rows: [] });
    const release = vi.fn();
    const pool = { connect: vi.fn().mockResolvedValue({ query, release }) };
    const database = new CockroachMemoryDatabase(async () => pool as never);

    const result = await database.store(
      {
        sessionId,
        memoryKey: "handover-focus",
        content: "Protect the fictional handover period.",
        category: "handover",
      },
      vector,
    );

    expect(result.outcome).toBe("updated");
    expect(query.mock.calls[1]?.[0]).toContain(
      "ON CONFLICT (session_id, memory_key) DO UPDATE",
    );
    expect(query.mock.calls[1]?.[1]?.[0]).toBe(sessionId);
    expect(query.mock.calls[1]?.[1]?.[5]).toContain('"synthetic":true');
    expect(query.mock.calls[2]?.[0]).toContain(
      "WHERE session_id = $1::UUID AND memory_key = $2",
    );
    expect(query.mock.calls.map((call) => call[0])).toEqual([
      "BEGIN",
      expect.stringContaining("INSERT INTO"),
      expect.stringContaining("SELECT memory_key"),
      "COMMIT",
    ]);
    expect(release).toHaveBeenCalledOnce();
  });

  it("binds retrieval to the caller namespace and clamps similarity", async () => {
    const query = vi.fn().mockResolvedValue({
      rows: [
        {
          memory_key: "handover-focus",
          category: "handover",
          content: "Protect the fictional handover period.",
          distance: "0.1234",
        },
      ],
    });
    const database = new CockroachMemoryDatabase(
      async () => ({ query }) as never,
    );
    const result = await database.retrieve(
      { sessionId, query: "What did we learn?", limit: 1 },
      vector,
    );

    expect(query.mock.calls[0]?.[0]).toContain("WHERE session_id = $1::UUID");
    expect(query.mock.calls[0]?.[1]?.[0]).toBe(sessionId);
    expect(query.mock.calls[0]?.[1]?.[2]).toBe(1);
    expect(result[0]?.similarity).toBe(0.877);
  });

  it("rejects malformed embeddings before executing SQL", async () => {
    const query = vi.fn();
    const database = new CockroachMemoryDatabase(
      async () => ({ query }) as never,
    );
    await expect(
      database.retrieve({ sessionId, query: "What did we learn?", limit: 1 }, [
        Number.NaN,
      ]),
    ).rejects.toThrow("Invalid embedding");
    expect(query).not.toHaveBeenCalled();
  });
});
