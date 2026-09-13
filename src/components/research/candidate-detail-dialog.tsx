"use client";

import { useEffect, useMemo, useRef } from "react";
import type { LiveCandidateRecord, LiveEvidenceRecord } from "@/types";

export function CandidateDetailDialog({
  candidate,
  evidence,
  onClose,
}: {
  candidate: LiveCandidateRecord;
  evidence: LiveEvidenceRecord[];
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const linked = useMemo(
    () => evidence.filter((item) => item.candidateId === candidate.id),
    [candidate.id, evidence],
  );
  const sourceGroups = useMemo(() => {
    const groups = new Map<string, LiveEvidenceRecord[]>();
    for (const item of linked) {
      const items = groups.get(item.sourceId) ?? [];
      items.push(item);
      groups.set(item.sourceId, items);
    }
    return [...groups.values()];
  }, [linked]);

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    closeButtonRef.current?.focus();
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
      if (event.key !== "Tab" || !dialogRef.current) return;

      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], input:not([disabled]), [tabindex]:not([tabindex="-1"])',
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-6"
    >
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="candidate-detail-title"
        className="flex max-h-[88vh] w-full max-w-[820px] flex-col overflow-hidden rounded-[14px] bg-white"
      >
        <header className="flex items-start justify-between gap-5 border-b border-[#e5e5e2] px-6 py-5">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#176b87]">
              {candidate.category} · {candidate.verificationState}
            </p>
            <h2
              id="candidate-detail-title"
              className="mt-1 text-[24px] font-semibold tracking-tight"
            >
              {candidate.name}
            </h2>
            <p className="mt-2 text-[13px] leading-relaxed text-[#626262]">
              {candidate.principle}
            </p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[#e5e5e2] px-3 py-1.5 text-[12px] font-semibold hover:bg-[#f7f7f5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#176b87]"
          >
            Close
          </button>
        </header>

        <div className="overflow-y-auto p-6">
          <div className="grid gap-5 md:grid-cols-2">
            <DetailSection title="Why it may work">
              {candidate.relevance || candidate.summary || "Not assessed yet."}
            </DetailSection>
            <DetailSection title="Main limitation">
              {candidate.limitations[0] || "Not documented yet."}
            </DetailSection>
            <DetailSection title="Maturity and applicability">
              {formatMaturity(candidate)} · {formatApplicability(candidate)}
            </DetailSection>
            <DetailSection title="Evidence strength">
              {candidate.evidenceQuality ?? "Not assessed yet."}
            </DetailSection>
          </div>

          <details className="mt-6 border-t border-[#e5e5e2] pt-5">
            <summary className="cursor-pointer text-[12px] font-semibold text-[#176b87]">
              Additional technical details
            </summary>
            <div className="mt-4 grid gap-5 md:grid-cols-2">
              <DetailList title="Potential benefits" items={candidate.benefits} />
              <DetailList
                title="Other limitations"
                items={candidate.limitations.slice(1)}
              />
              <DetailList
                title="Uncertainties"
                items={candidate.uncertainties.map((item) =>
                  typeof item === "string"
                    ? item
                    : item.description || "Unresolved uncertainty",
                )}
              />
            </div>
          </details>

          <section className="mt-7 border-t border-[#e5e5e2] pt-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#8a8a8a]">
                  Evidence
                </p>
                <h3 className="mt-1 text-[18px] font-semibold">
                  {sourceGroups.length} source
                  {sourceGroups.length === 1 ? "" : "s"} · {linked.length}{" "}
                  finding{linked.length === 1 ? "" : "s"}
                </h3>
              </div>
              <p className="text-[12px] text-[#626262]">
                Evidence strength: {candidate.evidenceQuality ?? "not assessed"}
              </p>
            </div>

            {sourceGroups.length === 0 ? (
              <p className="mt-4 rounded-xl border border-[#e5e5e2] bg-[#f7f7f5] p-4 text-[13px] text-[#626262]">
                No source-backed findings are available yet.
              </p>
            ) : (
              <ol className="mt-4 space-y-4">
                {sourceGroups.map((items, index) => {
                  const source = items[0].source;
                  return (
                    <li
                      key={items[0].sourceId}
                      className="rounded-xl border border-[#e5e5e2] p-4"
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-[12px] font-semibold text-[#8a8a8a]">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <h4 className="font-semibold text-[#161616]">
                              {source?.title || source?.url || "Retrieved source"}
                            </h4>
                            {source?.url ? (
                              <a
                                href={source.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="shrink-0 text-[12px] font-semibold text-[#176b87] hover:underline"
                              >
                                Open source ↗
                              </a>
                            ) : null}
                          </div>
                          <ul className="mt-3 space-y-3">
                            {items.map((item) => (
                              <li
                                key={item.id}
                                className="border-l-2 border-[#e5e5e2] pl-3 text-[13px] leading-relaxed text-[#626262]"
                              >
                                <p className="font-medium text-[#161616]">
                                  {item.finding}
                                </p>
                                <p className="mt-1 text-[11px] uppercase tracking-wide text-[#8a8a8a]">
                                  {item.stance}
                                </p>
                                {item.exactExcerpt ? (
                                  <blockquote className="mt-2 text-[12px] italic">
                                    “{item.exactExcerpt}”
                                  </blockquote>
                                ) : null}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </section>
        </div>
      </section>
    </div>
  );
}

function DetailSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h3 className="text-[11px] font-bold uppercase tracking-[0.07em] text-[#8a8a8a]">
        {title}
      </h3>
      <p className="mt-2 text-[13px] leading-relaxed text-[#161616]">
        {children}
      </p>
    </section>
  );
}

function DetailList({ title, items }: { title: string; items: string[] }) {
  return (
    <section>
      <h3 className="text-[11px] font-bold uppercase tracking-[0.07em] text-[#8a8a8a]">
        {title}
      </h3>
      {items.length > 0 ? (
        <ul className="mt-2 space-y-1 text-[13px] text-[#161616]">
          {items.map((item) => (
            <li key={item}>• {item}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-[13px] text-[#8a8a8a]">Not documented yet.</p>
      )}
    </section>
  );
}

export function formatMaturity(candidate: LiveCandidateRecord): string {
  const maturity = candidate.maturity;
  if (!maturity || typeof maturity !== "object") return "Not assessed";
  const label = "label" in maturity ? maturity.label : undefined;
  return typeof label === "string" && label ? label : "Not assessed";
}

export function formatApplicability(candidate: LiveCandidateRecord): string {
  const applicability = candidate.applicability;
  if (!applicability || typeof applicability !== "object") return "uncertain";
  const rating = "rating" in applicability ? applicability.rating : undefined;
  return typeof rating === "string" && rating ? rating : "uncertain";
}
