import { after } from "next/server";
import { NextResponse } from "next/server";
import {
  handleFirecrawlWebhook,
  runScheduledAnalyses,
} from "@/lib/research/webhook-handlers";
import { maybeStartCounterCheck } from "@/lib/research/counter-check";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signatureHeader = request.headers.get("X-Firecrawl-Signature");

  let result;
  try {
    result = await handleFirecrawlWebhook({
      rawBody,
      signatureHeader,
    });
  } catch (error) {
    console.error("[firecrawl webhook]", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  if (result.status === "unauthorized") {
    return NextResponse.json({ ok: false, message: "Invalid signature" }, { status: 401 });
  }

  const sourceIds = result.scheduleAnalysisSourceIds;
  const runId = result.researchRunId;

  // Do not await Gemini analysis in the webhook response path.
  if (sourceIds.length > 0 || runId) {
    after(async () => {
      if (sourceIds.length > 0) {
        await runScheduledAnalyses(sourceIds);
      }
      if (runId) {
        await maybeStartCounterCheck(runId);
      }
    });
  }

  return NextResponse.json({
    ok: true,
    duplicate: result.status === "duplicate",
  });
}
