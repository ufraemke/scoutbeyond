"use client";

import {
  formatApplicability,
  formatMaturity,
} from "@/components/research/candidate-detail-dialog";
import type {
  LiveCandidateRecord,
  LiveEvidenceRecord,
  StructuredProblem,
} from "@/types";

export function CandidateComparison({
  candidates,
  evidence,
  problem,
  shortlistedIds,
  preliminary,
  onToggleShortlist,
  onBack,
  onContinue,
}: {
  candidates: LiveCandidateRecord[];
  evidence: LiveEvidenceRecord[];
  problem: StructuredProblem;
  shortlistedIds: string[];
  preliminary: boolean;
  onToggleShortlist: (candidateId: string) => void;
  onBack: () => void;
  onContinue: () => void;
}) {
  return (
    <section>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[12px] font-bold uppercase tracking-wider text-[#176b87]">
            Step 4 · Compare
          </p>
          <h1 className="mt-1 text-[30px] font-semibold tracking-tight">
            Which solutions are worth pursuing?
          </h1>
          <p className="mt-2 max-w-3xl text-[14px] text-[#626262]">
            Compare the evidence available for the goals and constraints in
            your research brief. Missing information is shown as unknown.
          </p>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="rounded-xl border border-[#d5d5d0] bg-white px-4 py-2.5 text-[13px] font-semibold hover:bg-[#f7f7f5]"
        >
          ← Back to landscape
        </button>
      </div>

      {preliminary ? (
        <div className="mt-5 rounded-xl border border-[#c9dfe7] bg-[#eef6f8] px-4 py-3 text-[13px] text-[#12566c]">
          <span className="font-semibold">Preliminary comparison.</span> Research
          is still running, so evidence and assessments may change.
        </div>
      ) : null}

      <div className="mt-6 rounded-xl border border-[#e5e5e2] bg-white p-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.07em] text-[#8a8a8a]">
          Decision context
        </p>
        <p className="mt-2 text-[14px] font-medium">{problem.statement}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {problem.goals.map((goal) => (
            <span
              key={goal}
              className="rounded-md bg-[#eaf3f6] px-2 py-1 text-[11px] text-[#12566c]"
            >
              Goal: {goal}
            </span>
          ))}
          {problem.constraints.map((constraint) => (
            <span
              key={constraint.id}
              className="rounded-md bg-[#f0f0ec] px-2 py-1 text-[11px] text-[#626262]"
            >
              {constraint.importance === "must" ? "Must" : "Constraint"}:{" "}
              {constraint.description}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-[#e5e5e2] bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] border-collapse text-left text-[13px]">
            <thead>
              <tr className="border-b border-[#e5e5e2] bg-[#f7f7f5]">
                <th className="w-52 p-4 font-semibold">Criteria / solution</th>
                {candidates.map((candidate) => (
                  <th key={candidate.id} className="min-w-60 p-4">
                    <span className="font-semibold">{candidate.name}</span>
                    <span className="mt-1 block text-[10px] font-medium uppercase text-[#8a8a8a]">
                      {candidate.category} · {candidate.verificationState}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f0ec]">
              <ComparisonRow
                label="Why relevant"
                candidates={candidates}
                value={(candidate) =>
                  candidate.relevance || candidate.summary || "Unknown"
                }
              />
              <ComparisonRow
                label="Applicability"
                candidates={candidates}
                value={(candidate) => formatApplicability(candidate)}
              />
              <ComparisonRow
                label="Maturity"
                candidates={candidates}
                value={(candidate) => formatMaturity(candidate)}
              />
              <ComparisonRow
                label="Potential benefits"
                candidates={candidates}
                value={(candidate) =>
                  candidate.benefits.length
                    ? candidate.benefits.join("; ")
                    : "Unknown"
                }
              />
              <ComparisonRow
                label="Limitations"
                candidates={candidates}
                value={(candidate) =>
                  candidate.limitations.length
                    ? candidate.limitations.join("; ")
                    : "Unknown"
                }
              />
              <ComparisonRow
                label="Uncertainty"
                candidates={candidates}
                value={(candidate) => formatUncertainties(candidate)}
              />
              <ComparisonRow
                label="Evidence"
                candidates={candidates}
                value={(candidate) => {
                  const linked = evidence.filter(
                    (item) => item.candidateId === candidate.id,
                  );
                  const sources = new Set(
                    linked.map((item) => item.sourceId),
                  ).size;
                  return `${candidate.evidenceQuality ?? "Not assessed"} · ${sources} source${sources === 1 ? "" : "s"} · ${linked.length} finding${linked.length === 1 ? "" : "s"}`;
                }}
              />
              <tr className="bg-[#fafaf8]">
                <th className="p-4 font-semibold">Investigate further</th>
                {candidates.map((candidate) => (
                  <td key={candidate.id} className="p-4">
                    <label className="inline-flex cursor-pointer items-center gap-2 font-semibold">
                      <input
                        type="checkbox"
                        checked={shortlistedIds.includes(candidate.id)}
                        onChange={() => onToggleShortlist(candidate.id)}
                        className="h-4 w-4 rounded accent-[#176b87]"
                      />
                      {shortlistedIds.includes(candidate.id)
                        ? "Selected"
                        : "Select"}
                    </label>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="sticky bottom-4 z-20 mt-6 flex items-center justify-between gap-4 rounded-xl bg-[#161616] px-5 py-3 text-white shadow-lg">
        <p className="text-[13px]">
          <span className="font-semibold">{shortlistedIds.length}</span>{" "}
          solution{shortlistedIds.length === 1 ? "" : "s"} selected for the
          final brief
        </p>
        <button
          type="button"
          disabled={shortlistedIds.length === 0}
          onClick={onContinue}
          className="rounded-lg bg-white px-4 py-2 text-[12px] font-semibold text-[#161616] hover:bg-[#f0f0ec] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Review & export →
        </button>
      </div>
    </section>
  );
}

function ComparisonRow({
  label,
  candidates,
  value,
}: {
  label: string;
  candidates: LiveCandidateRecord[];
  value: (candidate: LiveCandidateRecord) => string;
}) {
  return (
    <tr>
      <th className="p-4 font-semibold text-[#161616]">{label}</th>
      {candidates.map((candidate) => (
        <td
          key={candidate.id}
          className="p-4 align-top leading-relaxed text-[#626262]"
        >
          {value(candidate)}
        </td>
      ))}
    </tr>
  );
}

function formatUncertainties(candidate: LiveCandidateRecord): string {
  if (candidate.uncertainties.length === 0) return "Unknown";
  return candidate.uncertainties
    .map((item) => (typeof item === "string" ? item : item.description))
    .filter(Boolean)
    .join("; ");
}
