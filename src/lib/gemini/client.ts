import "server-only";

const GEMINI_API_BASE =
  "https://generativelanguage.googleapis.com/v1beta/models";

const DEFAULT_GEMINI_MODEL = "gemini-3.5-flash";
const DEFAULT_GEMINI_TIMEOUT_MS = 30_000;

function getApiKey(): string {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }
  return key;
}

function getModel(): string {
  return process.env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL;
}

function getTimeoutMs(): number {
  const configured = Number(process.env.GEMINI_TIMEOUT_MS);
  return Number.isFinite(configured) && configured > 0
    ? Math.floor(configured)
    : DEFAULT_GEMINI_TIMEOUT_MS;
}

export async function generateJson(prompt: string): Promise<unknown> {
  const key = getApiKey();
  const model = getModel();

  const response = await fetch(
    `${GEMINI_API_BASE}/${model}:generateContent?key=${encodeURIComponent(key)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: "application/json",
        },
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(getTimeoutMs()),
    },
  );

  const text = await response.text();
  if (!response.ok) {
    throw new Error(
      `Gemini ${model} failed (${response.status}): ${text.slice(0, 300)}`,
    );
  }

  const json = JSON.parse(text) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const rawText = json.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) {
    throw new Error(`Gemini ${model} returned empty content.`);
  }
  return JSON.parse(rawText) as unknown;
}
