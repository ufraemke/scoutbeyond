import { after, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { analyseSource } from "@/lib/research/analyse-source";
import { maybeStartCounterCheck } from "@/lib/research/counter-check";
import {
  getResearchRun,
  getStaleAnalysisBatch,
  queueAnalysisSources,
} from "@/lib/research/repository";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_RESUME_BATCH_SIZE = 2;

type Params = { params: Promise<{ runId: string }> };

export async function POST(_request: Request, { params }: Params) {
  const { runId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { ok: false, message: "Unauthorized" },
      { status: 401 },
    );
  }

  const run = await getResearchRun(runId);
  if (!run || run.ownerId !== user.id) {
    return NextResponse.json(
      { ok: false, message: "Not found" },
      { status: 404 },
    );
  }

  const batch = await getStaleAnalysisBatch(runId, {
    limit: MAX_RESUME_BATCH_SIZE,
  });
  const sourceIds = batch.sources.map((source) => source.id);
  await queueAnalysisSources(sourceIds);

  after(async () => {
    try {
      await Promise.allSettled(sourceIds.map((sourceId) => analyseSource(sourceId)));
    } finally {
      await maybeStartCounterCheck(runId);
    }
  });

  return NextResponse.json(
    {
      ok: true,
      scheduled: sourceIds.length,
      remaining: Math.max(0, batch.total - sourceIds.length),
    },
    { status: 202 },
  );
}
