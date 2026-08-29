import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AgentResponse } from "@clinic/types";
import AgentDetail from "./AgentDetail";
import * as api from "@/lib/api";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return {
    ...actual,
    getAgent: vi.fn(),
    updateAgent: vi.fn(),
    deleteAgent: vi.fn(),
    addAilment: vi.fn(),
    updateAilment: vi.fn(),
    deleteAilment: vi.fn(),
  };
});

const getAgent = vi.mocked(api.getAgent);
const addAilment = vi.mocked(api.addAilment);
const deleteAgent = vi.mocked(api.deleteAgent);

function chart(overrides: Partial<AgentResponse> = {}): AgentResponse {
  return {
    id: "a1",
    name: "Claude",
    description: "overworked",
    ailments: [
      {
        id: "c1",
        name: "2am pings",
        description: "midnight requests",
        agent: { id: "a1", name: "Claude" },
        recommendedTherapies: [{ id: "t1", name: "Async Advocacy" }],
        createdAt: "2026-08-29T00:00:00.000Z",
        updatedAt: "2026-08-29T00:00:00.000Z",
      },
    ],
    createdAt: "2026-08-29T00:00:00.000Z",
    updatedAt: "2026-08-29T00:00:00.000Z",
    ...overrides,
  };
}

describe("AgentDetail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the chart with complaints and read-only therapy chips", async () => {
    getAgent.mockResolvedValue(chart());

    render(<AgentDetail id="a1" />);

    expect(await screen.findByRole("heading", { name: "Claude" })).toBeInTheDocument();
    expect(screen.getByText("2am pings")).toBeInTheDocument();
    expect(screen.getByText("Async Advocacy")).toBeInTheDocument();
  });

  it("shows a not-found state on a 404", async () => {
    getAgent.mockRejectedValue(new api.ApiError(404, "Agent a1 not found"));

    render(<AgentDetail id="a1" />);

    expect(await screen.findByText(/no chart for this agent/i)).toBeInTheDocument();
  });

  it("logs a complaint via the check-in shortcut and refetches", async () => {
    const user = userEvent.setup();
    getAgent.mockResolvedValue(chart({ ailments: [] }));
    addAilment.mockResolvedValue(chart().ailments[0]);

    render(<AgentDetail id="a1" />);
    await screen.findByRole("heading", { name: "Claude" });

    const form = screen.getByRole("heading", { name: /log a complaint/i }).closest("form")!;
    await user.type(within(form).getByLabelText(/^complaint/i), "Scope creep");
    await user.click(within(form).getByRole("button", { name: /add complaint/i }));

    await waitFor(() =>
      expect(addAilment).toHaveBeenCalledWith("a1", {
        name: "Scope creep",
        description: null,
      }),
    );
    await waitFor(() => expect(getAgent).toHaveBeenCalledTimes(2));
  });

  it("discharges the agent after confirmation and navigates home", async () => {
    const user = userEvent.setup();
    getAgent.mockResolvedValue(chart());
    deleteAgent.mockResolvedValue(undefined);

    render(<AgentDetail id="a1" />);
    await screen.findByRole("heading", { name: "Claude" });

    await user.click(screen.getByRole("button", { name: /discharge agent/i }));
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: /discharge/i }));

    await waitFor(() => expect(deleteAgent).toHaveBeenCalledWith("a1"));
    await waitFor(() => expect(push).toHaveBeenCalledWith("/agents"));
  });
});
