import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Home from "./page";
import AppShell from "@/components/AppShell";

describe("Home page", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders the shell content and a pending health state, then success", async () => {
    let resolve!: (v: Response) => void;
    const pending = new Promise<Response>((r) => {
      resolve = r;
    });
    vi.stubGlobal(
      "fetch",
      vi.fn(() => pending),
    );

    render(<Home />);

    expect(
      screen.getByRole("heading", { level: 1, name: /welcome to agentclinic/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/checking the api/i)).toBeInTheDocument();

    resolve(
      new Response(JSON.stringify({ status: "ok" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    expect(await screen.findByText(/API: ok/i)).toBeInTheDocument();
  });

  it("shows a clear error state when the API is unreachable", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.reject(new Error("Failed to fetch"))),
    );

    render(<Home />);

    await waitFor(() =>
      expect(screen.getByText(/API unavailable/i)).toBeInTheDocument(),
    );
    // Shell copy still renders alongside the error.
    expect(
      screen.getByRole("heading", { level: 1, name: /welcome to agentclinic/i }),
    ).toBeInTheDocument();
  });

  it("shows an error state when the API responds non-2xx", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve(new Response("nope", { status: 500 })),
      ),
    );

    render(<Home />);

    expect(await screen.findByText(/API unavailable/i)).toBeInTheDocument();
  });
});

describe("AppShell", () => {
  it("renders the clinic header and nav inside the base layout", () => {
    render(
      <AppShell>
        <p>child content</p>
      </AppShell>,
    );

    expect(
      screen.getByRole("link", { name: "AgentClinic" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Staff" })).toHaveAttribute(
      "href",
      "/dashboard",
    );
    expect(screen.getByText("child content")).toBeInTheDocument();
  });
});
