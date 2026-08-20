import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { App } from "../src/frontend/App";

describe("public demo UI", () => {
  beforeEach(() => window.localStorage.clear());

  it("makes the synthetic boundary, persistence story, and curated journeys visible", () => {
    render(<App />);
    expect(screen.getByText("Synthetic demo data only")).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Remember a hydration lesson" }),
    ).toBeEnabled();
    expect(
      screen.getByRole("button", { name: "Ask about hydration" }),
    ).toBeEnabled();
    expect(screen.getByText("Show technical evidence")).toBeVisible();
  });

  it("starts a new conversation without rotating the persistent anonymous session", () => {
    render(<App />);
    const before = window.localStorage.getItem("nurmanos-h1-anonymous-session");
    fireEvent.click(screen.getByRole("button", { name: "New conversation" }));
    expect(window.localStorage.getItem("nurmanos-h1-anonymous-session")).toBe(
      before,
    );
  });

  it("switches the complete product shell to Spanish", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Cambiar a español" }));
    expect(
      screen.getByRole("heading", {
        name: "Convierte las lecciones operativas en memoria compartida.",
      }),
    ).toBeVisible();
    expect(
      screen.getByText("Solo datos sintéticos de demostración"),
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Nueva conversación" }),
    ).toBeEnabled();
  });
});
