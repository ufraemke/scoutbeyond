import "server-only";

import {
  assessApplicability,
  assessEvidenceQuality,
  calculateConfidence,
  classifyCandidate,
} from "@/lib/research";
import { extractFromSource } from "@/lib/gemini/extract-from-source";
import { createAdminClient } from "@/lib/supabase/admin";
import { mergeExtractedCandidate } from "./candidate-merging";
import {
  appendResearchEvent,
  getResearchRun,
  getSource,
  refreshRunCounters,
  updateSource,
} from "./repository";
import { assertTransition } from "./progress";

export async function analyseSource(sourceId: string): Promise<void> {
  const source = await getSource(sourceId);
  if (!source) {
    return;
  }
  if (!source.markdown) {
    await updateSource(sourceId, {
      analysis_status: "skipped",
      status: source.status === "failed" ? "failed" : "scraped",
      error_message: source.errorMessage ?? "No scraped content available.",
    });
    return;
  }

  const claimed = await updateSource(sourceId, {
    analysis_status: "running",
    status: "analysing",
  });

  const run = await getResearchRun(claimed.researchRunId);
  if (!run) {
    return;
  }

  try {
    if (run.status === "scraping" || run.status === "analysing") {
      // keep / move into analysing
      if (run.status === "scraping") {
        assertTransition(run.status, "analysing");
        const { updateResearchRun } = await import("./repository");
        await updateResearchRun(run.id, {
          status: "analysing",
          phase: "analysing",
        });
      }
    }

    const extraction = await extractFromSource({
      problemStatement: run.structuredProblem.statement,
      title: source.title,
      url: source.url,
      markdown: source.markdown,
    });

    if (!extraction.inScope || extraction.candidates.length === 0) {
      await updateSource(sourceId, {
        analysis_status: "completed",
        status: "analysed",
        analysed_at: new Date().toISOString(),
      });
      await appendResearchEvent({
        researchRunId: run.id,
        eventType: "source_analysed_empty",
        message: `Reviewed ${source.title || source.url} — no in-scope candidates.`,
        payload: { sourceId },
      });
      await refreshRunCounters(run.id);
      return;
    }

    for (const candidate of extraction.candidates) {
      const category = classifyCandidate(candidate.classificationFacts);
      const confidence = calculateConfidence(candidate.evidenceFacts);
      const applicabilityRating = assessApplicability(candidate.applicabilityFacts);
      const evidenceQuality = assessEvidenceQuality(candidate.evidenceFacts);

      const merged = await mergeExtractedCandidate({
        researchRunId: run.id,
        sourceId: source.id,
        name: candidate.name,
        principle: candidate.principle,
        summary: candidate.summary,
        relevance: candidate.relevance,
        category,
        classificationEvidence: candidate.classificationFacts,
        applicability: {
          rating: applicabilityRating,
          rationale: `Deterministic applicability: ${applicabilityRating}`,
          demonstratedConditions: [],
          requiredConditions: [],
          transferGaps: [],
          integrationRisks: [],
          confidence,
        },
        confidence,
        evidenceQuality,
        benefits: candidate.benefits,
        limitations: candidate.limitations,
        uncertainties: candidate.uncertainties,
        industries: candidate.industries,
        physicalMechanisms: candidate.physicalMechanisms,
        maturity: candidate.maturityLabel
          ? { label: candidate.maturityLabel, confidence }
          : {},
        findings: candidate.findings,
      });

      await appendResearchEvent({
        researchRunId: run.id,
        eventType: "candidate_updated",
        message: `Candidate updated: ${merged.name} (${merged.category})`,
        payload: { candidateId: merged.id, sourceId: source.id },
      });
    }

    await updateSource(sourceId, {
      analysis_status: "completed",
      status: "analysed",
      analysed_at: new Date().toISOString(),
    });

    await appendResearchEvent({
      researchRunId: run.id,
      eventType: "source_analysed",
      message: `Analysed ${source.title || source.url}`,
      payload: { sourceId },
    });

    await refreshRunCounters(run.id);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Analysis failed";
    await updateSource(sourceId, {
      analysis_status: "failed",
      error_message: message,
    });
    await appendResearchEvent({
      researchRunId: claimed.researchRunId,
      eventType: "source_analysis_failed",
      message: `Analysis failed for ${source.title || source.url}`,
      payload: { sourceId, error: message },
    });
    await refreshRunCounters(claimed.researchRunId);
  }
}

export async function resumeStaleAnalysis(researchRunId: string): Promise<number> {
  const { listStaleAnalysisSources } = await import("./repository");
  const stale = await listStaleAnalysisSources(researchRunId);
  for (const source of stale) {
    await analyseSource(source.id);
  }
  return stale.length;
}

export async function countCandidates(researchRunId: string): Promise<number> {
  const supabase = createAdminClient();
  const { count } = await supabase
    .from("live_candidates")
    .select("id", { count: "exact", head: true })
    .eq("research_run_id", researchRunId);
  return count ?? 0;
}
