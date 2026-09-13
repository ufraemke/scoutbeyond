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
    (source) =>
      source.status === "scraping" || source.status === "analysing",
  );
  const knownTotal = run.sourcesFound > 0;
  const finished = run.sourcesAnalysed + run.sourcesFailed;
  const connectionNeedsAttention =
    connection !== "connected" && connection !== "connecting";

  return (
    <section
      aria-live="polite"
      className="rounded-[12px] border border-[#e5e5e2] bg-white px-5 py-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#176b87]">
            Live research
          </p>
          <h2 className="mt-1 text-[20px] font-semibold tracking-tight">
            {phaseLabel(run.status)}
          </h2>
        </div>

        <div className="flex items-center gap-7 text-right">
          <Stat
            label="Sources analysed"
            value={
              knownTotal
                ? `${run.sourcesAnalysed} / ${run.sourcesFound}`
                : String(run.sourcesAnalysed)
            }
          />
          <Stat label="Candidates" value={String(run.candidatesCount)} />
        </div>
      </div>

      {knownTotal ? (
        <progress
          className="mt-4 h-1.5 w-full overflow-hidden rounded bg-[#e5e5e2]"
          max={run.sourcesFound}
          value={Math.min(finished, run.sourcesFound)}
          aria-label="Sources with completed or failed analysis"
        />
      ) : null}

      {reviewing ? (
        <p className="mt-3 truncate text-[12px] text-[#626262]">
          Currently reviewing:{" "}
          <span className="font-medium text-[#161616]">
            {reviewing.title || reviewing.url}
          </span>
        </p>
      ) : (
        <p className="mt-3 truncate text-[12px] text-[#626262]">
          {run.challenge}
        </p>
      )}

      {run.warnings.length > 0 ||
      run.sourcesFailed > 0 ||
      run.errorMessage ||
      connectionNeedsAttention ? (
        <div className="mt-4 rounded-[8px] border border-[#f0d9a8] bg-[#fff9ea] px-3 py-2 text-[12px] text-[#916000]">
          {connectionNeedsAttention ? (
            <p>Live connection: {connection}.</p>
          ) : null}
          {run.errorMessage ? <p>{run.errorMessage}</p> : null}
          {run.sourcesFailed > 0 ? (
            <p>
              {run.sourcesFailed} source
              {run.sourcesFailed === 1 ? "" : "s"} failed; partial results
              remain available.
            </p>
          ) : null}
          {run.warnings.map((warning) => (
            <p key={warning}>{warning}</p>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[#8a8a8a]">
        {label}
      </p>
      <p className="mt-0.5 text-[16px] font-semibold">{value}</p>
    </div>
  );
}
