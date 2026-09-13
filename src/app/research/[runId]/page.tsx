"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useMemo, useState } from "react";
import { AppHeader } from "@/components/layout/app-header";
import { CandidateComparison } from "@/components/research/candidate-comparison";
import { CandidateDetailDialog } from "@/components/research/candidate-detail-dialog";
import { CandidateLandscape } from "@/components/research/candidate-landscape";
import { FinalResearchBrief } from "@/components/research/final-research-brief";
import { ResearchEventList } from "@/components/research/research-event-list";
import { ResearchProgress } from "@/components/research/research-progress";
import { useResearchRun } from "@/components/research/use-research-run";
import type { LiveCandidateRecord } from "@/types";

export default function ResearchRunPage({
  params,
}: {
  params: Promise<{ runId: string }>;
}) {
  const router = useRouter();
  const { runId } = use(params);
  const { snapshot, connection, error, refetch, resume } = useResearchRun(runId);
  const [view, setView] = useState<3 | 4 | 5>(3);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [shortlistedIds, setShortlistedIds] = useState<string[]>([]);
  const [activeCandidate, setActiveCandidate] =
    useState<LiveCandidateRecord | null>(null);
  const [resumeMessage, setResumeMessage] = useState<string | null>(null);

  const selectedCandidates = useMemo(
    () =>
      snapshot?.candidates.filter((candidate) =>
        selectedIds.includes(candidate.id),
      ) ?? [],
    [selectedIds, snapshot?.candidates],
  );
  const shortlistedCandidates = useMemo(
    () =>
      selectedCandidates.filter((candidate) =>
        shortlistedIds.includes(candidate.id),
      ),
    [selectedCandidates, shortlistedIds],
  );
  const preliminary = snapshot?.run.status !== "completed";

  function toggleCandidate(candidateId: string) {
    setSelectedIds((current) =>
      current.includes(candidateId)
        ? current.filter((id) => id !== candidateId)
        : [...current, candidateId],
    );
    setShortlistedIds((current) =>
      current.filter((id) => id !== candidateId),
    );
  }

  function toggleShortlist(candidateId: string) {
    setShortlistedIds((current) =>
      current.includes(candidateId)
        ? current.filter((id) => id !== candidateId)
        : [...current, candidateId],
    );
  }

  async function handleResume() {
    setResumeMessage("Scheduling stalled source analysis…");
    try {
      const result = await resume();
      setResumeMessage(
        result.scheduled > 0
          ? `${result.scheduled} source${result.scheduled === 1 ? "" : "s"} scheduled for recovery.`
          : "No stalled source analysis was found.",
      );
    } catch (caught) {
      setResumeMessage(
        caught instanceof Error ? caught.message : "Recovery could not start.",
      );
    }
  }

  return (
    <div className="min-h-screen bg-[#f7f7f5] text-[#161616]">
      <div className="print-hidden">
        <AppHeader currentStep={view} maxAvailableStep={view} />
      </div>

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
            {view === 3 ? (
              <>
                <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-[12px] font-bold uppercase tracking-wider text-[#176b87]">
                      Step 3 · Technology Discovery
                    </p>
                    <h1 className="mt-1 text-[30px] font-semibold tracking-tight">
                      Candidate Technology Landscape
                    </h1>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => void refetch()}
                      className="rounded-xl border border-[#e5e5e2] bg-white px-5 py-2.5 text-[13px] font-semibold shadow-sm hover:bg-[#f7f7f5]"
                    >
                      Refresh
                    </button>
                    {!["completed", "failed"].includes(snapshot.run.status) ? (
                      <button
                        type="button"
                        onClick={() => void handleResume()}
                        className="rounded-xl border border-[#e5e5e2] bg-white px-5 py-2.5 text-[13px] font-semibold shadow-sm hover:bg-[#f7f7f5]"
                      >
                        Resume stalled analysis
                      </button>
                    ) : null}
                    <Link
                      href="/"
                      className="rounded-xl bg-[#161616] px-5 py-2.5 text-[13px] font-medium text-white hover:bg-[#333]"
                    >
                      New Scan
                    </Link>
                  </div>
                </div>
                {resumeMessage ? (
                  <p
                    aria-live="polite"
                    className="mb-4 rounded-lg border border-[#e5e5e2] bg-white px-3 py-2 text-[12px] text-[#626262]"
                  >
                    {resumeMessage}
                  </p>
                ) : null}
                <ResearchProgress
                  run={snapshot.run}
                  sources={snapshot.sources}
                  connection={connection}
                />
                <CandidateLandscape
                  candidates={snapshot.candidates}
                  evidence={snapshot.evidence}
                  selectedIds={selectedIds}
                  onToggleCandidate={toggleCandidate}
                  onCompare={() => setView(4)}
                  onOpenCandidate={setActiveCandidate}
                />
                <ResearchEventList events={snapshot.events} />
              </>
            ) : null}

            {view === 4 ? (
              <CandidateComparison
                candidates={selectedCandidates}
                evidence={snapshot.evidence}
                problem={snapshot.run.structuredProblem}
                shortlistedIds={shortlistedIds}
                preliminary={preliminary}
                onToggleShortlist={toggleShortlist}
                onBack={() => setView(3)}
                onContinue={() => setView(5)}
              />
            ) : null}

            {view === 5 ? (
              <FinalResearchBrief
                run={snapshot.run}
                candidates={shortlistedCandidates}
                evidence={snapshot.evidence}
                preliminary={preliminary}
                onBack={() => setView(4)}
                onStartNew={() => router.push("/")}
              />
            ) : null}
          </>
        ) : null}
      </main>

      {activeCandidate && snapshot ? (
        <CandidateDetailDialog
          candidate={activeCandidate}
          evidence={snapshot.evidence}
          onClose={() => setActiveCandidate(null)}
        />
      ) : null}
    </div>
  );
}
