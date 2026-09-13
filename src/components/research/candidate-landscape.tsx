"use client";

import type {
  CandidateCategory,
  LiveCandidateRecord,
  LiveEvidenceRecord,
} from "@/types";

const CATEGORIES: Array<{
  id: CandidateCategory;
  label: string;
  description: string;
}> = [
  {
    id: "established",
    label: "Established",
    description: "Proven for comparable industrial use.",
  },
  {
    id: "adjacent",
    label: "Adjacent",
    description: "Proven elsewhere and potentially transferable.",
  },
  {
    id: "exploratory",
    label: "Exploratory",
    description: "Emerging or not yet demonstrated in context.",
  },
];

export function CandidateLandscape({
  candidates,
  evidence,
  selectedIds,
  completed,
  onToggleCandidate,
  onCompare,
  onOpenCandidate,
}: {
  candidates: LiveCandidateRecord[];
  evidence: LiveEvidenceRecord[];
  selectedIds: string[];
  completed: boolean;
  onToggleCandidate: (candidateId: string) => void;
  onCompare: () => void;
  onOpenCandidate: (candidate: LiveCandidateRecord) => void;
}) {
  return (
    <section className="mt-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#8a8a8a]">
            Technology landscape
          </p>
          <h2 className="mt-1 text-[22px] font-semibold tracking-tight">
            {`${candidates.length} candidate ${
              candidates.length === 1 ? "approach" : "approaches"
            }`}
          </h2>
        </div>
        <p className="hidden text-[12px] text-[#626262] sm:block">
          Select at least two to compare.
        </p>
      </div>

      <div className="mt-5 overflow-hidden rounded-[14px] border border-[#e5e5e2] bg-white md:grid md:grid-cols-3">
        {CATEGORIES.map((category, index) => {
          const categoryCandidates = candidates.filter(
            (candidate) => candidate.category === category.id,
          );

          return (
            <section
              key={category.id}
              aria-labelledby={`category-${category.id}`}
              className={`p-4 sm:p-5 ${
                index > 0
                  ? "border-t border-[#e5e5e2] md:border-l md:border-t-0"
                  : ""
              }`}
            >
              <header className="min-h-[66px] border-b border-[#f0f0ec] pb-4">
                <h3
                  id={`category-${category.id}`}
                  className="text-[13px] font-bold uppercase tracking-[0.07em]"
                >
                  {category.label}
                </h3>
                <p className="mt-1 text-[11px] leading-relaxed text-[#8a8a8a]">
                  {category.description}
                </p>
              </header>

              <div className="mt-4 space-y-3">
                {categoryCandidates.length === 0 ? (
                  <p className="rounded-[9px] bg-[#f7f7f5] px-3 py-4 text-[12px] leading-relaxed text-[#8a8a8a]">
                    {completed
                      ? "No candidates were identified in this category."
                      : "No candidates yet. Live findings will appear here."}
                  </p>
                ) : null}

                {categoryCandidates.map((candidate) => {
                  const linked = evidence.filter(
                    (item) => item.candidateId === candidate.id,
                  );
                  const sourceCount = new Set(
                    linked.map((item) => item.sourceId),
                  ).size;
                  const selected = selectedIds.includes(candidate.id);

                  return (
                    <article
                      key={candidate.id}
                      className={`rounded-[10px] border bg-white transition ${
                        selected
                          ? "border-[#176b87]"
                          : "border-[#e5e5e2] hover:border-[#bbb]"
                      }`}
                    >
                      <div className="flex items-start gap-3 p-4">
                        <button
                          type="button"
                          onClick={() => onOpenCandidate(candidate)}
                          className="min-w-0 flex-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#176b87]"
                        >
                          <h4 className="text-[14px] font-semibold leading-snug text-[#161616]">
                            {candidate.name}
                          </h4>
                          <p className="mt-2 line-clamp-3 text-[12px] leading-relaxed text-[#626262]">
                            {candidate.principle}
                          </p>
                        </button>
                        <input
                          type="checkbox"
                          aria-label={`Select ${candidate.name} for comparison`}
                          checked={selected}
                          onChange={() => onToggleCandidate(candidate.id)}
                          className="mt-0.5 h-4 w-4 shrink-0 rounded border-[#d5d5d0] accent-[#176b87]"
                        />
                      </div>
                      <div className="flex items-center justify-between gap-2 border-t border-[#f0f0ec] px-4 py-2.5 text-[10px]">
                        <span className="min-w-0 truncate font-medium uppercase tracking-[0.04em] text-[#8a8a8a]">
                          {candidateOrigin(candidate)}
                        </span>
                        <button
                          type="button"
                          onClick={() => onOpenCandidate(candidate)}
                          className="shrink-0 font-semibold text-[#176b87] hover:underline"
                        >
                          {sourceCount} source{sourceCount === 1 ? "" : "s"} →
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      {selectedIds.length > 0 ? (
        <div className="sticky bottom-4 z-20 mt-6 flex items-center justify-between gap-4 rounded-[10px] bg-[#161616] px-5 py-3 text-white">
          <p className="text-[13px]">
            <span className="font-semibold">{selectedIds.length}</span>{" "}
            solution{selectedIds.length === 1 ? "" : "s"} selected
          </p>
          <button
            type="button"
            disabled={selectedIds.length < 2}
            onClick={onCompare}
            className="rounded-[8px] bg-white px-4 py-2 text-[12px] font-semibold text-[#161616] transition hover:bg-[#f0f0ec] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Compare selected →
          </button>
        </div>
      ) : null}
    </section>
  );
}

export function candidateOrigin(candidate: LiveCandidateRecord): string {
  const transfer = candidate.classificationEvidence?.transferRequired;
  if (transfer === "low") return "Direct application";
  if (candidate.industries.length > 0) {
    return `Beyond industry · ${candidate.industries[0]}`;
  }
  return transfer === "high" ? "Beyond industry" : "Transfer context";
}
