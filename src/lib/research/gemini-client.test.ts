import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { generateJson } from "@/lib/gemini/client";

describe("Gemini client", () => {
  const originalApiKey = process.env.GEMINI_API_KEY;
  const originalModel = process.env.GEMINI_MODEL;
  const originalTimeout = process.env.GEMINI_TIMEOUT_MS;

  beforeEach(() => {
    process.env.GEMINI_API_KEY = "test-key";
    delete process.env.GEMINI_MODEL;
    delete process.env.GEMINI_TIMEOUT_MS;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    restoreEnvironmentVariable("GEMINI_API_KEY", originalApiKey);
    restoreEnvironmentVariable("GEMINI_MODEL", originalModel);
    restoreEnvironmentVariable("GEMINI_TIMEOUT_MS", originalTimeout);
  });

  it("uses the stable default once without model fallback retries", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response("missing", { status: 404 }));

    await expect(generateJson("test")).rejects.toThrow(
      "Gemini gemini-3.5-flash failed (404)",
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain(
      "/gemini-3.5-flash:generateContent",
    );
  });

  it("uses the configured model and abort timeout", async () => {
    process.env.GEMINI_MODEL = "gemini-test-model";
    process.env.GEMINI_TIMEOUT_MS = "1234";
    const timeoutSpy = vi.spyOn(AbortSignal, "timeout");
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({
        candidates: [
          {
            content: {
              parts: [{ text: JSON.stringify({ result: "ok" }) }],
            },
          },
        ],
      }),
    );

    await expect(generateJson("test")).resolves.toEqual({ result: "ok" });
    expect(timeoutSpy).toHaveBeenCalledWith(1234);
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain(
      "/gemini-test-model:generateContent",
    );
  });
});

function restoreEnvironmentVariable(
  name: "GEMINI_API_KEY" | "GEMINI_MODEL" | "GEMINI_TIMEOUT_MS",
  value: string | undefined,
): void {
  if (value === undefined) {
    delete process.env[name];
  } else {
    process.env[name] = value;
  }
}
