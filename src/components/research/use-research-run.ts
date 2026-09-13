"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { ResearchRunSnapshot } from "@/types";

type ConnectionState = "connecting" | "connected" | "reconnecting" | "error";

export function useResearchRun(runId: string) {
  const [snapshot, setSnapshot] = useState<ResearchRunSnapshot | null>(null);
  const [connection, setConnection] = useState<ConnectionState>("connecting");
  const [error, setError] = useState<string | null>(null);
  const inFlightSnapshot = useRef<Promise<ResearchRunSnapshot> | null>(null);

  const loadSnapshot = useCallback(async () => {
    if (inFlightSnapshot.current) {
      return inFlightSnapshot.current;
    }

    const request = (async () => {
      const response = await fetch(`/api/research/${runId}`, {
        cache: "no-store",
      });
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
    })();

    inFlightSnapshot.current = request;
    try {
      return await request;
    } finally {
      inFlightSnapshot.current = null;
    }
  }, [runId]);

  useEffect(() => {
    let cancelled = false;
    let channel: ReturnType<ReturnType<typeof createClient>["channel"]> | null =
      null;
    let refreshTimer: ReturnType<typeof setTimeout> | null = null;

    function scheduleSnapshotRefresh() {
      if (refreshTimer) clearTimeout(refreshTimer);
      refreshTimer = setTimeout(() => {
        if (!cancelled) void loadSnapshot();
      }, 250);
    }

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
            scheduleSnapshotRefresh,
          )
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "research_events",
              filter: `research_run_id=eq.${runId}`,
            },
            scheduleSnapshotRefresh,
          )
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "live_candidates",
              filter: `research_run_id=eq.${runId}`,
            },
            scheduleSnapshotRefresh,
          )
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "research_sources",
              filter: `research_run_id=eq.${runId}`,
            },
            scheduleSnapshotRefresh,
          )
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "live_evidence",
              filter: `research_run_id=eq.${runId}`,
            },
            scheduleSnapshotRefresh,
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
      if (refreshTimer) clearTimeout(refreshTimer);
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
    const response = await fetch(`/api/research/${runId}/resume`, {
      method: "POST",
    });
    const json = (await response.json()) as {
      ok: boolean;
      message?: string;
      scheduled?: number;
      remaining?: number;
    };
    if (!response.ok || !json.ok) {
      throw new Error(json.message || "Resume failed");
    }
    return {
      scheduled: json.scheduled ?? 0,
      remaining: json.remaining ?? 0,
    };
  }, [runId]);

  return { snapshot, connection, error, refetch, resume };
}
