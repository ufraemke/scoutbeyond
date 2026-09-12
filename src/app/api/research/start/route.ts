import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { startResearch } from "@/lib/research/start-research";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { challenge?: string };
    const challenge = body.challenge?.trim() ?? "";
    if (challenge.length < 12) {
      return NextResponse.json(
        {
          ok: false,
          message: "Please describe the technical challenge in more detail.",
        },
        { status: 400 },
      );
    }

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
      challenge,
    });

    return NextResponse.json({
      ok: true,
      runId: run.id,
      status: run.status,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Research could not be started.";
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
