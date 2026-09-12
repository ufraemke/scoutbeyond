import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { startResearch } from "@/lib/research/start-research";
import { ResearchStartInputSchema } from "@/lib/research/schemas";

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

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Authentication required. Sign in anonymously from the client before starting research.",
        },
        { status: 401 },
      );
    }

    const run = await startResearch({
      ownerId: user.id,
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
