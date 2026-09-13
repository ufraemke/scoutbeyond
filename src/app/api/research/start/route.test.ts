import { beforeEach, describe, expect, it, vi } from "vitest";
import type { StructuredProblem } from "@/types";
import { NextResponse } from "next/server";

const requireOwner = vi.fn();
vi.mock("@/lib/supabase/require-owner", () => ({
  requireOwner: (...args: unknown[]) => requireOwner(...args),
}));

const startResearch = vi.fn();
vi.mock("@/lib/research/start-research", () => ({
  startResearch: (...args: unknown[]) => startResearch(...args),
}));

import { POST } from "./route";

const structuredProblem: StructuredProblem = {
  statement:
    "Reduce tank-cleaning water use while reliably removing sticky residue.",
  goals: ["Reduce water consumption"],
  constraints: [],
  assumptions: [],
  unknowns: ["Residue adhesion strength"],
  searchDimensions: [
    { id: "direct", name: "Direct application" },
    { id: "physical_principle", name: "Physical principle" },
  ],
};

describe("POST /api/research/start", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireOwner.mockResolvedValue({ ok: true, ownerId: "user-1" });
    startResearch.mockResolvedValue({
      id: "run-1",
      status: "scraping",
    });
  });

  it("starts research for an authenticated owner", async () => {
    const response = await POST(
      new Request("http://localhost/api/research/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challenge:
            "Reduce water use when cleaning sticky residue from industrial tanks.",
          structuredProblem,
        }),
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      runId: "run-1",
      status: "scraping",
    });
    expect(startResearch).toHaveBeenCalledWith({
      ownerId: "user-1",
      challenge:
        "Reduce water use when cleaning sticky residue from industrial tanks.",
      structuredProblem,
    });
  });

  it("returns 401 without starting research when the session is missing", async () => {
    requireOwner.mockResolvedValue({
      ok: false,
      response: NextResponse.json(
        {
          ok: false,
          message: "Authentication required. Refresh the page and try again.",
        },
        { status: 401 },
      ),
    });

    const response = await POST(
      new Request("http://localhost/api/research/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challenge:
            "Reduce water use when cleaning sticky residue from industrial tanks.",
          structuredProblem,
        }),
      }),
    );

    expect(response.status).toBe(401);
    expect(startResearch).not.toHaveBeenCalled();
  });

  it("returns 503 without starting research when auth is temporarily unavailable", async () => {
    requireOwner.mockResolvedValue({
      ok: false,
      response: NextResponse.json(
        {
          ok: false,
          message:
            "Authentication is temporarily unavailable. Please try again in a moment.",
        },
        { status: 503, headers: { "Retry-After": "5" } },
      ),
    });

    const response = await POST(
      new Request("http://localhost/api/research/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challenge:
            "Reduce water use when cleaning sticky residue from industrial tanks.",
          structuredProblem,
        }),
      }),
    );

    expect(response.status).toBe(503);
    expect(response.headers.get("Retry-After")).toBe("5");
    expect(startResearch).not.toHaveBeenCalled();
  });
});
