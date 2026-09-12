import { beforeEach, describe, expect, it, vi } from "vitest";
import type { StructuredProblem } from "@/types";

const getUser = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser },
  }),
}));

const reflectProblem = vi.fn();
vi.mock("@/lib/research/query-generation", () => ({
  reflectProblem: (...args: unknown[]) => reflectProblem(...args),
}));

const searchWeb = vi.fn();
vi.mock("@/lib/firecrawl/client", () => ({
  searchWeb: (...args: unknown[]) => searchWeb(...args),
}));

import { POST } from "./route";

const problem: StructuredProblem = {
  statement:
    "Reduce tank-cleaning water use while reliably removing sticky residue.",
  goals: ["Reduce water consumption"],
  constraints: [],
  assumptions: [],
  unknowns: ["Residue adhesion strength"],
  searchDimensions: [
    { id: "direct", name: "Direct application" },
    { id: "physical_principle", name: "Physical principle" },
    { id: "adjacent_application", name: "Adjacent applications" },
    { id: "cross_industry", name: "Cross-industry transfer" },
    { id: "emerging", name: "Emerging research" },
  ],
};

describe("POST /api/research/refine", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });
    reflectProblem.mockResolvedValue({
      problem,
      generationMode: "gemini",
    });
  });

  it("returns a Gemini brief without calling Firecrawl", async () => {
    const response = await POST(
      new Request("http://localhost/api/research/refine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challenge:
            "Reduce water use when cleaning sticky residue from industrial tanks.",
        }),
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      problem,
      generationMode: "gemini",
    });
    expect(reflectProblem).toHaveBeenCalledTimes(1);
    expect(searchWeb).not.toHaveBeenCalled();
  });

  it("requires the anonymous Supabase session", async () => {
    getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    const response = await POST(
      new Request("http://localhost/api/research/refine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challenge:
            "Reduce water use when cleaning sticky residue from industrial tanks.",
        }),
      }),
    );

    expect(response.status).toBe(401);
    expect(reflectProblem).not.toHaveBeenCalled();
    expect(searchWeb).not.toHaveBeenCalled();
  });
});
