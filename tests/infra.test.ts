import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("AWS infrastructure boundaries", () => {
  const template = readFileSync(resolve("infra/template.yaml"), "utf8");

  it("keeps runtime IAM resources explicitly scoped", () => {
    expect(template).toContain("ReadOnlyH1DatabaseSecret");
    expect(template).toContain("InvokeOnlyRequiredModels");
    expect(template).not.toMatch(/^\s+Resource:\s+["']?\*["']?\s*$/m);
  });

  it("bounds capacity and retains sanitized logs", () => {
    expect(template).toContain("ReservedConcurrentExecutions: 2");
    expect(template).toContain("ThrottlingBurstLimit: 3");
    expect(template).toContain("RetentionInDays: 7");
    expect(template).toContain("ApiAccessLogGroup");
    expect(template).not.toContain("$context.identity.sourceIp");
  });

  it("defines health alarms without embedding a notification destination", () => {
    expect(template).toContain("AgentErrorsAlarm");
    expect(template).toContain("AgentThrottlesAlarm");
    expect(template).toContain("AgentDurationAlarm");
    expect(template).toContain("ApiServerErrorsAlarm");
    expect(template).not.toContain("AlarmActions:");
  });
});
