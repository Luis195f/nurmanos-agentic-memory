import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { App } from "../src/frontend/App";

describe("public demo UI", () => {
  beforeEach(() => window.localStorage.clear());

  it("makes the synthetic boundary, persistence story, and curated journeys visible", () => {
    render(<App />);
    expect(screen.getByText("Synthetic demo data only")).toBeVisible();
    expect(screen.getByText("CockroachDB")).toBeVisible();
    expect(screen.getByText("Bedrock Nova")).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Remember a handover lesson" }),
    ).toBeEnabled();
    expect(
      screen.getByRole("button", { name: "Recall the handover lesson" }),
    ).toBeEnabled();
  });

  it("starts a new conversation without rotating the persistent anonymous session", () => {
    render(<App />);
    const before = window.localStorage.getItem("nurmanos-h1-anonymous-session");
    fireEvent.click(screen.getByRole("button", { name: "New conversation" }));
    expect(window.localStorage.getItem("nurmanos-h1-anonymous-session")).toBe(
      before,
    );
  });
});
