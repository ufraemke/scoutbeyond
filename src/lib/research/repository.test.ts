import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));

import { mapSnapshotSource } from "@/lib/research/repository";

describe("research snapshot sources", () => {
  it("omits markdown and provider metadata from the public shape", () => {
    const databaseRow = {
      id: "source-1",
      research_run_id: "run-1",
      url: "https://example.com/source",
      canonical_url: "https://example.com/source",
      title: "Example",
      description: "Search description",
      search_dimension: "direct",
      search_query: "query",
      status: "analysed" as const,
      analysis_status: "completed" as const,
      scrape_id: "scrape-1",
      markdown: "# Large scraped body",
      metadata: { provider: "firecrawl" },
      error_message: null,
      created_at: "2026-09-13T00:00:00.000Z",
      updated_at: "2026-09-13T00:01:00.000Z",
      scraped_at: "2026-09-13T00:00:30.000Z",
      analysed_at: "2026-09-13T00:01:00.000Z",
    };

    const source = mapSnapshotSource(databaseRow);

    expect(source).not.toHaveProperty("markdown");
    expect(source).not.toHaveProperty("metadata");
    expect(source).not.toHaveProperty("searchQuery");
    expect(source).not.toHaveProperty("scrapeId");
    expect(source).toMatchObject({
      id: "source-1",
      title: "Example",
      status: "analysed",
      analysisStatus: "completed",
    });
  });
});
