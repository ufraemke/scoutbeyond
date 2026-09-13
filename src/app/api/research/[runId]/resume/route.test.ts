import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  afterCallbacks: [] as Array<() => Promise<void> | void>,
  getUser: vi.fn(),
  getResearchRun: vi.fn(),
  getRunSnapshot: vi.fn(),
  getStaleAnalysisBatch: vi.fn(),
  queueAnalysisSources: vi.fn(),
  analyseSource: vi.fn(),
  maybeStartCounterCheck: vi.fn(),
}));

vi.mock("next/server", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/server")>();
  return {
    ...actual,
    after: (callback: () => Promise<void> | void) => {
      mocks.afterCallbacks.push(callback);
    },
  };
});

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser: mocks.getUser },
  }),
}));

vi.mock("@/lib/research/repository", () => ({
  getResearchRun: (...args: unknown[]) => mocks.getResearchRun(...args),
  getRunSnapshot: (...args: unknown[]) => mocks.getRunSnapshot(...args),
  getStaleAnalysisBatch: (...args: unknown[]) =>
    mocks.getStaleAnalysisBatch(...args),
  queueAnalysisSources: (...args: unknown[]) =>
    mocks.queueAnalysisSources(...args),
}));

vi.mock("@/lib/research/analyse-source", () => ({
  analyseSource: (...args: unknown[]) => mocks.analyseSource(...args),
}));

vi.mock("@/lib/research/counter-check", () => ({
  maybeStartCounterCheck: (...args: unknown[]) =>
    mocks.maybeStartCounterCheck(...args),
}));

import { POST } from "./route";
import * as snapshotRoute from "../route";

describe("POST /api/research/[runId]/resume", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.afterCallbacks.length = 0;
    mocks.getUser.mockResolvedValue({
      data: { user: { id: "owner-1" } },
      error: null,
    });
    mocks.getResearchRun.mockResolvedValue({
      id: "run-1",
      ownerId: "owner-1",
    });
    mocks.getStaleAnalysisBatch.mockResolvedValue({
      sources: [{ id: "source-1" }, { id: "source-2" }],
      total: 5,
    });
    mocks.queueAnalysisSources.mockResolvedValue(undefined);
    mocks.analyseSource.mockResolvedValue(undefined);
    mocks.maybeStartCounterCheck.mockResolvedValue(undefined);
  });

  it("returns 202 before processing at most two stale sources", async () => {
    const response = await POST(
      new Request("http://localhost/api/research/run-1/resume", {
        method: "POST",
      }),
      { params: Promise.resolve({ runId: "run-1" }) },
    );

    expect(response.status).toBe(202);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      scheduled: 2,
      remaining: 3,
    });
    expect(mocks.getStaleAnalysisBatch).toHaveBeenCalledWith("run-1", {
      limit: 2,
    });
    expect(mocks.queueAnalysisSources).toHaveBeenCalledWith([
      "source-1",
      "source-2",
    ]);
    expect(mocks.analyseSource).not.toHaveBeenCalled();

    expect(mocks.afterCallbacks).toHaveLength(1);
    await mocks.afterCallbacks[0]?.();

    expect(mocks.analyseSource).toHaveBeenCalledTimes(2);
    expect(mocks.maybeStartCounterCheck).toHaveBeenCalledWith("run-1");
  });

  it("does not expose another owner's run", async () => {
    mocks.getResearchRun.mockResolvedValue({
      id: "run-1",
      ownerId: "owner-2",
    });

    const response = await POST(
      new Request("http://localhost/api/research/run-1/resume", {
        method: "POST",
      }),
      { params: Promise.resolve({ runId: "run-1" }) },
    );

    expect(response.status).toBe(404);
    expect(mocks.getStaleAnalysisBatch).not.toHaveBeenCalled();
    expect(mocks.afterCallbacks).toHaveLength(0);
  });

  it("requires an authenticated session", async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    const response = await POST(
      new Request("http://localhost/api/research/run-1/resume", {
        method: "POST",
      }),
      { params: Promise.resolve({ runId: "run-1" }) },
    );

    expect(response.status).toBe(401);
    expect(mocks.getResearchRun).not.toHaveBeenCalled();
  });
});

describe("GET /api/research/[runId]", () => {
  it("does not expose a mutation handler", () => {
    expect("POST" in snapshotRoute).toBe(false);
  });
});
