import { phaseLabel } from "@/lib/research/progress";
import type { ResearchRunRecord, ResearchSourceRecord } from "@/types";

export function ResearchProgress({
  run,
  sources,
  connection,
}: {
  run: ResearchRunRecord;
  sources: ResearchSourceRecord[];
  connection: string;
}) {
  const reviewing = sources.find(
    (s) => s.status === "scraping" || s.status === "analysing",
  );
  const knownTotal = run.sourcesFound > 0;
  const reviewed = run.sourcesScraped;

  return (
    <section
      aria-live="polite"
      className="rounded-[12px] border border-[var(--border)] bg-[var(--surface)] px-6 py-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[var(--accent)]">
            Live research
          </p>
          <h2 className="mt-1 text-[24px] font-semibold tracking-tight text-[var(--text-primary)]">
            {phaseLabel(run.status)}
          </h2>
          <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-[var(--text-secondary)]">
            {run.challenge}
          </p>
        </div>
        <div className="text-right text-[13px] text-[var(--text-secondary)]">
          <p>
            Connection:{" "}
            <span className="font-medium text-[var(--text-primary)]">
              {connection}
            </span>
          </p>
          {run.errorMessage ? (
            <p className="mt-1 text-[#916000]">{run.errorMessage}</p>
          ) : null}
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <Stat
          label="Sources found"
          value={knownTotal ? String(run.sourcesFound) : "—"}
        />
        <Stat
          label="Sources reviewed"
          value={
            knownTotal
              ? `${reviewed} / ${run.sourcesFound}`
              : String(run.sourcesScraped)
          }
        />
        <Stat label="Candidates" value={String(run.candidatesCount)} />
      </div>

      {knownTotal ? (
        <div className="mt-4">
          <progress
            className="h-2 w-full overflow-hidden rounded bg-[var(--border)]"
            max={run.sourcesFound}
            value={Math.min(reviewed, run.sourcesFound)}
          />
        </div>
      ) : null}

      {run.warnings.length > 0 ? (
        <div className="mt-4 rounded-lg border border-[#f0d9a8] bg-[#fff9ea] px-3 py-2 text-[12px] text-[#916000]">
          <p className="font-semibold">Research continued with limitations:</p>
          <ul className="mt-1 list-disc space-y-1 pl-4">
            {run.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {reviewing ? (
        <p className="mt-4 text-[13px] text-[var(--text-secondary)]">
          Currently reviewing:{" "}
          <span className="font-medium text-[var(--text-primary)]">
            {reviewing.title || reviewing.url}
          </span>
        </p>
      ) : null}

      {run.sourcesFailed > 0 ? (
        <p className="mt-3 text-[13px] text-[var(--text-secondary)]">
          {run.sourcesFailed} source
          {run.sourcesFailed === 1 ? "" : "s"} failed and were skipped. Partial
          results remain available.
        </p>
      ) : null}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--text-tertiary)]">
        {label}
      </p>
      <p className="mt-1 text-[22px] font-semibold text-[var(--text-primary)]">
        {value}
      </p>
    </div>
  );
}
