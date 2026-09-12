import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getRunSnapshot } from "@/lib/research/repository";
import { resumeStaleAnalysis } from "@/lib/research/analyse-source";
import { maybeStartCounterCheck } from "@/lib/research/counter-check";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type Params = { params: Promise<{ runId: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { runId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  const snapshot = await getRunSnapshot(runId);
  if (!snapshot || snapshot.run.ownerId !== user.id) {
    return NextResponse.json({ ok: false, message: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, snapshot });
}

export async function POST(_request: Request, { params }: Params) {
  const { runId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  const snapshot = await getRunSnapshot(runId);
  if (!snapshot || snapshot.run.ownerId !== user.id) {
    return NextResponse.json({ ok: false, message: "Not found" }, { status: 404 });
  }

  const resumed = await resumeStaleAnalysis(runId);
  await maybeStartCounterCheck(runId);
  const refreshed = await getRunSnapshot(runId);

  return NextResponse.json({
    ok: true,
    resumed,
    snapshot: refreshed,
  });
}
