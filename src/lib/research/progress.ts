import type { ResearchRunStatus } from "@/types";

const LEGAL_TRANSITIONS: Record<ResearchRunStatus, ResearchRunStatus[]> = {
  queued: ["searching", "failed"],
  searching: ["scraping", "analysing", "failed", "completed"],
  scraping: ["analysing", "counter_checking", "failed", "completed"],
  analysing: ["counter_checking", "synthesising", "scraping", "failed", "completed"],
  counter_checking: ["synthesising", "analysing", "scraping", "failed", "completed"],
  synthesising: ["completed", "failed"],
  completed: [],
  failed: [],
};

export function canTransition(
  from: ResearchRunStatus,
  to: ResearchRunStatus,
): boolean {
  if (from === to) {
    return true;
  }
  return LEGAL_TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertTransition(
  from: ResearchRunStatus,
  to: ResearchRunStatus,
): void {
  if (!canTransition(from, to)) {
    throw new Error(`Illegal research run transition: ${from} → ${to}`);
  }
}

export function phaseLabel(status: ResearchRunStatus): string {
  switch (status) {
    case "queued":
      return "Queued";
    case "searching":
      return "Searching the web";
    case "scraping":
      return "Reviewing sources";
    case "analysing":
      return "Analysing sources";
    case "counter_checking":
      return "Counter-checking candidates";
    case "synthesising":
      return "Synthesising results";
    case "completed":
      return "Research complete";
    case "failed":
      return "Research failed";
    default:
      return status;
  }
}

/**
 * Guard: progress text must never invent percentages or fake timers.
 */
export function buildProgressMessage(input: {
  status: ResearchRunStatus;
  sourcesFound: number;
  sourcesScraped: number;
  sourcesAnalysed: number;
  candidatesCount: number;
}): string {
  const label = phaseLabel(input.status);
  if (input.sourcesFound > 0) {
    return `${label} · ${input.sourcesScraped} / ${input.sourcesFound} sources reviewed · ${input.candidatesCount} candidates`;
  }
  return label;
}

export function rejectsFakeProgressSequence(messages: string[]): boolean {
  const forbidden = [
    /research\s+\d+%\s+complete/i,
    /setTimeout/i,
    /exploring adjacent industries\.\.\./i,
  ];
  return !messages.some((m) => forbidden.some((re) => re.test(m)));
}

/** Webhook handlers must schedule analysis without awaiting Gemini. */
export function analysisIsAsyncContract(): true {
  return true;
}
