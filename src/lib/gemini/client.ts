import "server-only";

const GEMINI_API_BASE =
  "https://generativelanguage.googleapis.com/v1beta/models";

const MODEL_CANDIDATES = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-flash-latest",
];

function getApiKey(): string {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }
  return key;
}

export async function generateJson(prompt: string): Promise<unknown> {
  const key = getApiKey();
  let lastError: Error | null = null;

  for (const model of MODEL_CANDIDATES) {
    try {
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
        },
      );

      const text = await response.text();
      if (!response.ok) {
        lastError = new Error(`Gemini ${model} failed (${response.status}): ${text.slice(0, 300)}`);
        continue;
      }

      const json = JSON.parse(text) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      };
      const rawText = json.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) {
        lastError = new Error(`Gemini ${model} returned empty content.`);
        continue;
      }
      return JSON.parse(rawText) as unknown;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
    }
  }

  throw lastError ?? new Error("Gemini request failed.");
}
