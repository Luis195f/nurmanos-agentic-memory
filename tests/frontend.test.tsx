import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { App } from "../src/frontend/App";

describe("free local demo UI", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it("discloses the local-only boundary and never makes a network request", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    render(<App appMode="local-demo" />);

    expect(
      screen.getByText(
        "Modo demo local — los datos permanecen únicamente en este navegador. AWS y CockroachDB están desactivados.",
      ),
    ).toBeVisible();
    expect(
      screen.getByRole("button", {
        name: "Recordar una lección de hidratación",
      }),
    ).toBeEnabled();
    await waitFor(() =>
      expect(screen.getByText("Demo local activa")).toBeVisible(),
    );
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("persists a lesson across a fresh conversation and retrieves it locally", async () => {
    render(<App appMode="local-demo" />);

    fireEvent.click(
      screen.getByRole("button", {
        name: "Recordar una lección de hidratación",
      }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Enviar" }));
    expect(
      await screen.findByText(/He guardado la lección sintética/),
    ).toBeVisible();

    const before = window.localStorage.getItem("nurmanos-h1-anonymous-session");
    fireEvent.click(screen.getByRole("button", { name: "Nueva conversación" }));
    expect(window.localStorage.getItem("nurmanos-h1-anonymous-session")).toBe(
      before,
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Preguntar por hidratación" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Enviar" }));

    expect(
      await screen.findByText(/La memoria local más relevante indica:/),
    ).toBeVisible();
    expect(screen.getAllByText("hydration-transition").length).toBeGreaterThan(
      0,
    );
  });

  it("restores local examples without rotating the anonymous workspace", async () => {
    render(<App appMode="local-demo" />);
    const before = window.localStorage.getItem("nurmanos-h1-anonymous-session");

    fireEvent.click(screen.getByRole("button", { name: "Restaurar ejemplos" }));

    expect(
      await screen.findByText("Ejemplos sintéticos locales restaurados."),
    ).toBeVisible();
    expect(window.localStorage.getItem("nurmanos-h1-anonymous-session")).toBe(
      before,
    );
  });

  it("switches the complete product shell to English", () => {
    render(<App appMode="local-demo" />);
    fireEvent.click(screen.getByRole("button", { name: "Switch to English" }));
    expect(
      screen.getByRole("heading", {
        name: "Turn operational lessons into shared memory.",
      }),
    ).toBeVisible();
    expect(screen.getByText("Synthetic demo data only")).toBeVisible();
    expect(
      screen.getByRole("button", { name: "New conversation" }),
    ).toBeEnabled();
  });
});
