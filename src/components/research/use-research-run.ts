"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { ResearchRunSnapshot } from "@/types";

type ConnectionState = "connecting" | "connected" | "reconnecting" | "error";

export function useResearchRun(runId: string) {
  const [snapshot, setSnapshot] = useState<ResearchRunSnapshot | null>(null);
  const [connection, setConnection] = useState<ConnectionState>("connecting");
  const [error, setError] = useState<string | null>(null);

  const loadSnapshot = useCallback(async () => {
    const response = await fetch(`/api/research/${runId}`, { cache: "no-store" });
    const json = (await response.json()) as {
      ok: boolean;
      message?: string;
      snapshot?: ResearchRunSnapshot;
    };
    if (!response.ok || !json.ok || !json.snapshot) {
      throw new Error(json.message || "Could not load research run.");
    }
    setSnapshot(json.snapshot);
    setError(null);
    return json.snapshot;
  }, [runId]);

  useEffect(() => {
    let cancelled = false;
    let channel: ReturnType<ReturnType<typeof createClient>["channel"]> | null =
      null;

    async function boot() {
      try {
        setConnection("connecting");
        await loadSnapshot();
        if (cancelled) return;

        const supabase = createClient();
        channel = supabase
          .channel(`research-run-${runId}`)
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "research_runs",
              filter: `id=eq.${runId}`,
            },
            () => {
              void loadSnapshot();
            },
          )
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "research_events",
              filter: `research_run_id=eq.${runId}`,
            },
            () => {
              void loadSnapshot();
            },
          )
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "live_candidates",
              filter: `research_run_id=eq.${runId}`,
            },
            () => {
              void loadSnapshot();
            },
          )
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "research_sources",
              filter: `research_run_id=eq.${runId}`,
            },
            () => {
              void loadSnapshot();
            },
          )
          .subscribe((status) => {
            if (status === "SUBSCRIBED") {
              setConnection("connected");
            } else if (status === "CHANNEL_ERROR") {
              setConnection("error");
            } else if (status === "TIMED_OUT") {
              setConnection("reconnecting");
              void loadSnapshot();
            }
          });
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load run");
          setConnection("error");
        }
      }
    }

    void boot();

    return () => {
      cancelled = true;
      if (channel) {
        const supabase = createClient();
        void supabase.removeChannel(channel);
      }
    };
  }, [loadSnapshot, runId]);

  const refetch = useCallback(async () => {
    setConnection("reconnecting");
    try {
      await loadSnapshot();
      setConnection("connected");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to refresh");
      setConnection("error");
    }
  }, [loadSnapshot]);

  const resume = useCallback(async () => {
    const response = await fetch(`/api/research/${runId}`, { method: "POST" });
    const json = (await response.json()) as {
      ok: boolean;
      message?: string;
      snapshot?: ResearchRunSnapshot;
    };
    if (!response.ok || !json.ok) {
      throw new Error(json.message || "Resume failed");
    }
    if (json.snapshot) {
      setSnapshot(json.snapshot);
    } else {
      await loadSnapshot();
    }
  }, [loadSnapshot, runId]);

  return { snapshot, connection, error, refetch, resume };
}
