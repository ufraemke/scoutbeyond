import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { FirecrawlApiError } from "./client";

describe("FirecrawlApiError", () => {
  it("maps insufficient credits to a safe user-facing message", () => {
    const error = new FirecrawlApiError(402);

    expect(error.status).toBe(402);
    expect(error.message).toBe(
      "Firecrawl has insufficient credits for this research run.",
    );
  });

  it("maps rate limiting without exposing a provider payload", () => {
    const error = new FirecrawlApiError(429);

    expect(error.status).toBe(429);
    expect(error.message).toContain("request limit");
  });
});
