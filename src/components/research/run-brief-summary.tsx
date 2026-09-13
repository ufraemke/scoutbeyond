import type { StructuredProblem } from "@/types";

export function RunBriefSummary({
  problem,
  onBack,
  onContinue,
}: {
  problem: StructuredProblem;
  onBack: () => void;
  onContinue: () => void;
}) {
  return (
    <section>
      <p className="text-[12px] font-bold uppercase tracking-wider text-[#176b87]">
        Step 2 · Research brief
      </p>
      <h1 className="mt-1 text-[30px] font-semibold tracking-tight">
        Research brief
      </h1>
      <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-[#626262]">
        This is the brief used to start the active research run. It is read-only
        because changing it would require a new scan.
      </p>

      <div className="mt-7 grid gap-5 md:grid-cols-[1.45fr_0.75fr]">
        <section className="rounded-[14px] border border-[#e5e5e2] bg-white px-5 py-1">
          <BriefRow label="Problem">
            <p className="text-[15px] font-medium leading-relaxed">
              {problem.statement}
            </p>
          </BriefRow>
          {problem.currentSolution ? (
            <BriefRow label="Current solution">
              <p className="text-[13px] leading-relaxed text-[#626262]">
                {problem.currentSolution}
              </p>
            </BriefRow>
          ) : null}
          <BriefRow label="Goals">
            <ChipList items={problem.goals} />
          </BriefRow>
          <BriefRow label="Constraints">
            <ChipList
              items={problem.constraints.map(
                (constraint) =>
                  `${constraint.importance === "must" ? "Must" : "Should"} · ${constraint.description}`,
              )}
            />
          </BriefRow>
          <BriefRow label="Assumptions">
            <ChipList
              items={problem.assumptions.map(
                (assumption) => assumption.description,
              )}
              warning
            />
          </BriefRow>
        </section>

        <aside className="rounded-[14px] border border-[#e5e5e2] bg-white p-5">
          <SmallLabel>Known unknowns</SmallLabel>
          <ul className="mt-3 space-y-2 text-[12px] leading-relaxed text-[#626262]">
            {problem.unknowns.map((unknown) => (
              <li key={unknown}>— {unknown}</li>
            ))}
          </ul>

          <div className="mt-6 border-t border-[#f0f0ec] pt-5">
            <SmallLabel>Search dimensions</SmallLabel>
            <ol className="mt-3 space-y-2 text-[12px] leading-relaxed">
              {problem.searchDimensions.map((dimension, index) => (
                <li key={dimension.id}>
                  <span className="text-[#8a8a8a]">{index + 1}.</span>{" "}
                  {dimension.name}
                </li>
              ))}
            </ol>
          </div>
        </aside>
      </div>

      <div className="mt-8 flex items-center justify-between border-t border-[#e5e5e2] pt-6">
        <button type="button" onClick={onBack} className={secondaryButtonClass}>
          ← Back to intake
        </button>
        <button
          type="button"
          onClick={onContinue}
          className={primaryButtonClass}
        >
          Return to landscape →
        </button>
      </div>
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
    <h2 className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#8a8a8a]">
      {children}
    </h2>
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

const primaryButtonClass =
  "rounded-[9px] bg-[#161616] px-5 py-2.5 text-[13px] font-semibold text-white hover:bg-[#333] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#176b87] focus-visible:ring-offset-2";

const secondaryButtonClass =
  "rounded-[9px] border border-[#d5d5d0] bg-white px-4 py-2.5 text-[13px] font-semibold hover:bg-[#f7f7f5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#176b87]";
