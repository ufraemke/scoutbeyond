import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { readSupabasePublicEnv } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";

function hostFromUrl(url: string): string | null {
  try {
    return new URL(url).host;
  } catch {
    return null;
  }
}

export async function GET() {
  const config = readSupabasePublicEnv();

  if (!config.configured) {
    return NextResponse.json(
      {
        ok: false,
        message:
          "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
      },
      { status: 503 },
    );
  }

  const urlHost = hostFromUrl(config.env.url);

  if (!urlHost) {
    return NextResponse.json(
      {
        ok: false,
        message: "Supabase URL is invalid.",
      },
      { status: 503 },
    );
  }

  try {
    await createClient();

    const healthUrl = new URL("/auth/v1/health", config.env.url);
    const response = await fetch(healthUrl, {
      headers: {
        apikey: config.env.anonKey,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          ok: false,
          urlHost,
          message: "Supabase did not respond.",
        },
        { status: 503 },
      );
    }

    return NextResponse.json({
      ok: true,
      urlHost,
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        urlHost,
        message: "Supabase did not respond.",
      },
      { status: 503 },
    );
  }
}
