"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { AppHeader } from "@/components/layout/app-header";
import {
  DEMO_BRIEF,
  DEMO_CANDIDATES,
  DEMO_CHALLENGE,
  type DemoCandidate,
} from "@/data/demo/tank-cleaning";
import type { CandidateCategory } from "@/types";

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

export default function PreparedWalkthrough() {
  const [step, setStep] = useState(1);
  const [maxStep, setMaxStep] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([
    DEMO_CANDIDATES[0].id,
    DEMO_CANDIDATES[1].id,
  ]);
  const [shortlistedIds, setShortlistedIds] = useState<string[]>([
    DEMO_CANDIDATES[0].id,
  ]);
  const [activeCandidate, setActiveCandidate] =
    useState<DemoCandidate | null>(null);
  const [copied, setCopied] = useState(false);
  const candidateDialogRef = useRef<HTMLElement>(null);
  const candidateCloseRef = useRef<HTMLButtonElement>(null);

  const selectedCandidates = useMemo(
    () =>
      DEMO_CANDIDATES.filter((candidate) =>
        selectedIds.includes(candidate.id),
      ),
    [selectedIds],
  );
  const shortlistedCandidates = useMemo(
    () =>
      selectedCandidates.filter((candidate) =>
        shortlistedIds.includes(candidate.id),
      ),
    [selectedCandidates, shortlistedIds],
  );

  useEffect(() => {
    if (!activeCandidate) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    candidateCloseRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setActiveCandidate(null);
        return;
      }
      if (event.key !== "Tab" || !candidateDialogRef.current) return;

      const focusable = Array.from(
        candidateDialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
        ),
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      previouslyFocused?.focus();
    };
  }, [activeCandidate]);

  function advance(nextStep: number) {
    setStep(nextStep);
    setMaxStep((current) => Math.max(current, nextStep));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function toggleCandidate(id: string) {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((candidateId) => candidateId !== id)
        : [...current, id],
    );
    setShortlistedIds((current) =>
      current.filter((candidateId) => candidateId !== id),
    );
  }

  function toggleShortlist(id: string) {
    setShortlistedIds((current) =>
      current.includes(id)
        ? current.filter((candidateId) => candidateId !== id)
        : [...current, id],
    );
  }

  const markdown = buildMarkdown(shortlistedCandidates);

  async function copyMarkdown() {
    await navigator.clipboard.writeText(markdown);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="min-h-screen bg-[#f7f7f5] text-[#161616]">
      <div className="print-hidden">
        <AppHeader
          currentStep={step}
          maxAvailableStep={maxStep}
          onStepChange={(nextStep) => {
            if (nextStep <= maxStep) advance(nextStep);
          }}
        />
      </div>

      <main className="mx-auto max-w-[1100px] px-6 py-10 sm:px-8">
        <div className="print-hidden mb-8 flex flex-wrap items-center justify-between gap-3 rounded-[9px] border border-[#f0d9a8] bg-[#fff9ea] px-4 py-2.5 text-[12px] text-[#916000]">
          <p>
            <span className="font-semibold">Prepared walkthrough.</span>{" "}
            Illustrative data only—this is not live research.
          </p>
          <Link href="/" className="font-semibold hover:underline">
            Return to live app
          </Link>
        </div>

        {step === 1 ? (
          <WalkthroughSection
            eyebrow="Step 1 · Define"
            title="What physical engineering problem are you trying to solve?"
            description="This prepared example demonstrates the interface without starting retrieval."
          >
            <div className="mt-8 rounded-[14px] border border-[#e5e5e2] bg-white p-6">
              <p className="text-[12px] font-semibold text-[#626262]">
                Engineering challenge
              </p>
              <p className="mt-3 rounded-[9px] border border-[#e5e5e2] bg-[#f7f7f5] p-4 text-[14px] leading-relaxed">
                {DEMO_CHALLENGE}
              </p>
              <BottomActions
                backHref="/"
                nextLabel="Review prepared brief →"
                onNext={() => advance(2)}
              />
            </div>
          </WalkthroughSection>
        ) : null}

        {step === 2 ? (
          <WalkthroughSection
            eyebrow="Step 2 · Refine"
            title="Review the research brief."
            description="The live app makes this brief editable before retrieval begins."
          >
            <div className="mt-7 grid gap-5 md:grid-cols-[1.45fr_0.75fr]">
              <section className="rounded-[14px] border border-[#e5e5e2] bg-white px-5 py-1">
                <BriefRow label="Problem">
                  <p className="text-[15px] font-medium leading-relaxed">
                    {DEMO_BRIEF.problem}
                  </p>
                </BriefRow>
                <BriefRow label="Goals">
                  <ChipList items={DEMO_BRIEF.goals} />
                </BriefRow>
                <BriefRow label="Constraints">
                  <ChipList items={DEMO_BRIEF.constraints} />
                </BriefRow>
                <BriefRow label="Assumptions">
                  <ChipList items={DEMO_BRIEF.assumptions} warning />
                </BriefRow>
              </section>
              <aside className="rounded-[14px] border border-[#e5e5e2] bg-white p-5">
                <SmallLabel>Known unknowns</SmallLabel>
                <ul className="mt-3 space-y-2 text-[12px] text-[#626262]">
                  {DEMO_BRIEF.unknowns.map((item) => (
                    <li key={item}>— {item}</li>
                  ))}
                </ul>
                <div className="mt-6 border-t border-[#f0f0ec] pt-5">
                  <SmallLabel>Search dimensions</SmallLabel>
                  <ol className="mt-3 space-y-2 text-[12px]">
                    {DEMO_BRIEF.searchDimensions.map((item, index) => (
                      <li key={item}>
                        <span className="text-[#8a8a8a]">{index + 1}.</span>{" "}
                        {item}
                      </li>
                    ))}
                  </ol>
                </div>
              </aside>
            </div>
            <BottomActions
              onBack={() => advance(1)}
              nextLabel="Open prepared landscape →"
              onNext={() => advance(3)}
            />
          </WalkthroughSection>
        ) : null}

        {step === 3 ? (
          <WalkthroughSection
            eyebrow="Step 3 · Discover"
            title="Candidate technology landscape"
            description={`${DEMO_CANDIDATES.length} illustrative approaches across three decision categories.`}
          >
            <div className="mt-7 overflow-hidden rounded-[14px] border border-[#e5e5e2] bg-white md:grid md:grid-cols-3">
              {CATEGORIES.map((category, index) => (
                <section
                  key={category.id}
                  className={`p-5 ${
                    index > 0
                      ? "border-t border-[#e5e5e2] md:border-l md:border-t-0"
                      : ""
                  }`}
                >
                  <header className="min-h-[66px] border-b border-[#f0f0ec] pb-4">
                    <h2 className="text-[13px] font-bold uppercase tracking-[0.07em]">
                      {category.label}
                    </h2>
                    <p className="mt-1 text-[11px] text-[#8a8a8a]">
                      {category.description}
                    </p>
                  </header>
                  <div className="mt-4 space-y-3">
                    {DEMO_CANDIDATES.filter(
                      (candidate) => candidate.category === category.id,
                    ).map((candidate) => {
                      const selected = selectedIds.includes(candidate.id);
                      return (
                        <article
                          key={candidate.id}
                          className={`rounded-[10px] border ${
                            selected
                              ? "border-[#176b87]"
                              : "border-[#e5e5e2]"
                          }`}
                        >
                          <div className="flex items-start gap-3 p-4">
                            <button
                              type="button"
                              onClick={() => setActiveCandidate(candidate)}
                              className="min-w-0 flex-1 text-left"
                            >
                              <h3 className="text-[14px] font-semibold leading-snug">
                                {candidate.name}
                              </h3>
                              <p className="mt-2 text-[12px] leading-relaxed text-[#626262]">
                                {candidate.principle}
                              </p>
                            </button>
                            <input
                              type="checkbox"
                              checked={selected}
                              onChange={() => toggleCandidate(candidate.id)}
                              aria-label={`Select ${candidate.name}`}
                              className="h-4 w-4 accent-[#176b87]"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => setActiveCandidate(candidate)}
                            className="flex w-full items-center justify-between border-t border-[#f0f0ec] px-4 py-2.5 text-[10px] font-semibold text-[#176b87]"
                          >
                            <span className="uppercase tracking-wide text-[#8a8a8a]">
                              {demoOrigin(candidate)}
                            </span>
                            <span>
                              {candidate.sources.length} reference
                              {candidate.sources.length === 1 ? "" : "s"} →
                            </span>
                          </button>
                        </article>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
            <div className="sticky bottom-4 mt-6 flex items-center justify-between gap-4 rounded-[10px] bg-[#161616] px-5 py-3 text-white">
              <div className="flex items-center gap-5">
                <button
                  type="button"
                  onClick={() => advance(2)}
                  className="text-[12px] font-semibold"
                >
                  ← Back
                </button>
                <p className="text-[13px]">
                  <strong>{selectedCandidates.length}</strong> solutions
                  selected
                </p>
              </div>
              <button
                type="button"
                disabled={selectedCandidates.length < 2}
                onClick={() => advance(4)}
                className="rounded-[8px] bg-white px-4 py-2 text-[12px] font-semibold text-[#161616] disabled:opacity-50"
              >
                Compare selected →
              </button>
            </div>
          </WalkthroughSection>
        ) : null}

        {step === 4 ? (
          <WalkthroughSection
            eyebrow="Step 4 · Compare"
            title="Which solutions are worth pursuing?"
            description="A compact comparison keeps the decision criteria visible without exposing every field."
          >
            <div className="mt-6 overflow-x-auto rounded-[14px] border border-[#e5e5e2] bg-white">
              <table className="w-full min-w-[760px] border-collapse text-left text-[12px]">
                <thead>
                  <tr className="border-b border-[#e5e5e2] bg-[#fafaf8]">
                    <th className="w-48 p-4 font-semibold">Criteria</th>
                    {selectedCandidates.map((candidate) => (
                      <th key={candidate.id} className="min-w-56 p-4 font-semibold">
                        {candidate.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f0f0ec]">
                  <ComparisonRow
                    label="Why relevant"
                    candidates={selectedCandidates}
                    value={(candidate) => candidate.relevance}
                  />
                  <ComparisonRow
                    label="Maturity"
                    candidates={selectedCandidates}
                    value={(candidate) => candidate.maturityLabel}
                  />
                  <ComparisonRow
                    label="Main benefit"
                    candidates={selectedCandidates}
                    value={(candidate) => candidate.benefits[0] || "Unknown"}
                  />
                  <ComparisonRow
                    label="Main limitation"
                    candidates={selectedCandidates}
                    value={(candidate) => candidate.limitations[0] || "Unknown"}
                  />
                  <ComparisonRow
                    label="Evidence"
                    candidates={selectedCandidates}
                    value={(candidate) =>
                      `${candidate.sources.length} illustrative reference${candidate.sources.length === 1 ? "" : "s"}`
                    }
                  />
                  <tr className="bg-[#fafaf8]">
                    <th className="p-4 font-semibold">Investigate further</th>
                    {selectedCandidates.map((candidate) => (
                      <td key={candidate.id} className="p-4">
                        <label className="inline-flex items-center gap-2 font-semibold">
                          <input
                            type="checkbox"
                            checked={shortlistedIds.includes(candidate.id)}
                            onChange={() => toggleShortlist(candidate.id)}
                            className="h-4 w-4 accent-[#176b87]"
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
            <div className="sticky bottom-4 mt-6 flex items-center justify-between rounded-[10px] bg-[#161616] px-5 py-3 text-white">
              <button
                type="button"
                onClick={() => advance(3)}
                className="text-[12px] font-semibold"
              >
                ← Back
              </button>
              <button
                type="button"
                disabled={shortlistedCandidates.length === 0}
                onClick={() => advance(5)}
                className="rounded-[8px] bg-white px-4 py-2 text-[12px] font-semibold text-[#161616] disabled:opacity-50"
              >
                Review & export →
              </button>
            </div>
          </WalkthroughSection>
        ) : null}

        {step === 5 ? (
          <section>
            <div className="print-hidden flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.09em] text-[#176b87]">
                  Step 5 · Final result
                </p>
                <h1 className="mt-2 text-[34px] font-semibold tracking-[-0.03em]">
                  Your scouting brief is ready.
                </h1>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => void copyMarkdown()}
                  className={secondaryButtonClass}
                >
                  {copied ? "Copied" : "Copy Markdown"}
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className={primaryButtonClass}
                >
                  Print / Save PDF
                </button>
              </div>
            </div>

            <article className="print-report mx-auto mt-8 max-w-[880px] rounded-[14px] border border-[#e5e5e2] bg-white p-8 sm:p-10">
              <header className="border-b-2 border-[#161616] pb-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#626262]">
                  ScoutBeyond Prepared Technology Brief
                </p>
                <h2 className="mt-2 text-[25px] font-semibold tracking-tight">
                  {DEMO_BRIEF.problem}
                </h2>
                <p className="mt-2 text-[11px] text-[#916000]">
                  Illustrative walkthrough · not live research
                </p>
              </header>

              <ReportSection title="Research goals">
                <ul className="space-y-1">
                  {DEMO_BRIEF.goals.map((goal) => (
                    <li key={goal}>• {goal}</li>
                  ))}
                </ul>
              </ReportSection>

              <ReportSection title="Shortlisted solutions">
                <div className="space-y-6">
                  {shortlistedCandidates.map((candidate, index) => (
                    <article key={candidate.id}>
                      <p className="text-[11px] font-semibold uppercase text-[#176b87]">
                        {index + 1}. {candidate.category}
                      </p>
                      <h3 className="mt-1 text-[18px] font-semibold">
                        {candidate.name}
                      </h3>
                      <p className="mt-2">{candidate.summary}</p>
                      <dl className="mt-3 grid gap-3 sm:grid-cols-2">
                        <ReportFact
                          label="Why it matters"
                          value={candidate.relevance}
                        />
                        <ReportFact
                          label="Main trade-off"
                          value={candidate.limitations[0] || "Unknown"}
                        />
                      </dl>
                    </article>
                  ))}
                </div>
              </ReportSection>

              <ReportSection title="Illustrative references">
                <ol className="space-y-2">
                  {shortlistedCandidates.flatMap((candidate) =>
                    candidate.sources.map((source) => (
                      <li key={`${candidate.id}-${source.url}`}>
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#176b87] underline"
                        >
                          {source.title}
                        </a>{" "}
                        · {source.publisher}
                      </li>
                    )),
                  )}
                </ol>
              </ReportSection>
            </article>

            <div className="print-hidden mt-7 flex items-center justify-between">
              <button
                type="button"
                onClick={() => advance(4)}
                className={secondaryButtonClass}
              >
                ← Back to compare
              </button>
              <Link href="/" className="text-[12px] font-semibold text-[#176b87]">
                Start live research →
              </Link>
            </div>
          </section>
        ) : null}
      </main>

      {activeCandidate ? (
        <div
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setActiveCandidate(null);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-5"
        >
          <section
            ref={candidateDialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="walkthrough-candidate-title"
            className="w-full max-w-[660px] rounded-[14px] bg-white"
          >
            <header className="flex items-start justify-between border-b border-[#e5e5e2] px-5 py-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-[#916000]">
                  Illustrative candidate
                </p>
                <h2
                  id="walkthrough-candidate-title"
                  className="mt-1 text-[20px] font-semibold"
                >
                  {activeCandidate.name}
                </h2>
              </div>
              <button
                ref={candidateCloseRef}
                type="button"
                onClick={() => setActiveCandidate(null)}
                className="text-[12px] font-semibold text-[#626262]"
              >
                Close
              </button>
            </header>
            <div className="space-y-5 p-5 text-[13px] leading-relaxed">
              <div>
                <SmallLabel>Why it may work</SmallLabel>
                <p className="mt-2">{activeCandidate.relevance}</p>
              </div>
              <div>
                <SmallLabel>Main limitation</SmallLabel>
                <p className="mt-2">
                  {activeCandidate.limitations[0] || "Not documented"}
                </p>
              </div>
              <div className="border-t border-[#e5e5e2] pt-5">
                <SmallLabel>Illustrative references</SmallLabel>
                <ul className="mt-2 space-y-2">
                  {activeCandidate.sources.map((source) => (
                    <li key={source.url}>
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-[#176b87] hover:underline"
                      >
                        {source.title} ↗
                      </a>
                      <p className="text-[11px] text-[#916000]">{source.note}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}

function WalkthroughSection({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <p className="text-[11px] font-bold uppercase tracking-[0.09em] text-[#176b87]">
        {eyebrow}
      </p>
      <h1 className="mt-2 text-[34px] font-semibold tracking-[-0.03em]">
        {title}
      </h1>
      <p className="mt-3 max-w-[720px] text-[15px] text-[#626262]">
        {description}
      </p>
      {children}
    </section>
  );
}

function BriefRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-b border-[#f0f0ec] py-4 last:border-b-0">
      <SmallLabel>{label}</SmallLabel>
      <div className="mt-2">{children}</div>
    </section>
  );
}

function SmallLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#8a8a8a]">
      {children}
    </h3>
  );
}

function ChipList({
  items,
  warning = false,
}: {
  items: string[];
  warning?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span
          key={item}
          className={`rounded-[7px] px-2.5 py-1 text-[12px] ${
            warning ? "bg-[#fff9ea] text-[#916000]" : "bg-[#f0f0ec]"
          }`}
        >
          {item}
        </span>
      ))}
    </div>
  );
}

function BottomActions({
  backHref,
  onBack,
  nextLabel,
  onNext,
}: {
  backHref?: string;
  onBack?: () => void;
  nextLabel: string;
  onNext: () => void;
}) {
  return (
    <div className="mt-7 flex items-center justify-between border-t border-[#e5e5e2] pt-5">
      {backHref ? (
        <Link href={backHref} className={secondaryButtonClass}>
          ← Back
        </Link>
      ) : (
        <button type="button" onClick={onBack} className={secondaryButtonClass}>
          ← Back
        </button>
      )}
      <button type="button" onClick={onNext} className={primaryButtonClass}>
        {nextLabel}
      </button>
    </div>
  );
}

function ComparisonRow({
  label,
  candidates,
  value,
}: {
  label: string;
  candidates: DemoCandidate[];
  value: (candidate: DemoCandidate) => string;
}) {
  return (
    <tr>
      <th className="p-4 font-semibold">{label}</th>
      {candidates.map((candidate) => (
        <td key={candidate.id} className="p-4 leading-relaxed text-[#626262]">
          {value(candidate)}
        </td>
      ))}
    </tr>
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
      <h3 className="border-b border-[#e5e5e2] pb-2 text-[11px] font-bold uppercase tracking-[0.08em] text-[#626262]">
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
      <dd className="mt-1">{value}</dd>
    </div>
  );
}

function demoOrigin(candidate: DemoCandidate) {
  if (candidate.category === "established") return "Direct application";
  if (candidate.category === "adjacent") return "Beyond industry";
  return "Emerging research";
}

function buildMarkdown(candidates: DemoCandidate[]) {
  return `# ScoutBeyond Prepared Technology Brief

> Illustrative walkthrough — not live research.

## Problem
${DEMO_BRIEF.problem}

## Shortlisted solutions
${candidates
  .map(
    (candidate, index) => `### ${index + 1}. ${candidate.name}
- Category: ${candidate.category}
- Why relevant: ${candidate.relevance}
- Main limitation: ${candidate.limitations[0] || "Unknown"}
`,
  )
  .join("\n")}`;
}

const primaryButtonClass =
  "rounded-[9px] bg-[#161616] px-5 py-2.5 text-[13px] font-semibold text-white hover:bg-[#333]";

const secondaryButtonClass =
  "rounded-[9px] border border-[#d5d5d0] bg-white px-4 py-2.5 text-[13px] font-semibold hover:bg-[#f7f7f5]";
