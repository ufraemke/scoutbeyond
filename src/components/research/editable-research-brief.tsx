"use client";

import type {
  Assumption,
  Constraint,
  ResearchPreferences,
  SearchDimension,
  StructuredProblem,
} from "@/types";

type Props = {
  value: StructuredProblem;
  onChange: (next: StructuredProblem) => void;
};

const inputClass =
  "w-full rounded-lg border border-[#d5d5d0] bg-white px-3 py-2 text-[13px] text-[#161616] outline-none transition focus:border-[#176b87] focus:ring-2 focus:ring-[#eaf3f6]";
const secondaryButtonClass =
  "cursor-pointer rounded-lg border border-[#d5d5d0] bg-white px-3 py-2 text-[12px] font-semibold text-[#176b87] transition hover:border-[#176b87] hover:bg-[#eaf3f6] active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#176b87]";

function createId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

export function EditableResearchBrief({ value, onChange }: Props) {
  return (
    <div className="grid gap-6 lg:grid-cols-12">
      <div className="space-y-6 lg:col-span-8">
        <EditorSurface title="Refined Engineering Problem">
          <label className="block text-[12px] font-semibold text-[#626262]">
            Problem statement
            <textarea
              value={value.statement}
              onChange={(event) =>
                onChange({ ...value, statement: event.target.value })
              }
              className={`${inputClass} mt-2 min-h-24 resize-y text-[15px] leading-relaxed`}
            />
          </label>
          <label className="mt-4 block text-[12px] font-semibold text-[#626262]">
            Current solution or baseline
            <textarea
              value={value.currentSolution ?? ""}
              placeholder="Optional"
              onChange={(event) =>
                onChange({
                  ...value,
                  currentSolution: event.target.value || undefined,
                })
              }
              className={`${inputClass} mt-2 min-h-16 resize-y`}
            />
          </label>
        </EditorSurface>

        <StringListEditor
          title="Goals"
          values={value.goals}
          placeholder="Add a desired technical outcome"
          onChange={(goals) => onChange({ ...value, goals })}
        />

        <ConstraintEditor
          values={value.constraints}
          onChange={(constraints) => onChange({ ...value, constraints })}
        />

        <AssumptionEditor
          values={value.assumptions}
          onChange={(assumptions) => onChange({ ...value, assumptions })}
        />
      </div>

      <div className="space-y-6 lg:col-span-4">
        <StringListEditor
          title="Known Unknowns"
          values={value.unknowns}
          placeholder="Add missing information"
          onChange={(unknowns) => onChange({ ...value, unknowns })}
        />

        <SearchDimensionEditor
          values={value.searchDimensions}
          onChange={(searchDimensions) =>
            onChange({ ...value, searchDimensions })
          }
        />

        <ResearchPreferencesEditor
          value={
            value.researchPreferences ?? {
              industryFocus: "balanced",
              evidenceTypes: [],
            }
          }
          onChange={(researchPreferences) =>
            onChange({ ...value, researchPreferences })
          }
        />
      </div>
    </div>
  );
}

function EditorSurface({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-[#e5e5e2] bg-white p-6 shadow-sm">
      <h2 className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#8a8a8a]">
        {title}
      </h2>
      {description ? (
        <p className="mt-1 text-[12px] leading-relaxed text-[#626262]">
          {description}
        </p>
      ) : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function StringListEditor({
  title,
  values,
  placeholder,
  onChange,
}: {
  title: string;
  values: string[];
  placeholder: string;
  onChange: (values: string[]) => void;
}) {
  return (
    <EditorSurface title={title}>
      <div className="space-y-2">
        {values.map((item, index) => (
          <div key={`${title}-${index}`} className="flex items-center gap-2">
            <input
              aria-label={`${title} ${index + 1}`}
              value={item}
              onChange={(event) =>
                onChange(
                  values.map((value, itemIndex) =>
                    itemIndex === index ? event.target.value : value,
                  ),
                )
              }
              className={inputClass}
            />
            <RemoveButton
              label={`Remove ${title.toLowerCase()} item ${index + 1}`}
              onClick={() =>
                onChange(values.filter((_, itemIndex) => itemIndex !== index))
              }
            />
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => onChange([...values, ""])}
        className={`${secondaryButtonClass} mt-3`}
      >
        + {placeholder}
      </button>
    </EditorSurface>
  );
}

function ConstraintEditor({
  values,
  onChange,
}: {
  values: Constraint[];
  onChange: (values: Constraint[]) => void;
}) {
  return (
    <EditorSurface title="Operational Constraints">
      <div className="space-y-2">
        {values.map((constraint, index) => (
          <div
            key={constraint.id}
            className="grid grid-cols-1 items-center gap-2 sm:grid-cols-[1fr_96px_auto]"
          >
            <input
              aria-label={`Constraint ${index + 1}`}
              value={constraint.description}
              onChange={(event) =>
                onChange(
                  values.map((item) =>
                    item.id === constraint.id
                      ? { ...item, description: event.target.value }
                      : item,
                  ),
                )
              }
              className={inputClass}
            />
            <select
              aria-label={`Constraint ${index + 1} importance`}
              value={constraint.importance ?? "should"}
              onChange={(event) =>
                onChange(
                  values.map((item) =>
                    item.id === constraint.id
                      ? {
                          ...item,
                          importance: event.target.value as "must" | "should",
                        }
                      : item,
                  ),
                )
              }
              className={inputClass}
            >
              <option value="must">Must</option>
              <option value="should">Should</option>
            </select>
            <RemoveButton
              label={`Remove constraint ${index + 1}`}
              onClick={() =>
                onChange(values.filter((item) => item.id !== constraint.id))
              }
            />
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() =>
          onChange([
            ...values,
            {
              id: createId("constraint"),
              description: "",
              importance: "should",
            },
          ])
        }
        className={`${secondaryButtonClass} mt-3`}
      >
        + Add constraint
      </button>
    </EditorSurface>
  );
}

function AssumptionEditor({
  values,
  onChange,
}: {
  values: Assumption[];
  onChange: (values: Assumption[]) => void;
}) {
  return (
    <EditorSurface
      title="Explicit Assumptions"
      description="Confirm, correct, or remove assumptions before they influence the search."
    >
      <div className="space-y-3">
        {values.map((assumption, index) => (
          <div
            key={assumption.id}
            className="rounded-xl border border-[#f0d9a8] bg-[#fff9ea] p-3"
          >
            <div className="flex items-start gap-2">
              <textarea
                aria-label={`Assumption ${index + 1}`}
                value={assumption.description}
                onChange={(event) =>
                  onChange(
                    values.map((item) =>
                      item.id === assumption.id
                        ? {
                            ...item,
                            description: event.target.value,
                            origin: "user",
                            status: "confirmed",
                          }
                        : item,
                    ),
                  )
                }
                className={`${inputClass} min-h-16 resize-y`}
              />
              <RemoveButton
                label={`Remove assumption ${index + 1}`}
                onClick={() =>
                  onChange(values.filter((item) => item.id !== assumption.id))
                }
              />
            </div>
            <div className="mt-2 flex items-center justify-between gap-3">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-[#916000]">
                {assumption.origin === "ai" ? "AI assumption" : "User assumption"}
              </span>
              <select
                aria-label={`Assumption ${index + 1} status`}
                value={assumption.status}
                onChange={(event) =>
                  onChange(
                    values.map((item) =>
                      item.id === assumption.id
                        ? {
                            ...item,
                            status: event.target.value as Assumption["status"],
                          }
                        : item,
                    ),
                  )
                }
                className="rounded-lg border border-[#d5d5d0] bg-white px-2 py-1 text-[12px]"
              >
                <option value="unconfirmed">Unconfirmed</option>
                <option value="confirmed">Confirmed</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() =>
          onChange([
            ...values,
            {
              id: createId("assumption"),
              description: "",
              origin: "user",
              status: "confirmed",
            },
          ])
        }
        className={`${secondaryButtonClass} mt-3`}
      >
        + Add assumption
      </button>
    </EditorSurface>
  );
}

function SearchDimensionEditor({
  values,
  onChange,
}: {
  values: SearchDimension[];
  onChange: (values: SearchDimension[]) => void;
}) {
  return (
    <EditorSurface
      title="Search Dimensions"
      description="These guide direct, mechanism-first, adjacent, cross-industry, and emerging searches."
    >
      <div className="space-y-3">
        {values.map((dimension, index) => (
          <div
            key={dimension.id}
            className="rounded-xl border border-[#e5e5e2] bg-[#f7f7f5] p-3"
          >
            <div className="flex items-start gap-2">
              <div className="min-w-0 flex-1 space-y-2">
                <input
                  aria-label={`Search dimension ${index + 1} name`}
                  value={dimension.name}
                  onChange={(event) =>
                    onChange(
                      values.map((item) =>
                        item.id === dimension.id
                          ? { ...item, name: event.target.value }
                          : item,
                      ),
                    )
                  }
                  className={inputClass}
                />
                <textarea
                  aria-label={`Search dimension ${index + 1} description`}
                  value={dimension.description ?? ""}
                  placeholder="Scope or technical focus"
                  onChange={(event) =>
                    onChange(
                      values.map((item) =>
                        item.id === dimension.id
                          ? { ...item, description: event.target.value }
                          : item,
                      ),
                    )
                  }
                  className={`${inputClass} min-h-14 resize-y`}
                />
              </div>
              <RemoveButton
                label={`Remove search dimension ${index + 1}`}
                disabled={values.length === 1}
                onClick={() =>
                  onChange(values.filter((item) => item.id !== dimension.id))
                }
              />
            </div>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() =>
          onChange([
            ...values,
            {
              id: createId("dimension"),
              name: "",
              description: "",
            },
          ])
        }
        className={`${secondaryButtonClass} mt-3`}
      >
        + Add search dimension
      </button>
    </EditorSurface>
  );
}

const EVIDENCE_OPTIONS: Array<{
  value: ResearchPreferences["evidenceTypes"][number];
  label: string;
}> = [
  { value: "scientific_papers", label: "Scientific papers" },
  { value: "patents", label: "Patents" },
  { value: "industrial_cases", label: "Industrial cases" },
  { value: "technical_documentation", label: "Technical documentation" },
];

function ResearchPreferencesEditor({
  value,
  onChange,
}: {
  value: ResearchPreferences;
  onChange: (value: ResearchPreferences) => void;
}) {
  return (
    <EditorSurface
      title="Research Priorities"
      description="Priorities change emphasis while the search still covers every required dimension."
    >
      <fieldset>
        <legend className="text-[12px] font-semibold text-[#626262]">
          Industry focus
        </legend>
        <div className="mt-2 space-y-2">
          {(
            [
              ["balanced", "Balanced"],
              ["within", "Within your industry"],
              ["beyond", "Beyond your industry"],
            ] as const
          ).map(([option, label]) => (
            <label
              key={option}
              className="flex cursor-pointer items-center gap-2 text-[12px] text-[#161616]"
            >
              <input
                type="radio"
                name="industry-focus"
                value={option}
                checked={value.industryFocus === option}
                onChange={() =>
                  onChange({ ...value, industryFocus: option })
                }
                className="h-4 w-4 accent-[#176b87]"
              />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="mt-5 border-t border-[#f0f0ec] pt-4">
        <legend className="text-[12px] font-semibold text-[#626262]">
          Evidence to prioritize
        </legend>
        <div className="mt-2 space-y-2">
          {EVIDENCE_OPTIONS.map((option) => {
            const checked = value.evidenceTypes.includes(option.value);
            return (
              <label
                key={option.value}
                className="flex cursor-pointer items-center gap-2 text-[12px] text-[#161616]"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() =>
                    onChange({
                      ...value,
                      evidenceTypes: checked
                        ? value.evidenceTypes.filter(
                            (item) => item !== option.value,
                          )
                        : [...value.evidenceTypes, option.value],
                    })
                  }
                  className="h-4 w-4 rounded accent-[#176b87]"
                />
                {option.label}
              </label>
            );
          })}
        </div>
      </fieldset>
    </EditorSurface>
  );
}

function RemoveButton({
  label,
  disabled = false,
  onClick,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="cursor-pointer rounded-md px-2 py-1.5 text-[12px] font-medium text-[#8a8a8a] transition hover:bg-[#f0f0ec] hover:text-[#161616] active:translate-y-px disabled:cursor-not-allowed disabled:opacity-40"
    >
      Remove
    </button>
  );
}
