"use client";

import { useMemo, useState } from "react";
import {
  formatApplicability,
  formatMaturity,
} from "@/components/research/candidate-detail-dialog";
import type {
  LiveCandidateRecord,
  LiveEvidenceRecord,
  ResearchRunRecord,
} from "@/types";

export function FinalResearchBrief({
  run,
  candidates,
  evidence,
  preliminary,
  onBack,
  onStartNew,
}: {
  run: ResearchRunRecord;
  candidates: LiveCandidateRecord[];
  evidence: LiveEvidenceRecord[];
  preliminary: boolean;
  onBack: () => void;
  onStartNew: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const bibliography = useMemo(() => {
    const sources = new Map<
      string,
      NonNullable<LiveEvidenceRecord["source"]>
    >();
    const candidateIds = new Set(candidates.map((candidate) => candidate.id));
    for (const item of evidence) {
      if (candidateIds.has(item.candidateId) && item.source) {
        sources.set(item.sourceId, item.source);
      }
    }
    return [...sources.values()];
  }, [candidates, evidence]);

  const markdown = useMemo(
    () => buildMarkdown(run, candidates, evidence, bibliography),
    [run, candidates, evidence, bibliography],
  );

  async function copyMarkdown() {
    await navigator.clipboard.writeText(markdown);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <section>
      <div className="print-hidden flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[12px] font-bold uppercase tracking-wider text-[#176b87]">
            Step 5 · Final result
          </p>
          <h1 className="mt-1 text-[30px] font-semibold tracking-tight">
            Your scouting brief is ready
          </h1>
          <p className="mt-2 max-w-2xl text-[14px] text-[#626262]">
            There is no research-history screen yet. Export this brief now so
            you can keep and share the result.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onBack}
            className="rounded-xl border border-[#d5d5d0] bg-white px-4 py-2.5 text-[13px] font-semibold hover:bg-[#f7f7f5]"
          >
            ← Back to compare
          </button>
          <button
            type="button"
            onClick={() => void copyMarkdown()}
            className="rounded-xl border border-[#d5d5d0] bg-white px-4 py-2.5 text-[13px] font-semibold hover:bg-[#f7f7f5]"
          >
            {copied ? "Copied" : "Copy Markdown"}
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-xl bg-[#161616] px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-[#333]"
          >
            Print / Save PDF
          </button>
        </div>
      </div>

      {preliminary ? (
        <div className="print-hidden mt-5 rounded-xl border border-[#f0d9a8] bg-[#fff9ea] px-4 py-3 text-[13px] text-[#916000]">
          This is a preliminary brief. Research is still running and may add or
          change evidence.
        </div>
      ) : null}

      <article className="print-report mx-auto mt-8 max-w-[880px] rounded-[14px] border border-[#e5e5e2] bg-white p-8 sm:p-10">
        <header className="border-b-2 border-[#161616] pb-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#626262]">
            ScoutBeyond Technology Brief
          </p>
          <h2 className="mt-2 text-[26px] font-semibold tracking-tight">
            {run.structuredProblem.statement}
          </h2>
          <p className="mt-2 text-[12px] text-[#626262]">
            Generated {new Date().toLocaleDateString()} · {candidates.length}{" "}
            shortlisted solution{candidates.length === 1 ? "" : "s"} ·{" "}
            {bibliography.length} source{bibliography.length === 1 ? "" : "s"}
          </p>
        </header>

        <ReportSection title="Research goals">
          <ul className="space-y-1">
            {run.structuredProblem.goals.map((goal) => (
              <li key={goal}>• {goal}</li>
            ))}
          </ul>
        </ReportSection>

        <section className="mt-8">
          <h3 className="border-b border-[#e5e5e2] pb-2 text-[12px] font-bold uppercase tracking-[0.08em] text-[#626262]">
            Shortlisted solutions
          </h3>
          <div className="mt-4 space-y-6">
            {candidates.map((candidate, index) => {
              const linked = evidence.filter(
                (item) => item.candidateId === candidate.id,
              );
              return (
                <article key={candidate.id} className="break-inside-avoid">
                  <p className="text-[11px] font-semibold uppercase text-[#176b87]">
                    {index + 1}. {candidate.category} ·{" "}
                    {candidate.verificationState}
                  </p>
                  <h4 className="mt-1 text-[19px] font-semibold">
                    {candidate.name}
                  </h4>
                  <p className="mt-2 text-[13px] leading-relaxed text-[#333]">
                    {candidate.summary || candidate.principle}
                  </p>
                  <dl className="mt-3 grid gap-3 text-[12px] sm:grid-cols-2">
                    <ReportFact
                      label="Why relevant"
                      value={candidate.relevance || "Not assessed"}
                    />
                    <ReportFact
                      label="Maturity / applicability"
                      value={`${formatMaturity(candidate)} · ${formatApplicability(candidate)}`}
                    />
                    <ReportFact
                      label="Potential benefits"
                      value={candidate.benefits.join("; ") || "Unknown"}
                    />
                    <ReportFact
                      label="Key trade-offs and uncertainties"
                      value={
                        [
                          ...candidate.limitations,
                          ...candidate.uncertainties.map((item) =>
                            typeof item === "string"
                              ? item
                              : item.description,
                          ),
                        ].join("; ") || "Unknown"
                      }
                    />
                  </dl>
                  <p className="mt-3 text-[11px] text-[#626262]">
                    Evidence:{" "}
                    {new Set(linked.map((item) => item.sourceId)).size} sources ·{" "}
                    {linked.length} findings ·{" "}
                    {candidate.evidenceQuality ?? "quality not assessed"}
                  </p>
                </article>
              );
            })}
          </div>
        </section>

        <ReportSection title="Recommended next investigations">
          <ul className="space-y-1">
            <li>• Validate each mechanism against the actual residue and operating conditions.</li>
            <li>• Check compatibility with existing tank equipment and safety requirements.</li>
            <li>• Measure resource use and cleaning performance in a controlled pilot.</li>
          </ul>
        </ReportSection>

        <ReportSection title="Source bibliography">
          {bibliography.length > 0 ? (
            <ol className="space-y-2">
              {bibliography.map((source, index) => (
                <li key={source.id} className="break-inside-avoid">
                  [{index + 1}] {source.title || source.url}.{" "}
                  <a
                    href={source.url}
                    className="text-[#176b87] underline"
                  >
                    {source.url}
                  </a>
                </li>
              ))}
            </ol>
          ) : (
            <p>No source links are available for the selected solutions.</p>
          )}
        </ReportSection>
      </article>

      <div className="print-hidden mt-8 text-center">
        <button
          type="button"
          onClick={onStartNew}
          className="rounded-xl border border-[#d5d5d0] bg-white px-5 py-2.5 text-[13px] font-semibold hover:bg-[#f7f7f5]"
        >
          Start a new scouting session
        </button>
      </div>
    </section>
  );
}

function ReportSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-8 text-[13px] leading-relaxed text-[#333]">
      <h3 className="border-b border-[#e5e5e2] pb-2 text-[12px] font-bold uppercase tracking-[0.08em] text-[#626262]">
        {title}
      </h3>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function ReportFact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-semibold text-[#626262]">{label}</dt>
      <dd className="mt-1 leading-relaxed text-[#161616]">{value}</dd>
    </div>
  );
}

function buildMarkdown(
  run: ResearchRunRecord,
  candidates: LiveCandidateRecord[],
  evidence: LiveEvidenceRecord[],
  bibliography: NonNullable<LiveEvidenceRecord["source"]>[],
) {
  const solutionSections = candidates
    .map((candidate, index) => {
      const linked = evidence.filter(
        (item) => item.candidateId === candidate.id,
      );
      return `## ${index + 1}. ${candidate.name}

- Category: ${candidate.category}
- Verification: ${candidate.verificationState}
- Physical principle: ${candidate.principle}
- Why relevant: ${candidate.relevance || "Not assessed"}
- Maturity: ${formatMaturity(candidate)}
- Applicability: ${formatApplicability(candidate)}
- Potential benefits: ${candidate.benefits.join("; ") || "Unknown"}
- Limitations: ${candidate.limitations.join("; ") || "Unknown"}
- Evidence: ${new Set(linked.map((item) => item.sourceId)).size} sources, ${linked.length} findings
`;
    })
    .join("\n");

  const sources = bibliography
    .map(
      (source, index) =>
        `${index + 1}. [${source.title || source.url}](${source.url})`,
    )
    .join("\n");

  return `# ScoutBeyond Technology Brief

## Problem
${run.structuredProblem.statement}

## Goals
${run.structuredProblem.goals.map((goal) => `- ${goal}`).join("\n")}

${solutionSections}
## Recommended next investigations
- Validate each mechanism against the actual residue and operating conditions.
- Check compatibility with existing equipment and safety requirements.
- Measure resource use and cleaning performance in a controlled pilot.

## Sources
${sources || "No source links available."}
`;
}
