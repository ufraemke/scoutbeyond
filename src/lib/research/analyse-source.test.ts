import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  extractFromSource: vi.fn(),
  appendResearchEvent: vi.fn(),
  getResearchRun: vi.fn(),
  getSource: vi.fn(),
  refreshRunCounters: vi.fn(),
  updateSource: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/gemini/extract-from-source", () => ({
  extractFromSource: (...args: unknown[]) => mocks.extractFromSource(...args),
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));
vi.mock("@/lib/research", () => ({
  assessApplicability: vi.fn(),
  assessEvidenceQuality: vi.fn(),
  calculateConfidence: vi.fn(),
  classifyCandidate: vi.fn(),
}));
vi.mock("@/lib/research/candidate-merging", () => ({
  mergeExtractedCandidate: vi.fn(),
}));
vi.mock("@/lib/research/repository", () => ({
  appendResearchEvent: (...args: unknown[]) =>
    mocks.appendResearchEvent(...args),
  getResearchRun: (...args: unknown[]) => mocks.getResearchRun(...args),
  getSource: (...args: unknown[]) => mocks.getSource(...args),
  refreshRunCounters: (...args: unknown[]) =>
    mocks.refreshRunCounters(...args),
  updateSource: (...args: unknown[]) => mocks.updateSource(...args),
}));

import { analyseSource } from "@/lib/research/analyse-source";

const source = {
  id: "source-1",
  researchRunId: "run-1",
  title: "Example source",
  url: "https://example.com",
  markdown: "technical content",
  status: "scraped",
  analysisStatus: "queued",
  errorMessage: null,
};

describe("analyseSource terminal states", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSource.mockResolvedValue(source);
    mocks.getResearchRun.mockResolvedValue({
      id: "run-1",
      status: "analysing",
      structuredProblem: { statement: "Challenge" },
    });
    mocks.updateSource.mockImplementation(
      async (_sourceId: string, patch: Record<string, unknown>) => ({
        ...source,
        ...patch,
        analysisStatus: patch.analysis_status ?? source.analysisStatus,
        researchRunId: "run-1",
      }),
    );
    mocks.appendResearchEvent.mockResolvedValue(undefined);
    mocks.refreshRunCounters.mockResolvedValue(undefined);
  });

  it("marks a failed extraction as a terminal failed source", async () => {
    mocks.extractFromSource.mockRejectedValue(new Error("Gemini timed out"));

    await analyseSource("source-1");

    expect(mocks.updateSource).toHaveBeenLastCalledWith(
      "source-1",
      expect.objectContaining({
        analysis_status: "failed",
        status: "failed",
        error_message: "Gemini timed out",
      }),
    );
    expect(mocks.refreshRunCounters).toHaveBeenCalledWith("run-1");
  });

  it("marks missing content as skipped and terminal", async () => {
    mocks.getSource.mockResolvedValue({
      ...source,
      markdown: null,
    });

    await analyseSource("source-1");

    expect(mocks.updateSource).toHaveBeenCalledWith(
      "source-1",
      expect.objectContaining({
        analysis_status: "skipped",
        status: "failed",
      }),
    );
    expect(mocks.extractFromSource).not.toHaveBeenCalled();
    expect(mocks.refreshRunCounters).toHaveBeenCalledWith("run-1");
  });
});
