import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ResearchRunRecord, StructuredProblem } from "@/types";

vi.mock("server-only", () => ({}));

const searchWeb = vi.fn();
vi.mock("@/lib/firecrawl/client", () => ({
  searchWeb: (...args: unknown[]) => searchWeb(...args),
  FirecrawlApiError: class FirecrawlApiError extends Error {
    readonly status: number;

    constructor(status: number) {
      super(`Firecrawl failed with status ${status}.`);
      this.status = status;
    }
  },
}));

const generateDiversifiedQueries = vi.fn();
vi.mock("./query-generation", () => ({
  generateDiversifiedQueries: (...args: unknown[]) =>
    generateDiversifiedQueries(...args),
}));

const createResearchRun = vi.fn();
const updateResearchRun = vi.fn();
const appendResearchEvent = vi.fn();
const upsertDiscoveredSources = vi.fn();
vi.mock("./repository", () => ({
  createResearchRun: (...args: unknown[]) => createResearchRun(...args),
  updateResearchRun: (...args: unknown[]) => updateResearchRun(...args),
  appendResearchEvent: (...args: unknown[]) => appendResearchEvent(...args),
  upsertDiscoveredSources: (...args: unknown[]) =>
    upsertDiscoveredSources(...args),
}));

const startInitialBatchScrape = vi.fn();
vi.mock("./scrape", () => ({
  startInitialBatchScrape: (...args: unknown[]) =>
    startInitialBatchScrape(...args),
}));

import { startResearch } from "./start-research";

const structuredProblem: StructuredProblem = {
  statement: "Need a safer way to clean sticky residue from food tanks.",
  goals: ["remove residue without damaging tank walls"],
  constraints: [
    {
      id: "c1",
      description: "no abrasive damage",
      importance: "must",
    },
  ],
  assumptions: [],
  unknowns: ["preferred cleaning medium"],
  searchDimensions: [
    {
      id: "d1",
      name: "physical principle",
      description: "cavitation and shear",
    },
  ],
};

function makeRun(
  overrides: Partial<ResearchRunRecord> = {},
): ResearchRunRecord {
  return {
    id: "run-1",
    ownerId: "user-1",
    challenge: "Need a safer way to clean sticky residue from food tanks.",
    structuredProblem,
    status: "queued",
    phase: "queued",
    errorMessage: null,
    sourcesFound: 0,
    sourcesScraped: 0,
    sourcesAnalysed: 0,
    sourcesFailed: 0,
    candidatesCount: 0,
    searchQueries: [],
    warnings: [],
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    completedAt: null,
    ...overrides,
  };
}

describe("startResearch orchestration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    generateDiversifiedQueries.mockResolvedValue([
      {
        query: "tank cleaning cavitation",
        dimension: "physical_principle",
      },
    ]);
    searchWeb.mockResolvedValue([
      {
        url: "https://example.com/ultrasonic",
        title: "Ultrasonic cleaning",
        description: "Cavitation-based cleaning",
      },
    ]);
    appendResearchEvent.mockResolvedValue(undefined);
    upsertDiscoveredSources.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns the scraping-state run without an empty database update", async () => {
    const queued = makeRun();
    const searching = makeRun({ status: "searching", phase: "searching" });
    const withQueries = makeRun({
      status: "searching",
      phase: "searching",
      searchQueries: [
        {
          query: "tank cleaning cavitation",
          dimension: "physical_principle",
        },
      ],
    });
    const withSources = makeRun({
      status: "searching",
      phase: "searching",
      sourcesFound: 1,
      searchQueries: withQueries.searchQueries,
    });
    const scraping = makeRun({
      status: "scraping",
      phase: "scraping",
      sourcesFound: 1,
      searchQueries: withQueries.searchQueries,
    });

    createResearchRun.mockResolvedValue(queued);
    updateResearchRun
      .mockResolvedValueOnce(searching)
      .mockResolvedValueOnce(withQueries)
      .mockResolvedValueOnce(withSources);
    startInitialBatchScrape.mockResolvedValue({
      jobId: "fc-job-1",
      run: scraping,
    });

    const result = await startResearch({
      ownerId: "user-1",
      challenge: "Need a safer way to clean sticky residue from food tanks.",
      structuredProblem,
    });

    expect(result).toEqual(scraping);
    expect(result.status).toBe("scraping");
    expect(createResearchRun).toHaveBeenCalledWith({
      ownerId: "user-1",
      challenge: "Need a safer way to clean sticky residue from food tanks.",
      structuredProblem,
    });
    expect(startInitialBatchScrape).toHaveBeenCalledTimes(1);
    expect(updateResearchRun).not.toHaveBeenCalledWith("run-1", {});
    for (const [, patch] of updateResearchRun.mock.calls) {
      expect(Object.keys(patch as Record<string, unknown>).length).toBeGreaterThan(
        0,
      );
    }
  });

  it("fails clearly when every Firecrawl search request fails", async () => {
    const queued = makeRun();
    const searching = makeRun({ status: "searching", phase: "searching" });
    const failed = makeRun({
      status: "failed",
      phase: "failed",
      errorMessage: "Firecrawl has insufficient credits for this research run.",
    });

    createResearchRun.mockResolvedValue(queued);
    updateResearchRun
      .mockResolvedValueOnce(searching)
      .mockResolvedValueOnce(searching)
      .mockResolvedValueOnce(failed);
    searchWeb.mockRejectedValue(
      new Error("Firecrawl has insufficient credits for this research run."),
    );

    await expect(
      startResearch({
        ownerId: "user-1",
        challenge: "Need a safer way to clean sticky residue from food tanks.",
        structuredProblem,
      }),
    ).rejects.toThrow("insufficient credits");

    expect(upsertDiscoveredSources).not.toHaveBeenCalled();
    expect(startInitialBatchScrape).not.toHaveBeenCalled();
    expect(updateResearchRun).toHaveBeenLastCalledWith(
      "run-1",
      expect.objectContaining({
        status: "failed",
        error_message:
          "Firecrawl has insufficient credits for this research run.",
      }),
    );
  });

  it("continues with available sources and records partial search failures", async () => {
    const queries = [
      {
        query: "tank cleaning cavitation",
        dimension: "physical_principle" as const,
      },
      {
        query: "cross-industry tank residue removal",
        dimension: "cross_industry" as const,
      },
    ];
    generateDiversifiedQueries.mockResolvedValue(queries);
    searchWeb
      .mockRejectedValueOnce(new Error("temporary search failure"))
      .mockResolvedValueOnce([
        {
          url: "https://example.com/ultrasonic",
          title: "Ultrasonic cleaning",
        },
      ]);

    const queued = makeRun();
    const searching = makeRun({ status: "searching", phase: "searching" });
    const withSources = makeRun({
      status: "searching",
      phase: "searching",
      sourcesFound: 1,
      warnings: [
        "1 of 2 search queries failed; research continued with the available results.",
      ],
    });
    const scraping = makeRun({
      status: "scraping",
      phase: "scraping",
      sourcesFound: 1,
      warnings: withSources.warnings,
    });

    createResearchRun.mockResolvedValue(queued);
    updateResearchRun
      .mockResolvedValueOnce(searching)
      .mockResolvedValueOnce(searching)
      .mockResolvedValueOnce(withSources);
    startInitialBatchScrape.mockResolvedValue({
      jobId: "fc-job-1",
      run: scraping,
    });

    const result = await startResearch({
      ownerId: "user-1",
      challenge: "Need a safer way to clean sticky residue from food tanks.",
      structuredProblem,
    });

    expect(result).toEqual(scraping);
    expect(upsertDiscoveredSources).toHaveBeenCalledWith(
      "run-1",
      expect.arrayContaining([
        expect.objectContaining({
          url: "https://example.com/ultrasonic",
          searchDimension: "cross_industry",
        }),
      ]),
    );
    expect(updateResearchRun).toHaveBeenNthCalledWith(
      3,
      "run-1",
      expect.objectContaining({
        sources_found: 1,
        warnings: [
          "1 of 2 search queries failed; research continued with the available results.",
        ],
      }),
    );
  });
});
