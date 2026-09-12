import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { reflectProblem } from "@/lib/research/query-generation";
import { ResearchChallengeSchema } from "@/lib/research/schemas";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = ResearchChallengeSchema.safeParse(body);
  if (!parsed.success) {
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
          "Authentication required. Refresh the page and try reviewing the brief again.",
      },
      { status: 401 },
    );
  }

  try {
    const reflection = await reflectProblem(parsed.data.challenge);
    return NextResponse.json({
      ok: true,
      ...reflection,
    });
  } catch (error) {
    console.error("[research refine]", error);
    return NextResponse.json(
      {
        ok: false,
        message:
          "The research brief could not be generated. Your challenge has been preserved; please try again.",
      },
      { status: 500 },
    );
  }
}
