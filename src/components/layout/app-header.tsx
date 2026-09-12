"use client";

import Link from "next/link";

const STEPS = [
  { num: 1, label: "Intake" },
  { num: 2, label: "Brief" },
  { num: 3, label: "Landscape" },
  { num: 4, label: "Compare" },
  { num: 5, label: "Shortlist" },
] as const;

export function AppHeader({
  currentStep,
  maxAvailableStep = currentStep,
  onStepChange,
}: {
  currentStep: number;
  maxAvailableStep?: number;
  onStepChange?: (step: number) => void;
}) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[#e5e5e2] bg-white px-8">
      <div className="flex items-center gap-4">
        <Link
          href="/"
          className="text-[17px] font-bold tracking-tight text-[#161616]"
        >
          ScoutBeyond
        </Link>
        <span className="rounded-full bg-[#eaf3f6] px-2.5 py-0.5 text-[11px] font-semibold text-[#176b87]">
          Technology Scanner
        </span>
      </div>

      <nav aria-label="Research steps" className="flex items-center gap-2">
        {STEPS.map((step) => {
          const available = step.num <= maxAvailableStep;
          const className = `flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[12px] font-medium transition-all ${
            currentStep === step.num
              ? "bg-[#161616] text-white"
              : step.num < currentStep
                ? "border border-[#e5e5e2] bg-white text-[#161616]"
                : "text-[#8a8a8a]"
          }`;

          const content = (
            <>
              <span
                className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] ${
                  currentStep === step.num
                    ? "bg-white text-[#161616]"
                    : "bg-[#f0f0ec] text-[#626262]"
                }`}
              >
                {step.num}
              </span>
              <span>{step.label}</span>
            </>
          );

          if (onStepChange) {
            return (
              <button
                key={step.num}
                type="button"
                disabled={!available}
                onClick={() => onStepChange(step.num)}
                className={`${className} disabled:cursor-default`}
                aria-current={currentStep === step.num ? "step" : undefined}
              >
                {content}
              </button>
            );
          }

          return (
            <div
              key={step.num}
              className={className}
              aria-current={currentStep === step.num ? "step" : undefined}
            >
              {content}
            </div>
          );
        })}
      </nav>
    </header>
  );
}
