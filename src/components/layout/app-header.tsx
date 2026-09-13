"use client";

import Image from "next/image";
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
  onHome,
  showSteps = true,
}: {
  currentStep: number;
  maxAvailableStep?: number;
  onStepChange?: (step: number) => void;
  onHome?: () => void;
  showSteps?: boolean;
}) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-[#e5e5e2] bg-white px-6 sm:px-8">
      <Link
        href="/"
        onClick={onHome}
        className="flex shrink-0 items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#176b87] focus-visible:ring-offset-2"
        aria-label="ScoutBeyond home"
      >
        <Image
          src="/ScoutBeyond Logo.png"
          alt="ScoutBeyond"
          width={180}
          height={40}
          className="h-10 w-auto"
          priority
        />
      </Link>

      {showSteps ? (
        <nav
          aria-label="Research steps"
          className="flex min-w-0 items-center justify-end gap-1 overflow-x-auto sm:gap-2"
        >
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
                  aria-current={
                    currentStep === step.num ? "step" : undefined
                  }
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
      ) : null}
    </header>
  );
}
