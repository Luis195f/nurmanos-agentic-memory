import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("H1 migration", () => {
  const sql = readFileSync(resolve("infra/sql/001_h1_memory.sql"), "utf8");

  it("defines the isolated 1,024-dimensional vector memory schema", () => {
    expect(sql).toContain("h1_supervisor_memories");
    expect(sql).toContain("VECTOR(1024)");
    expect(sql).toContain("UNIQUE (session_id, memory_key)");
    expect(sql).toContain("CREATE VECTOR INDEX");
    expect(sql).not.toContain("h0_agent_memories (");
  });
});
