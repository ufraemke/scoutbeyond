"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AppHeader } from "@/components/layout/app-header";
import { EditableResearchBrief } from "@/components/research/editable-research-brief";
import { ensureAnonymousSession } from "@/lib/supabase/anonymous";
import type { StructuredProblem } from "@/types";

type PendingAction = "refining" | "starting" | null;
type ReflectionMode = "gemini" | "fallback";
type ClarificationPrompt = {
  question: string;
  options: string[];
};

export default function Home() {
  const router = useRouter();
  const [started, setStarted] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [rawInput, setRawInput] = useState("");
  const [brief, setBrief] = useState<StructuredProblem | null>(null);
  const [editingBrief, setEditingBrief] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [reflectionMode, setReflectionMode] =
    useState<ReflectionMode | null>(null);
  const [reflectionWarning, setReflectionWarning] = useState<string | null>(
    null,
  );
  const [clarification, setClarification] =
    useState<ClarificationPrompt | null>(null);
  const [error, setError] = useState<string | null>(null);

  function returnToLanding() {
    setStarted(false);
    setStep(1);
    setError(null);
  }

  function updateInput(value: string) {
    setRawInput(value);
    setBrief(null);
    setReflectionMode(null);
    setReflectionWarning(null);
    setClarification(null);
    setError(null);
  }

  async function handleReviewBrief(challengeOverride?: string) {
    const challenge = (challengeOverride ?? rawInput).trim();
    const clarificationPrompt = buildClarificationPrompt(challenge);
    if (!challengeOverride && clarificationPrompt) {
      setClarification(clarificationPrompt);
      return;
    }

    setPendingAction("refining");
    setError(null);

    try {
      await ensureAnonymousSession();
      const response = await fetch("/api/research/refine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challenge }),
      });
      const json = (await response.json()) as {
        ok: boolean;
        problem?: StructuredProblem;
        generationMode?: ReflectionMode;
        warning?: string;
        message?: string;
      };

      if (!response.ok || !json.ok || !json.problem || !json.generationMode) {
        throw new Error(
          json.message ||
            "The research brief could not be prepared. Please try again.",
        );
      }

      setBrief(json.problem);
      setReflectionMode(json.generationMode);
      setReflectionWarning(json.warning ?? null);
      setEditingBrief(false);
      setStep(2);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "The research brief could not be prepared.",
      );
    } finally {
      setPendingAction(null);
    }
  }

  function applyClarification(answer: string) {
    const clarified = `${rawInput.trim()}. Primary objective: ${answer}.`;
    setRawInput(clarified);
    setClarification(null);
    void handleReviewBrief(clarified);
  }

  async function handleStartResearch() {
    if (!brief) return;

    setPendingAction("starting");
    setError(null);

    try {
      await ensureAnonymousSession();
      const structuredProblem = normalizeStructuredProblem(brief);
      const response = await fetch("/api/research/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challenge: rawInput.trim(),
          structuredProblem,
        }),
      });
      const json = (await response.json()) as {
        ok: boolean;
        runId?: string;
        message?: string;
      };

      if (!response.ok || !json.ok || !json.runId) {
        throw new Error(
          json.message ||
            "Research could not be started. Please check the service configuration and try again.",
        );
      }

      router.push(`/research/${json.runId}`);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Research could not be started.",
      );
      setPendingAction(null);
    }
  }

  if (!started) {
    return (
      <div className="min-h-screen bg-[#f7f7f5] text-[#161616]">
        <AppHeader currentStep={1} showSteps={false} />
        <main className="mx-auto flex min-h-[calc(100vh-64px)] max-w-[760px] items-center px-6 py-16 text-center">
          <div className="w-full">
            <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-[#176b87]">
              Cross-industry technology scouting
            </p>
            <h1 className="mt-4 text-[44px] font-semibold leading-[1.08] tracking-[-0.04em] sm:text-[54px]">
              Accelerate engineering discovery.
            </h1>
            <p className="mx-auto mt-5 max-w-[650px] text-[17px] leading-relaxed text-[#626262]">
              Define a physical engineering problem and discover transferable,
              evidence-backed solutions beyond your industry.
            </p>
            <div className="mt-9 flex flex-col items-center gap-4">
              <button
                type="button"
                onClick={() => setStarted(true)}
                className="cursor-pointer rounded-[9px] bg-[#161616] px-6 py-3 text-[14px] font-semibold text-white transition hover:bg-[#333] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#176b87] focus-visible:ring-offset-2"
              >
                Start a new scouting session →
              </button>
              <Link
                href="/walkthrough"
                className="text-[13px] font-semibold text-[#176b87] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#176b87]"
              >
                View prepared walkthrough
              </Link>
              <p className="text-[11px] text-[#8a8a8a]">
                The walkthrough uses clearly labeled illustrative data.
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f7f5] text-[#161616]">
      <AppHeader
        currentStep={step}
        maxAvailableStep={step}
        onHome={returnToLanding}
        onStepChange={(nextStep) => {
          if (nextStep === 1 || nextStep === 2) {
            setStep(nextStep);
            setError(null);
          }
        }}
      />

      <main className="mx-auto max-w-[1100px] px-6 py-12 sm:px-8">
        {step === 1 ? (
          <section className="mx-auto max-w-[820px]">
            <PageIntro
              eyebrow="Step 1 · Define"
              title="What physical engineering problem are you trying to solve?"
              description="Describe the challenge in your own words. You do not need to know the technical terminology."
            />

            <div className="mt-8 rounded-[14px] border border-[#e5e5e2] bg-white p-6">
              <label
                htmlFor="engineering-challenge"
                className="block text-[13px] font-semibold"
              >
                Engineering challenge
              </label>
              <textarea
                id="engineering-challenge"
                value={rawInput}
                onChange={(event) => updateInput(event.target.value)}
                placeholder="e.g. How can we clean industrial tanks with less water and shorter wash cycles?"
                className="mt-3 min-h-40 w-full resize-y rounded-[10px] border border-[#d5d5d0] p-4 text-[14px] leading-relaxed outline-none transition focus:border-[#176b87] focus:ring-2 focus:ring-[#eaf3f6]"
              />

              {error ? <InlineError title="Brief could not be prepared" text={error} /> : null}

              <div className="mt-5 flex items-end justify-between gap-4 border-t border-[#f0f0ec] pt-5">
                <button
                  type="button"
                  onClick={returnToLanding}
                  className={secondaryButtonClass}
                >
                  ← Back
                </button>
                <div className="text-right">
                  <button
                    type="button"
                    disabled={
                      pendingAction !== null || rawInput.trim().length < 12
                    }
                    aria-busy={pendingAction === "refining"}
                    onClick={() => void handleReviewBrief()}
                    className={primaryButtonClass}
                  >
                    {pendingAction === "refining" ? (
                      <span className="flex items-center gap-2">
                        <LoadingSpinner />
                        Preparing your brief…
                      </span>
                    ) : (
                      "Review brief →"
                    )}
                  </button>
                  {rawInput.trim().length < 12 ? (
                    <p className="mt-1.5 text-[11px] text-[#8a8a8a]">
                      Enter at least 12 characters to continue.
                    </p>
                  ) : pendingAction === "refining" ? (
                    <p className="mt-1.5 text-[11px] text-[#626262]">
                      No web research has started yet.
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {step === 2 && brief ? (
          <section>
            <PageIntro
              eyebrow="Step 2 · Refine"
              title="Review the research brief."
              description="Correct anything that should influence the search before live research begins."
            />

            {reflectionWarning ? (
              <div className="mt-5 rounded-[10px] border border-[#f0d9a8] bg-[#fff9ea] px-4 py-3 text-[12px] text-[#916000]">
                {reflectionWarning}
              </div>
            ) : null}

            <div className="mt-3 text-[11px] text-[#8a8a8a]">
              Brief source:{" "}
              {reflectionMode === "fallback"
                ? "local fallback"
                : "structured reflection"}
            </div>

            <div className="mt-7">
              {editingBrief ? (
                <EditableResearchBrief value={brief} onChange={setBrief} />
              ) : (
                <CompactBrief
                  brief={brief}
                  onEdit={() => setEditingBrief(true)}
                />
              )}
            </div>

            {editingBrief ? (
              <div className="mt-4 text-right">
                <button
                  type="button"
                  onClick={() => setEditingBrief(false)}
                  className={secondaryButtonClass}
                >
                  Finish editing
                </button>
              </div>
            ) : null}

            {pendingAction === "starting" ? (
              <div
                aria-live="polite"
                className="mt-6 rounded-[10px] border border-[#c9dfe7] bg-[#eef6f8] px-4 py-3 text-[13px] text-[#12566c]"
              >
                Preparing diversified searches and finding initial sources.
                Keep this tab open.
              </div>
            ) : null}

            {error ? <InlineError title="Research could not be started" text={error} /> : null}

            <div className="mt-8 flex items-center justify-between gap-4 border-t border-[#e5e5e2] pt-6">
              <button
                type="button"
                disabled={pendingAction !== null}
                onClick={() => {
                  setStep(1);
                  setError(null);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className={secondaryButtonClass}
              >
                ← Back
              </button>
              <button
                type="button"
                disabled={
                  pendingAction !== null || !isStructuredProblemReady(brief)
                }
                aria-busy={pendingAction === "starting"}
                onClick={() => void handleStartResearch()}
                className={primaryButtonClass}
              >
                {pendingAction === "starting" ? (
                  <span className="flex items-center gap-2">
                    <LoadingSpinner />
                    Starting research…
                  </span>
                ) : (
                  "Start live research →"
                )}
              </button>
            </div>
          </section>
        ) : null}
      </main>

      {clarification ? (
        <Dialog
          title="Please clarify your request"
          onClose={() => setClarification(null)}
        >
          <p className="text-[14px] leading-relaxed text-[#626262]">
            {clarification.question}
          </p>
          <div className="mt-4 space-y-2">
            {clarification.options.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => applyClarification(option)}
                className="block w-full rounded-[9px] border border-[#e5e5e2] bg-white px-4 py-3 text-left text-[13px] font-medium transition hover:border-[#176b87] hover:bg-[#eaf3f6]"
              >
                {option}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setClarification(null)}
            className="mt-4 text-[12px] font-semibold text-[#176b87] hover:underline"
          >
            None of these — revise the problem statement
          </button>
        </Dialog>
      ) : null}
    </div>
  );
}

function PageIntro({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-[0.09em] text-[#176b87]">
        {eyebrow}
      </p>
      <h1 className="mt-2 max-w-[820px] text-[34px] font-semibold leading-tight tracking-[-0.03em]">
        {title}
      </h1>
      <p className="mt-3 max-w-[720px] text-[15px] leading-relaxed text-[#626262]">
        {description}
      </p>
    </div>
  );
}

function CompactBrief({
  brief,
  onEdit,
}: {
  brief: StructuredProblem;
  onEdit: () => void;
}) {
  return (
    <div className="grid gap-5 md:grid-cols-[1.45fr_0.75fr]">
      <section className="rounded-[14px] border border-[#e5e5e2] bg-white">
        <div className="flex items-center justify-between border-b border-[#e5e5e2] px-5 py-4">
          <h2 className="text-[14px] font-semibold">Research brief</h2>
          <button
            type="button"
            onClick={onEdit}
            className="rounded-[8px] border border-[#e5e5e2] px-3 py-1.5 text-[11px] font-semibold text-[#176b87] hover:bg-[#eaf3f6]"
          >
            Edit brief
          </button>
        </div>
        <div className="px-5 py-1">
          <BriefRow label="Problem">
            <p className="text-[15px] font-medium leading-relaxed">
              {brief.statement}
            </p>
            {brief.currentSolution ? (
              <details className="mt-3 text-[12px] text-[#626262]">
                <summary className="cursor-pointer font-semibold text-[#176b87]">
                  Current solution
                </summary>
                <p className="mt-2 leading-relaxed">{brief.currentSolution}</p>
              </details>
            ) : null}
          </BriefRow>
          <BriefRow label="Goals">
            <ChipList items={brief.goals} />
          </BriefRow>
          <BriefRow label="Constraints">
            <ChipList
              items={brief.constraints.map(
                (item) =>
                  `${item.importance === "must" ? "Must" : "Should"} · ${item.description}`,
              )}
            />
          </BriefRow>
          <BriefRow label="Assumptions">
            <ChipList
              items={brief.assumptions.map((item) => item.description)}
              warning
            />
          </BriefRow>
        </div>
      </section>

      <aside className="rounded-[14px] border border-[#e5e5e2] bg-white p-5">
        <h2 className="text-[14px] font-semibold">Search frame</h2>
        <div className="mt-5">
          <SmallLabel>Known unknowns</SmallLabel>
          <ul className="mt-2 space-y-2 text-[12px] leading-relaxed text-[#626262]">
            {brief.unknowns.map((item) => (
              <li key={item}>— {item}</li>
            ))}
          </ul>
        </div>
        <div className="mt-6 border-t border-[#f0f0ec] pt-5">
          <SmallLabel>Search dimensions</SmallLabel>
          <ol className="mt-2 space-y-2 text-[12px] leading-relaxed">
            {brief.searchDimensions.map((item, index) => (
              <li key={item.id}>
                <span className="text-[#8a8a8a]">{index + 1}.</span> {item.name}
              </li>
            ))}
          </ol>
        </div>
        <button
          type="button"
          onClick={onEdit}
          className="mt-6 text-[12px] font-semibold text-[#176b87] hover:underline"
        >
          Adjust research scope →
        </button>
      </aside>
    </div>
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
            warning
              ? "bg-[#fff9ea] text-[#916000]"
              : "bg-[#f0f0ec] text-[#333]"
          }`}
        >
          {item}
        </span>
      ))}
    </div>
  );
}

function InlineError({ title, text }: { title: string; text: string }) {
  return (
    <div
      role="alert"
      className="mt-4 rounded-[9px] border border-[#f0d9a8] bg-[#fff9ea] px-4 py-3 text-[12px] text-[#916000]"
    >
      <span className="font-semibold">{title}.</span> {text}
    </div>
  );
}

function Dialog({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const dialogRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    closeButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;

      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
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
  }, [onClose]);

  return (
    <div
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-5"
    >
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="clarification-title"
        className="w-full max-w-[560px] rounded-[14px] bg-white"
      >
        <header className="flex items-center justify-between border-b border-[#e5e5e2] px-5 py-4">
          <h2 id="clarification-title" className="text-[16px] font-semibold">
            {title}
          </h2>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="rounded-[7px] px-2 py-1 text-[12px] text-[#626262] hover:bg-[#f0f0ec]"
          >
            Close
          </button>
        </header>
        <div className="p-5">{children}</div>
      </section>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <span
      aria-hidden="true"
      className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-r-transparent"
    />
  );
}

function buildClarificationPrompt(
  challenge: string,
): ClarificationPrompt | null {
  const words = challenge.match(/[A-Za-zÀ-ÿ0-9-]+/g) ?? [];
  const hasSpecificOutcome =
    /\b(reduce|increase|prevent|remove|detect|measure|replace|clean|improve\s+(?:the\s+)?(?:accuracy|quality|yield|speed|efficiency))\b/i.test(
      challenge,
    );

  if (words.length >= 7 || hasSpecificOutcome) return null;

  return {
    question:
      "Which outcome is most important? This helps focus the search on the right physical principles.",
    options: [
      "Reduce resource or energy consumption",
      "Reduce processing or cycle time",
      "Improve technical performance or reliability",
    ],
  };
}

function normalizeStructuredProblem(
  problem: StructuredProblem,
): StructuredProblem {
  const cleanStrings = (items: string[]) =>
    items.map((item) => item.trim()).filter(Boolean);

  return {
    ...problem,
    statement: problem.statement.trim(),
    currentSolution: problem.currentSolution?.trim() || undefined,
    goals: cleanStrings(problem.goals),
    constraints: problem.constraints
      .map((constraint) => ({
        ...constraint,
        description: constraint.description.trim(),
      }))
      .filter((constraint) => constraint.description),
    assumptions: problem.assumptions
      .map((assumption) => ({
        ...assumption,
        description: assumption.description.trim(),
      }))
      .filter((assumption) => assumption.description),
    unknowns: cleanStrings(problem.unknowns),
    searchDimensions: problem.searchDimensions
      .map((dimension) => ({
        ...dimension,
        name: dimension.name.trim(),
        description: dimension.description?.trim() || undefined,
      }))
      .filter((dimension) => dimension.name),
  };
}

function isStructuredProblemReady(problem: StructuredProblem) {
  const normalized = normalizeStructuredProblem(problem);
  return (
    normalized.statement.length >= 12 &&
    normalized.searchDimensions.length >= 1
  );
}

const primaryButtonClass =
  "cursor-pointer rounded-[9px] bg-[#161616] px-5 py-2.5 text-[13px] font-semibold text-white transition hover:bg-[#333] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#176b87] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-45";

const secondaryButtonClass =
  "cursor-pointer rounded-[9px] border border-[#d5d5d0] bg-white px-4 py-2.5 text-[13px] font-semibold text-[#161616] transition hover:border-[#8a8a8a] hover:bg-[#f7f7f5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#176b87] disabled:cursor-not-allowed disabled:opacity-45";
