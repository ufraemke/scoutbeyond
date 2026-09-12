"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { AppHeader } from "@/components/layout/app-header";
import {
  DEMO_BRIEF,
  DEMO_CANDIDATES,
  DEMO_CHALLENGE,
  DEMO_MODE_LABEL,
  type DemoCandidate,
} from "@/data/demo/tank-cleaning";
import { ensureAnonymousSession } from "@/lib/supabase/anonymous";
import type { CandidateCategory } from "@/types";

type ResearchMode = "live" | "prepared" | null;
type CandidateFilter = "all" | CandidateCategory;

export default function Home() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [maxStep, setMaxStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [rawInput, setRawInput] = useState("");
  const [mode, setMode] = useState<ResearchMode>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<CandidateFilter>("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([
    DEMO_CANDIDATES[0].id,
    DEMO_CANDIDATES[1].id,
  ]);
  const [modalCandidate, setModalCandidate] =
    useState<DemoCandidate | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const selectedCandidates = useMemo(
    () => DEMO_CANDIDATES.filter((candidate) => selectedIds.includes(candidate.id)),
    [selectedIds],
  );

  const filteredCandidates = useMemo(
    () =>
      activeTab === "all"
        ? DEMO_CANDIDATES
        : DEMO_CANDIDATES.filter(
            (candidate) => candidate.category === activeTab,
          ),
    [activeTab],
  );

  function goToStep(nextStep: number) {
    if (nextStep <= maxStep) {
      setStep(nextStep);
    }
  }

  function advanceTo(nextStep: number) {
    setStep(nextStep);
    setMaxStep((current) => Math.max(current, nextStep));
  }

  function handleLoadDemo() {
    setRawInput(DEMO_CHALLENGE);
    setMode("prepared");
    setError(null);
  }

  async function handleStartResearch() {
    setLoading(true);
    setError(null);

    if (mode === "prepared") {
      setLoading(false);
      advanceTo(2);
      return;
    }

    try {
      await ensureAnonymousSession();
      const response = await fetch("/api/research/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challenge: rawInput.trim() }),
      });
      const json = (await response.json()) as {
        ok: boolean;
        runId?: string;
        message?: string;
      };
      if (!response.ok || !json.ok || !json.runId) {
        throw new Error(
          json.message ||
            "Research could not be started. Check the service configuration and try again.",
        );
      }
      router.push(`/research/${json.runId}`);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Research could not be started.",
      );
      setLoading(false);
    }
  }

  function toggleCandidate(id: string) {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((candidateId) => candidateId !== id)
        : [...current, id],
    );
  }

  const exportMarkdown = `# ScoutBeyond Prepared Technology Brief

> Prepared demo dataset — not live web research.

## Problem Statement
${DEMO_BRIEF.problem}

## Shortlisted Physical Technology Solutions
${selectedCandidates
  .map(
    (candidate, index) => `### ${index + 1}. ${candidate.name}
- Category: ${candidate.category}
- Physical principle: ${candidate.principle}
- Why relevant: ${candidate.relevance}
- Main limitation: ${candidate.limitations.join("; ")}
`,
  )
  .join("\n")}`;

  async function copyExport() {
    await navigator.clipboard.writeText(exportMarkdown);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="min-h-screen bg-[#f7f7f5] text-[#161616]">
      <AppHeader
        currentStep={step}
        maxAvailableStep={maxStep}
        onStepChange={goToStep}
      />

      <main className="mx-auto max-w-[1200px] px-8 py-10">
        {mode === "prepared" && step > 1 ? <PreparedDemoBanner /> : null}

        {step === 1 ? (
          <section className="mx-auto max-w-[820px]">
            <p className="text-[12px] font-bold uppercase tracking-wider text-[#176b87]">
              Step 1 · Problem Intake
            </p>
            <h1 className="mt-2 text-[36px] font-semibold tracking-tight text-[#161616]">
              Find physical technologies beyond your industry.
            </h1>
            <p className="mt-3 text-[16px] leading-relaxed text-[#626262]">
              Describe your manufacturing or engineering challenge in plain
              language. ScoutBeyond extracts core physical mechanisms and scans
              adjacent sectors for transferable solutions.
            </p>

            <div className="mt-8 rounded-2xl border border-[#e5e5e2] bg-white p-6 shadow-sm">
              <label
                htmlFor="engineering-challenge"
                className="block text-[13px] font-semibold text-[#161616]"
              >
                Engineering Challenge
              </label>
              <textarea
                id="engineering-challenge"
                value={rawInput}
                onChange={(event) => {
                  setRawInput(event.target.value);
                  setMode(null);
                  setError(null);
                }}
                placeholder="e.g. What physical alternatives exist to conventional spray cleaning for industrial tanks while cutting water consumption and wash duration?"
                className="mt-3 h-36 w-full rounded-xl border border-[#d5d5d0] p-4 text-[14px] leading-relaxed text-[#161616] outline-none transition focus:border-[#176b87]"
              />

              {mode === "prepared" ? (
                <div className="mt-3 rounded-lg border border-[#f0d9a8] bg-[#fff9ea] px-3 py-2 text-[12px] text-[#916000]">
                  {DEMO_MODE_LABEL} selected. This path uses fixed data and is not
                  live web research.
                </div>
              ) : null}

              {error ? (
                <div className="mt-3 rounded-lg border border-[#f0d9a8] bg-[#fff9ea] px-3 py-2 text-[12px] text-[#916000]">
                  <span className="font-semibold">
                    Research could not be started.
                  </span>{" "}
                  {error}
                </div>
              ) : null}

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#f0f0ec] pt-4">
                <button
                  type="button"
                  onClick={handleLoadDemo}
                  className="rounded-lg border border-[#e5e5e2] bg-[#f7f7f5] px-3.5 py-2 text-[12px] font-semibold text-[#176b87] transition hover:bg-[#eaf3f6]"
                >
                  Load Tank Cleaning Demo Challenge
                </button>
                <button
                  type="button"
                  disabled={loading || rawInput.trim().length < 12}
                  onClick={() => void handleStartResearch()}
                  className="rounded-xl bg-[#161616] px-6 py-2.5 text-[14px] font-medium text-white transition hover:bg-[#333] disabled:opacity-50"
                >
                  {loading
                    ? "Starting research..."
                    : mode === "prepared"
                      ? "Open Prepared Research Brief →"
                      : "Start Research →"}
                </button>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-4">
              <GuidanceCard
                title="Cross-Industry Transfer"
                text="Identifies physical mechanisms used in adjacent technical domains."
              />
              <GuidanceCard
                title="Evidence Traceability"
                text="Keeps retrieved claims connected to their source and uncertainty."
              />
              <GuidanceCard
                title="Transparent Criteria"
                text="Compares solutions on performance, maturity, and retrofit potential."
              />
            </div>
          </section>
        ) : null}

        {step === 2 ? (
          <section>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[12px] font-bold uppercase tracking-wider text-[#176b87]">
                  Step 2 · Research Brief
                </p>
                <h1 className="mt-1 text-[30px] font-semibold tracking-tight">
                  Structured Engineering Intake
                </h1>
              </div>
              <button
                type="button"
                onClick={() => advanceTo(3)}
                className="rounded-xl bg-[#161616] px-5 py-2.5 text-[13px] font-medium text-white transition hover:bg-[#333]"
              >
                Explore Technology Landscape →
              </button>
            </div>

            <div className="mt-8 grid grid-cols-12 gap-6">
              <div className="col-span-8 space-y-6">
                <Surface>
                  <SectionLabel>Refined Engineering Problem Statement</SectionLabel>
                  <p className="mt-2 text-[17px] font-medium leading-snug">
                    {DEMO_BRIEF.problem}
                  </p>
                  <BriefList title="Goals" items={DEMO_BRIEF.goals} />
                  <BriefList
                    title="Operational Constraints"
                    items={DEMO_BRIEF.constraints}
                  />
                  <BriefList
                    title="Explicit Assumptions"
                    items={DEMO_BRIEF.assumptions}
                    warning
                  />
                </Surface>
                <Surface>
                  <SectionLabel>Scouting Search Dimensions</SectionLabel>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    {DEMO_BRIEF.searchDimensions.map((dimension, index) => (
                      <div
                        key={dimension}
                        className="rounded-xl border border-[#e5e5e2] bg-[#f7f7f5] p-3 text-[13px] font-medium"
                      >
                        {index + 1}. {dimension}
                      </div>
                    ))}
                  </div>
                </Surface>
              </div>
              <div className="col-span-4">
                <Surface>
                  <SectionLabel>Search Boundaries</SectionLabel>
                  <div className="mt-4 space-y-4 text-[13px]">
                    <Definition
                      label="Primary Scope"
                      value="Industrial cleaning · manufacturing · tank operations"
                    />
                    <Definition
                      label="Adjacent Scope (Cross-Industry)"
                      value="Precision cleaning, robotics, sensing, and surface science"
                      accent
                    />
                    <Definition
                      label="Evidence"
                      value="Illustrative references in prepared mode; retrieved sources in live mode"
                    />
                  </div>
                  <div className="mt-6 rounded-xl border border-[#e5e5e2] bg-[#f7f7f5] p-4">
                    <SectionLabel>Known Uncertainty</SectionLabel>
                    <p className="mt-2 text-[12px] text-[#626262]">
                      {DEMO_BRIEF.unknowns.join("; ")}.
                    </p>
                  </div>
                </Surface>
              </div>
            </div>
          </section>
        ) : null}

        {step === 3 ? (
          <section>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[12px] font-bold uppercase tracking-wider text-[#176b87]">
                  Step 3 · Technology Discovery
                </p>
                <h1 className="mt-1 text-[30px] font-semibold tracking-tight">
                  Candidate Technology Landscape
                </h1>
              </div>
              <button
                type="button"
                disabled={selectedCandidates.length === 0}
                onClick={() => advanceTo(4)}
                className="rounded-xl bg-[#161616] px-5 py-2.5 text-[13px] font-medium text-white transition hover:bg-[#333] disabled:opacity-50"
              >
                Compare Selected ({selectedCandidates.length}) →
              </button>
            </div>

            <div className="mt-6 flex items-center justify-between rounded-xl border border-[#e5e5e2] bg-white px-6 py-4 shadow-sm">
              <div className="flex items-center gap-8">
                <Stat label="Prepared Candidates" value={DEMO_CANDIDATES.length} />
                <Stat
                  label="Source Mode"
                  value="Illustrative"
                  accent
                  compact
                />
                <div>
                  <SectionLabel>Dataset Status</SectionLabel>
                  <p className="text-[13px] font-medium text-[#916000]">
                    Prepared demo · not live verification
                  </p>
                </div>
              </div>
              <div className="flex gap-2 rounded-lg bg-[#f0f0ec] p-1">
                {(
                  ["all", "established", "adjacent", "exploratory"] as const
                ).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`rounded-md px-3 py-1 text-[12px] font-medium capitalize transition ${
                      activeTab === tab
                        ? "bg-white text-[#161616] shadow-sm"
                        : "text-[#626262]"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4">
              {filteredCandidates.map((candidate) => {
                const selected = selectedIds.includes(candidate.id);
                return (
                  <article
                    key={candidate.id}
                    onClick={() => toggleCandidate(candidate.id)}
                    className={`cursor-pointer rounded-2xl border p-5 transition-all ${
                      selected
                        ? "border-[#176b87] bg-white shadow-md ring-2 ring-[#eaf3f6]"
                        : "border-[#e5e5e2] bg-white hover:border-[#bbb]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <CategoryLabel category={candidate.category} />
                          <h3 className="text-[16px] font-bold">
                            {candidate.name}
                          </h3>
                        </div>
                        <p className="mt-2 text-[13px] leading-relaxed text-[#626262]">
                          {candidate.principle}
                        </p>
                      </div>
                      <input
                        aria-label={`Select ${candidate.name}`}
                        type="checkbox"
                        checked={selected}
                        onChange={() => undefined}
                        className="mt-1 h-5 w-5 rounded border-[#d5d5d0] text-[#176b87] focus:ring-[#176b87]"
                      />
                    </div>
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      <Meta>{candidate.maturityLabel}</Meta>
                      {candidate.benefits.slice(0, 2).map((benefit) => (
                        <Meta key={benefit}>{benefit}</Meta>
                      ))}
                    </div>
                    <div className="mt-4 flex items-center justify-between border-t border-[#f0f0ec] pt-3 text-[12px]">
                      <span className="font-semibold">
                        {candidate.sources.length} illustrative reference
                        {candidate.sources.length === 1 ? "" : "s"}
                      </span>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          setModalCandidate(candidate);
                        }}
                        className="font-medium text-[#176b87] hover:underline"
                      >
                        View references →
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ) : null}

        {step === 4 ? (
          <section>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[12px] font-bold uppercase tracking-wider text-[#176b87]">
                  Step 4 · Multi-Criteria Evaluation
                </p>
                <h1 className="mt-1 text-[30px] font-semibold tracking-tight">
                  Side-by-Side Engineering Comparison
                </h1>
              </div>
              <button
                type="button"
                onClick={() => advanceTo(5)}
                className="rounded-xl bg-[#161616] px-5 py-2.5 text-[13px] font-medium text-white transition hover:bg-[#333]"
              >
                Generate Final Shortlist & Brief →
              </button>
            </div>
            <div className="mt-8 overflow-hidden rounded-2xl border border-[#e5e5e2] bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-[13px]">
                  <thead>
                    <tr className="border-b border-[#e5e5e2] bg-[#f7f7f5]">
                      <th className="w-56 p-4 font-bold">
                        Criteria / Technology
                      </th>
                      {selectedCandidates.map((candidate) => (
                        <th key={candidate.id} className="p-4 font-bold">
                          {candidate.name}
                          <span className="block text-[10px] font-normal text-[#8a8a8a]">
                            {candidate.category.toUpperCase()}
                          </span>
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
                      label="Technology maturity"
                      candidates={selectedCandidates}
                      value={(candidate) => candidate.maturityLabel}
                    />
                    <ComparisonRow
                      label="Potential benefits"
                      candidates={selectedCandidates}
                      value={(candidate) => candidate.benefits.join("; ")}
                    />
                    <ComparisonRow
                      label="Key limitation"
                      candidates={selectedCandidates}
                      value={(candidate) => candidate.limitations.join("; ")}
                    />
                    <ComparisonRow
                      label="Evidence state"
                      candidates={selectedCandidates}
                      value={() => "Prepared illustrative reference — not verified"}
                    />
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        ) : null}

        {step === 5 ? (
          <section>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[12px] font-bold uppercase tracking-wider text-[#176b87]">
                  Step 5 · Recommendations & Next Steps
                </p>
                <h1 className="mt-1 text-[30px] font-semibold tracking-tight">
                  Shortlisted Technology Actions
                </h1>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowExportModal(true)}
                  className="rounded-xl border border-[#e5e5e2] bg-white px-5 py-2.5 text-[13px] font-semibold shadow-sm hover:bg-[#f7f7f5]"
                >
                  View Exportable Markdown Brief
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setMaxStep(1);
                    setMode(null);
                    setRawInput("");
                  }}
                  className="rounded-xl bg-[#161616] px-5 py-2.5 text-[13px] font-medium text-white hover:bg-[#333]"
                >
                  Start New Scout
                </button>
              </div>
            </div>
            <div className="mt-8 space-y-6">
              {selectedCandidates.map((candidate, index) => (
                <article
                  key={candidate.id}
                  className="rounded-2xl border border-[#e5e5e2] bg-white p-6 shadow-sm"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[12px] font-bold text-[#176b87]">
                        RANK #{index + 1} PREPARED CANDIDATE
                      </span>
                      <h3 className="mt-1 text-[20px] font-bold">
                        {candidate.name}
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setModalCandidate(candidate)}
                      className="rounded-lg border border-[#e5e5e2] px-3 py-1.5 text-[12px] font-medium text-[#176b87] hover:bg-[#eaf3f6]"
                    >
                      {candidate.sources.length} Illustrative Reference
                      {candidate.sources.length === 1 ? "" : "s"} →
                    </button>
                  </div>
                  <div className="mt-5 grid grid-cols-2 gap-6 border-t border-[#f0f0ec] pt-5">
                    <div>
                      <SectionLabel>Why Selected</SectionLabel>
                      <p className="mt-1 text-[13px] leading-relaxed">
                        {candidate.relevance}
                      </p>
                    </div>
                    <div>
                      <SectionLabel>Key Caveat / Uncertainty</SectionLabel>
                      <p className="mt-1 text-[13px] leading-relaxed text-[#916000]">
                        {candidate.limitations.join("; ")}
                      </p>
                    </div>
                  </div>
                  <div className="mt-5 border-t border-[#f0f0ec] pt-4">
                    <SectionLabel>
                      Immediate Next Engineering Investigations
                    </SectionLabel>
                    <ul className="mt-2 space-y-1.5 text-[13px]">
                      <li>▪ Validate the mechanism against the actual residue.</li>
                      <li>▪ Check compatibility with current tank equipment.</li>
                      <li>▪ Measure resource use in a controlled pilot.</li>
                    </ul>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}
      </main>

      {modalCandidate ? (
        <Modal title={modalCandidate.name} onClose={() => setModalCandidate(null)}>
          <div className="max-h-[60vh] space-y-4 overflow-y-auto p-6">
            {modalCandidate.sources.map((source) => (
              <article
                key={source.url}
                className="rounded-xl border border-[#e5e5e2] p-4 text-[13px]"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="rounded-full bg-[#f0f0ec] px-2.5 py-0.5 text-[10px] font-bold text-[#626262]">
                    ILLUSTRATIVE REFERENCE
                  </span>
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[12px] font-semibold text-[#176b87] hover:underline"
                  >
                    Open Document ↗
                  </a>
                </div>
                <h4 className="mt-2 font-bold">{source.title}</h4>
                <p className="mt-1 text-[12px] text-[#8a8a8a]">
                  {source.publisher}
                </p>
                <p className="mt-3 rounded-lg bg-[#fff9ea] p-2.5 text-[12px] text-[#916000]">
                  {source.note}
                </p>
              </article>
            ))}
          </div>
        </Modal>
      ) : null}

      {showExportModal ? (
        <Modal
          title="Executive Technology Dossier"
          onClose={() => setShowExportModal(false)}
          wide
        >
          <div className="max-h-[55vh] overflow-y-auto p-6">
            <pre className="whitespace-pre-wrap rounded-xl border border-[#e5e5e2] bg-[#f7f7f5] p-4 font-mono text-[12px] leading-relaxed">
              {exportMarkdown}
            </pre>
          </div>
          <div className="flex items-center justify-between border-t border-[#e5e5e2] px-6 py-3">
            <span className="text-[12px] text-[#626262]">
              Prepared demo export — not live research.
            </span>
            <button
              type="button"
              onClick={() => void copyExport()}
              className="rounded-xl bg-[#176b87] px-4 py-2 text-[12px] font-semibold text-white hover:bg-[#12566c]"
            >
              {copied ? "Copied to Clipboard" : "Copy Markdown"}
            </button>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}

function PreparedDemoBanner() {
  return (
    <div className="mb-6 rounded-xl border border-[#f0d9a8] bg-[#fff9ea] px-5 py-3 text-[13px] text-[#916000]">
      <span className="font-semibold">{DEMO_MODE_LABEL}.</span> Fixed data for
      UX walkthroughs; not live web research.
    </div>
  );
}

function GuidanceCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-xl border border-[#e5e5e2] bg-white p-4">
      <span className="text-[12px] font-bold">{title}</span>
      <p className="mt-1 text-[12px] text-[#626262]">{text}</p>
    </div>
  );
}

function Surface({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-[#e5e5e2] bg-white p-6 shadow-sm">
      {children}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#8a8a8a]">
      {children}
    </h3>
  );
}

function BriefList({
  title,
  items,
  warning = false,
}: {
  title: string;
  items: string[];
  warning?: boolean;
}) {
  return (
    <div className="mt-5 border-t border-[#f0f0ec] pt-5">
      <SectionLabel>{title}</SectionLabel>
      <div className="mt-2 flex flex-wrap gap-2">
        {items.map((item) => (
          <span
            key={item}
            className={`px-3 py-1 text-[12px] ${
              warning
                ? "rounded-lg bg-[#fff9ea] text-[#916000]"
                : "rounded-full bg-[#f0f0ec] text-[#161616]"
            }`}
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

function Definition({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div>
      <SectionLabel>{label}</SectionLabel>
      <p className={`mt-1 font-medium ${accent ? "text-[#176b87]" : ""}`}>
        {value}
      </p>
    </div>
  );
}

function Stat({
  label,
  value,
  accent = false,
  compact = false,
}: {
  label: string;
  value: string | number;
  accent?: boolean;
  compact?: boolean;
}) {
  return (
    <div>
      <SectionLabel>{label}</SectionLabel>
      <p
        className={`${compact ? "text-[16px]" : "text-[20px]"} font-bold ${
          accent ? "text-[#176b87]" : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function CategoryLabel({ category }: { category: CandidateCategory }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
        category === "established"
          ? "bg-[#edf8f1] text-[#23734d]"
          : category === "adjacent"
            ? "bg-[#eef2ff] text-[#315bd6]"
            : "bg-[#fff9ea] text-[#916000]"
      }`}
    >
      {category}
    </span>
  );
}

function Meta({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-md bg-[#f0f0ec] px-2 py-0.5 text-[11px] text-[#626262]">
      {children}
    </span>
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
      <td className="p-4 font-semibold text-[#626262]">{label}</td>
      {candidates.map((candidate) => (
        <td key={candidate.id} className="p-4 text-[12px] text-[#626262]">
          {value(candidate)}
        </td>
      ))}
    </tr>
  );
}

function Modal({
  title,
  onClose,
  children,
  wide = false,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div
        className={`max-h-[85vh] w-full overflow-hidden rounded-2xl border border-[#e5e5e2] bg-white shadow-xl ${
          wide ? "max-w-[760px]" : "max-w-[720px]"
        }`}
      >
        <div className="flex items-center justify-between border-b border-[#e5e5e2] px-6 py-4">
          <div>
            <span className="text-[11px] font-bold uppercase text-[#176b87]">
              ScoutBeyond
            </span>
            <h3 className="text-[17px] font-bold">{title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-[#8a8a8a] hover:bg-[#f0f0ec] hover:text-[#161616]"
          >
            Close
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
