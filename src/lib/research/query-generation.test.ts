import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const generateJson = vi.fn();
vi.mock("@/lib/gemini/client", () => ({
  generateJson: (...args: unknown[]) => generateJson(...args),
}));

import {
  generateDiversifiedQueries,
  reflectProblem,
} from "./query-generation";

const challenge =
  "Reduce water use when cleaning sticky residue from industrial tanks.";

describe("reflectProblem", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns a validated Gemini reflection without starting research", async () => {
    generateJson.mockResolvedValue({
      statement:
        "Reduce tank-cleaning water use while reliably removing sticky residue.",
      currentSolution: "Fixed-duration spray cleaning",
      goals: ["Reduce water consumption"],
      constraints: [
        {
          id: "c1",
          description: "Maintain required cleanliness",
          importance: "must",
        },
      ],
      assumptions: [
        {
          id: "a1",
          description: "Existing spray hardware may be retained",
          origin: "ai",
          status: "unconfirmed",
        },
      ],
      unknowns: ["Residue adhesion strength"],
      searchDimensions: [
        { id: "direct", name: "Direct application" },
        { id: "physical_principle", name: "Physical principle" },
        { id: "adjacent_application", name: "Adjacent applications" },
        { id: "cross_industry", name: "Cross-industry transfer" },
        { id: "emerging", name: "Emerging research" },
      ],
    });

    const result = await reflectProblem(challenge);

    expect(result.generationMode).toBe("gemini");
    expect(result.warning).toBeUndefined();
    expect(result.problem.statement).toContain("Reduce tank-cleaning");
    expect(generateJson).toHaveBeenCalledTimes(1);
  });

  it("labels deterministic fallback structuring when Gemini fails", async () => {
    generateJson.mockRejectedValue(new Error("Gemini unavailable"));

    const result = await reflectProblem(challenge);

    expect(result.generationMode).toBe("fallback");
    expect(result.warning).toContain("Gemini could not generate");
    expect(result.problem.statement).toBe(challenge);
    expect(result.problem.searchDimensions.map((item) => item.id)).toEqual([
      "direct",
      "physical_principle",
      "adjacent_application",
      "cross_industry",
      "emerging",
    ]);
  });

  it("passes user research priorities into diversified query generation", async () => {
    generateJson.mockResolvedValue({
      queries: [
        { query: "direct one", dimension: "direct" },
        { query: "direct two", dimension: "direct" },
        { query: "principle one", dimension: "physical_principle" },
        { query: "principle two", dimension: "physical_principle" },
        { query: "adjacent one", dimension: "adjacent_application" },
        { query: "cross one", dimension: "cross_industry" },
        { query: "emerging one", dimension: "emerging" },
      ],
    });

    await generateDiversifiedQueries({
      statement: challenge,
      goals: ["Reduce water consumption"],
      constraints: [],
      assumptions: [],
      unknowns: [],
      searchDimensions: [
        { id: "direct", name: "Direct application" },
      ],
      researchPreferences: {
        industryFocus: "beyond",
        evidenceTypes: ["patents", "industrial_cases"],
      },
    });

    expect(generateJson).toHaveBeenCalledWith(
      expect.stringContaining('"industryFocus":"beyond"'),
    );
    expect(generateJson).toHaveBeenCalledWith(
      expect.stringContaining('"patents"'),
    );
  });
});
