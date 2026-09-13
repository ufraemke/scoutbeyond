import { NextResponse } from "next/server";
import { startResearch } from "@/lib/research/start-research";
import { ResearchStartInputSchema } from "@/lib/research/schemas";
import { requireOwner } from "@/lib/supabase/require-owner";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = ResearchStartInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        message:
          "Review and confirm a valid structured research brief before starting.",
      },
      { status: 400 },
    );
  }

  const auth = await requireOwner({ route: "POST /api/research/start" });
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const run = await startResearch({
      ownerId: auth.ownerId,
      challenge: parsed.data.challenge,
      structuredProblem: parsed.data.structuredProblem,
    });

    return NextResponse.json({
      ok: true,
      runId: run.id,
      status: run.status,
    });
  } catch (error) {
    console.error("[research start]", error);
    const message =
      error instanceof Error ? error.message : "Research could not be started.";
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
