import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AgentResponse } from "@clinic/types";
import AgentsScreen from "./AgentsScreen";
import * as api from "@/lib/api";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return {
    ...actual,
    listAgents: vi.fn(),
    createAgent: vi.fn(),
  };
});

const listAgents = vi.mocked(api.listAgents);
const createAgent = vi.mocked(api.createAgent);

function agent(overrides: Partial<AgentResponse> = {}): AgentResponse {
  return {
    id: "a1",
    name: "Claude",
    description: "overworked",
    ailments: [],
    createdAt: "2026-08-29T00:00:00.000Z",
    updatedAt: "2026-08-29T00:00:00.000Z",
    ...overrides,
  };
}

describe("AgentsScreen", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the roster from the API", async () => {
    listAgents.mockResolvedValue([
      agent(),
      agent({ id: "a2", name: "Pixel", ailments: [
        {
          id: "c1",
          name: "Scope creep",
          description: null,
          agent: { id: "a2", name: "Pixel" },
          recommendedTherapies: [],
          createdAt: "2026-08-29T00:00:00.000Z",
          updatedAt: "2026-08-29T00:00:00.000Z",
        },
      ] }),
    ]);

    render(<AgentsScreen />);

    expect(
      screen.getByRole("heading", { level: 1, name: /for agents/i }),
    ).toBeInTheDocument();
    expect(await screen.findAllByText("Claude")).not.toHaveLength(0);
    expect(screen.getAllByText("Pixel").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Scope creep").length).toBeGreaterThan(0);
  });

  it("shows an empty state when nobody has checked in", async () => {
    listAgents.mockResolvedValue([]);

    render(<AgentsScreen />);

    expect(
      await screen.findByText(/no agents have checked in yet/i),
    ).toBeInTheDocument();
  });

  it("shows an error state and keeps the shell when the API is down", async () => {
    listAgents.mockRejectedValue(new api.ApiError(0, "Network error"));

    render(<AgentsScreen />);

    expect(await screen.findByText(/couldn't reach the clinic/i)).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 1, name: /for agents/i }),
    ).toBeInTheDocument();
  });

  it("checks in a new agent and refetches the roster", async () => {
    const user = userEvent.setup();
    listAgents.mockResolvedValue([]);
    createAgent.mockResolvedValue(agent({ name: "Ada" }));

    render(<AgentsScreen />);
    await screen.findByText(/no agents have checked in yet/i);

    const form = screen.getByRole("heading", { name: /check in/i }).closest("form")!;
    await user.type(within(form).getByLabelText(/agent name/i), "Ada");
    await user.click(within(form).getByRole("button", { name: /check in/i }));

    await waitFor(() =>
      expect(createAgent).toHaveBeenCalledWith({ name: "Ada", description: null }),
    );
    // initial load + refetch after create
    await waitFor(() => expect(listAgents).toHaveBeenCalledTimes(2));
  });

  it("blocks check-in with a whitespace-only name", async () => {
    const user = userEvent.setup();
    listAgents.mockResolvedValue([]);

    render(<AgentsScreen />);
    await screen.findByText(/no agents have checked in yet/i);

    const form = screen.getByRole("heading", { name: /check in/i }).closest("form")!;
    // A blank field is caught by native `required`; a spaces-only field is the
    // case our own trim guard has to handle.
    await user.type(within(form).getByLabelText(/agent name/i), "   ");
    await user.click(within(form).getByRole("button", { name: /check in/i }));

    expect(
      await within(form).findByText(/tell us who's checking in/i),
    ).toBeInTheDocument();
    expect(createAgent).not.toHaveBeenCalled();
  });
});
