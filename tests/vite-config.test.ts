import { describe, expect, it } from "vitest";

import { apiOriginFromBaseUrl } from "../src/shared/csp";

describe("frontend API CSP configuration", () => {
  it("uses only the API origin as the CSP connect source", () => {
    expect(
      apiOriginFromBaseUrl(
        "https://example.execute-api.eu-west-1.amazonaws.com/v1",
      ),
    ).toBe("https://example.execute-api.eu-west-1.amazonaws.com");
  });

  it("allows an unconfigured local build and rejects non-HTTP protocols", () => {
    expect(apiOriginFromBaseUrl(undefined)).toBe("");
    expect(() => apiOriginFromBaseUrl("javascript:alert(1)")).toThrow(
      "must use HTTP or HTTPS",
    );
  });
});
