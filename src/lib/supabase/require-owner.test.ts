import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthRetryableFetchError } from "@supabase/supabase-js";

vi.mock("server-only", () => ({}));

const getClaims = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getClaims },
  }),
}));

import { requireOwner } from "./require-owner";

describe("requireOwner", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  it("returns the verified owner id from JWT claims", async () => {
    getClaims.mockResolvedValue({
      data: { claims: { sub: "owner-1" } },
      error: null,
    });

    const result = await requireOwner({ route: "test" });

    expect(result).toEqual({ ok: true, ownerId: "owner-1" });
    expect(getClaims).toHaveBeenCalledTimes(1);
  });

  it("returns 401 when no session claims are present", async () => {
    getClaims.mockResolvedValue({
      data: null,
      error: null,
    });

    const result = await requireOwner({ route: "test" });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.response.status).toBe(401);
    await expect(result.response.json()).resolves.toEqual({
      ok: false,
      message: "Authentication required. Refresh the page and try again.",
    });
    expect(getClaims).toHaveBeenCalledTimes(1);
  });

  it("retries once on a retryable auth failure then succeeds", async () => {
    getClaims
      .mockResolvedValueOnce({
        data: null,
        error: new AuthRetryableFetchError("HTTP 504", 504),
      })
      .mockResolvedValueOnce({
        data: { claims: { sub: "owner-1" } },
        error: null,
      });

    const result = await requireOwner({ route: "test" });

    expect(result).toEqual({ ok: true, ownerId: "owner-1" });
    expect(getClaims).toHaveBeenCalledTimes(2);
  });

  it("returns 503 with Retry-After after a retryable auth failure persists", async () => {
    getClaims.mockResolvedValue({
      data: null,
      error: new AuthRetryableFetchError("HTTP 504", 504),
    });

    const result = await requireOwner({ route: "POST /api/research/start" });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.response.status).toBe(503);
    expect(result.response.headers.get("Retry-After")).toBe("5");
    await expect(result.response.json()).resolves.toEqual({
      ok: false,
      message:
        "Authentication is temporarily unavailable. Please try again in a moment.",
    });
    expect(getClaims).toHaveBeenCalledTimes(2);
    expect(console.error).toHaveBeenCalled();
  });

  it("returns 401 for non-retryable auth errors without retrying", async () => {
    getClaims.mockResolvedValue({
      data: null,
      error: {
        name: "AuthApiError",
        message: "Invalid JWT",
        status: 401,
        code: "bad_jwt",
      },
    });

    const result = await requireOwner({ route: "test" });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.response.status).toBe(401);
    expect(getClaims).toHaveBeenCalledTimes(1);
  });
});
