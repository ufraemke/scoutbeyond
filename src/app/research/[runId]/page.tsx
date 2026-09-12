"use client";

import Link from "next/link";
import { use } from "react";
import { AppHeader } from "@/components/layout/app-header";
import { CandidateLandscape } from "@/components/research/candidate-landscape";
import { ResearchEventList } from "@/components/research/research-event-list";
import { ResearchProgress } from "@/components/research/research-progress";
import { useResearchRun } from "@/components/research/use-research-run";

export default function ResearchRunPage({
  params,
}: {
  params: Promise<{ runId: string }>;
}) {
  const { runId } = use(params);
  const { snapshot, connection, error, refetch, resume } = useResearchRun(runId);
  const activeStep = snapshot
    ? ["queued", "searching"].includes(snapshot.run.status)
      ? 2
      : snapshot.run.status === "synthesising"
        ? 4
        : 3
    : 2;

  return (
    <div className="min-h-screen bg-[#f7f7f5] text-[#161616]">
      <AppHeader currentStep={activeStep} maxAvailableStep={activeStep} />

      <main className="mx-auto max-w-[1200px] px-8 py-10">
        {error ? (
          <div className="rounded-2xl border border-[#e5e5e2] bg-white p-6 shadow-sm">
            <h1 className="text-[24px] font-semibold">
              Research could not be loaded
            </h1>
            <p className="mt-2 text-[15px] text-[#626262]">{error}</p>
            <button
              type="button"
              onClick={() => void refetch()}
              className="mt-4 rounded-xl bg-[#161616] px-5 py-2.5 text-[13px] font-medium text-white"
            >
              Try again
            </button>
          </div>
        ) : null}

        {!error && !snapshot ? (
          <p className="text-[15px] text-[#626262]">
            Loading research run…
          </p>
        ) : null}

        {snapshot ? (
          <>
            <div className="mb-8 flex items-center justify-between">
              <div>
                <p className="text-[12px] font-bold uppercase tracking-wider text-[#176b87]">
                  Step {activeStep} ·{" "}
                  {activeStep === 2
                    ? "Research Brief"
                    : activeStep === 4
                      ? "Synthesis"
                      : "Technology Discovery"}
                </p>
                <h1 className="mt-1 text-[30px] font-semibold tracking-tight">
                  {activeStep === 2
                    ? "Structured Engineering Research"
                    : activeStep === 4
                      ? "Synthesising Research Findings"
                      : "Candidate Technology Landscape"}
                </h1>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => void refetch()}
                  className="rounded-xl border border-[#e5e5e2] bg-white px-5 py-2.5 text-[13px] font-semibold shadow-sm hover:bg-[#f7f7f5]"
                >
                  Refresh
                </button>
                <button
                  type="button"
                  onClick={() => void resume().catch(() => undefined)}
                  className="rounded-xl border border-[#e5e5e2] bg-white px-5 py-2.5 text-[13px] font-semibold shadow-sm hover:bg-[#f7f7f5]"
                >
                  Resume Analysis
                </button>
                <Link
                  href="/"
                  className="rounded-xl bg-[#161616] px-5 py-2.5 text-[13px] font-medium text-white hover:bg-[#333]"
                >
                  New Scan
                </Link>
              </div>
            </div>
            <ResearchProgress
              run={snapshot.run}
              sources={snapshot.sources}
              connection={connection}
            />
            <CandidateLandscape
              candidates={snapshot.candidates}
              evidence={snapshot.evidence}
            />
            <ResearchEventList events={snapshot.events} />
          </>
        ) : null}
      </main>
    </div>
  );
}
