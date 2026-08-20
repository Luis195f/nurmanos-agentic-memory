import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("H1 migration", () => {
  const sql = readFileSync(resolve("infra/sql/001_h1_memory.sql"), "utf8");
  const hardeningSql = readFileSync(
    resolve("infra/sql/003_h1_require_synthetic_metadata.sql"),
    "utf8",
  );

  it("defines the isolated 1,024-dimensional vector memory schema", () => {
    expect(sql).toContain("h1_supervisor_memories");
    expect(sql).toContain("VECTOR(1024)");
    expect(sql).toContain("UNIQUE (session_id, memory_key)");
    expect(sql).toContain("CREATE VECTOR INDEX");
    expect(sql).toContain("IS TRUE");
    expect(sql).not.toContain("h0_agent_memories (");
  });

  it("hardens existing H1 tables without an enforcement gap", () => {
    expect(hardeningSql).toContain("ADD CONSTRAINT h1_synthetic_required");
    expect(hardeningSql).toContain("IS TRUE");
    expect(hardeningSql.indexOf("ADD CONSTRAINT")).toBeLessThan(
      hardeningSql.indexOf("DROP CONSTRAINT"),
    );
  });
});
