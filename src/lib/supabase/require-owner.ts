import "server-only";

import { NextResponse } from "next/server";
import {
  isAuthRetryableFetchError,
  type AuthError,
} from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export type OwnerAuthSuccess = {
  ok: true;
  ownerId: string;
};

export type OwnerAuthFailure = {
  ok: false;
  response: NextResponse;
};

export type OwnerAuthResult = OwnerAuthSuccess | OwnerAuthFailure;

const RETRYABLE_MESSAGE =
  "Authentication is temporarily unavailable. Please try again in a moment.";
const UNAUTHENTICATED_MESSAGE =
  "Authentication required. Refresh the page and try again.";

type ClaimsResult = Awaited<
  ReturnType<Awaited<ReturnType<typeof createClient>>["auth"]["getClaims"]>
>;

function isRetryableAuthError(error: AuthError | null | undefined): boolean {
  if (!error) return false;
  if (isAuthRetryableFetchError(error)) return true;
  const status = error.status;
  return typeof status === "number" && status >= 500 && status <= 599;
}

function logAuthDiagnostics(
  route: string,
  error: AuthError | null | undefined,
  attempt: number,
) {
  console.error("[auth]", {
    route,
    attempt,
    name: error?.name,
    status: error?.status,
    code: error?.code,
    message: error?.message,
  });
}

function serviceUnavailableResponse(): NextResponse {
  return NextResponse.json(
    { ok: false, message: RETRYABLE_MESSAGE },
    {
      status: 503,
      headers: { "Retry-After": "5" },
    },
  );
}

function unauthorizedResponse(): NextResponse {
  return NextResponse.json(
    { ok: false, message: UNAUTHENTICATED_MESSAGE },
    { status: 401 },
  );
}

async function readVerifiedOwnerId(
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<{ ownerId: string | null; error: AuthError | null }> {
  const result: ClaimsResult = await supabase.auth.getClaims();

  if (result.error) {
    return { ownerId: null, error: result.error };
  }

  const sub = result.data?.claims?.sub;
  if (typeof sub === "string" && sub.length > 0) {
    return { ownerId: sub, error: null };
  }

  return { ownerId: null, error: null };
}

/**
 * Resolve the authenticated owner from the request session cookies.
 *
 * Prefers local JWT verification via `getClaims()` (no Auth network round-trip
 * when the project uses asymmetric signing keys). Retries once on transient
 * Auth/provider failures before returning 503.
 */
export async function requireOwner(options?: {
  route?: string;
}): Promise<OwnerAuthResult> {
  const route = options?.route ?? "unknown";
  const supabase = await createClient();

  let { ownerId, error } = await readVerifiedOwnerId(supabase);

  if (ownerId) {
    return { ok: true, ownerId };
  }

  if (isRetryableAuthError(error)) {
    logAuthDiagnostics(route, error, 1);
    ({ ownerId, error } = await readVerifiedOwnerId(supabase));

    if (ownerId) {
      return { ok: true, ownerId };
    }

    if (isRetryableAuthError(error)) {
      logAuthDiagnostics(route, error, 2);
      return { ok: false, response: serviceUnavailableResponse() };
    }
  }

  if (error) {
    logAuthDiagnostics(route, error, 1);
  }

  return { ok: false, response: unauthorizedResponse() };
}
