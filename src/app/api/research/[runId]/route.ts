import { NextResponse } from "next/server";
import { getRunSnapshot } from "@/lib/research/repository";
import { requireOwner } from "@/lib/supabase/require-owner";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type Params = { params: Promise<{ runId: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { runId } = await params;
  const auth = await requireOwner({ route: "GET /api/research/[runId]" });
  if (!auth.ok) {
    return auth.response;
  }

  const snapshot = await getRunSnapshot(runId);
  if (!snapshot || snapshot.run.ownerId !== auth.ownerId) {
    return NextResponse.json({ ok: false, message: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, snapshot });
}
