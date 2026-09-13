import "server-only";

import type {
  ApplicabilityAssessment,
  CandidateCategory,
  ClassificationInput,
  ConfidenceLevel,
  EvidenceQuality,
  EvidenceStance,
  LiveCandidateRecord,
} from "@/types";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizePrinciple } from "./url";
import { mapCandidate, refreshRunCounters } from "./repository";

export async function mergeExtractedCandidate(input: {
  researchRunId: string;
  sourceId: string;
  name: string;
  principle: string;
  summary: string;
  relevance: string;
  category: CandidateCategory;
  classificationEvidence: ClassificationInput;
  applicability: ApplicabilityAssessment;
  confidence: ConfidenceLevel;
  evidenceQuality: EvidenceQuality;
  benefits: string[];
  limitations: string[];
  uncertainties: string[];
  industries: string[];
  physicalMechanisms: string[];
  maturity: Record<string, unknown>;
  findings: Array<{
    finding: string;
    relevance: string;
    stance: EvidenceStance;
    exactExcerpt?: string;
  }>;
  verificationState?: LiveCandidateRecord["verificationState"];
}): Promise<LiveCandidateRecord> {
  const supabase = createAdminClient();
  const normalized = normalizePrinciple(input.principle);

  const { data: existing } = await supabase
    .from("live_candidates")
    .select("*")
    .eq("research_run_id", input.researchRunId)
    .eq("normalized_principle", normalized)
    .maybeSingle();

  let candidateRow = existing;

  if (existing) {
    const mergedBenefits = uniqueStrings([
      ...(existing.benefits ?? []),
      ...input.benefits,
    ]);
    const mergedLimitations = uniqueStrings([
      ...(existing.limitations ?? []),
      ...input.limitations,
    ]);
    const mergedUncertainties = uniqueStrings([
      ...(existing.uncertainties ?? []),
      ...input.uncertainties,
    ]);

    const { data, error } = await supabase
      .from("live_candidates")
      .update({
        name: existing.name || input.name,
        summary: existing.summary || input.summary,
        relevance: existing.relevance || input.relevance,
        category: preferCategory(existing.category, input.category),
        classification_evidence: input.classificationEvidence,
        applicability: input.applicability,
        confidence: input.confidence,
        evidence_quality: input.evidenceQuality,
        benefits: mergedBenefits,
        limitations: mergedLimitations,
        uncertainties: mergedUncertainties,
        industries: uniqueStrings([
          ...(existing.industries ?? []),
          ...input.industries,
        ]),
        physical_mechanisms: uniqueStrings([
          ...(existing.physical_mechanisms ?? []),
          ...input.physicalMechanisms,
        ]),
        maturity: input.maturity,
        verification_state: input.verificationState ?? existing.verification_state,
      })
      .eq("id", existing.id)
      .select("*")
      .single();

    if (error || !data) {
      throw new Error(error?.message || "Failed to update candidate.");
    }
    candidateRow = data;
  } else {
    const { data, error } = await supabase
      .from("live_candidates")
      .insert({
        research_run_id: input.researchRunId,
        name: input.name,
        principle: input.principle,
        normalized_principle: normalized,
        category: input.category,
        summary: input.summary,
        relevance: input.relevance,
        classification_evidence: input.classificationEvidence,
        applicability: input.applicability,
        confidence: input.confidence,
        evidence_quality: input.evidenceQuality,
        benefits: input.benefits,
        limitations: input.limitations,
        uncertainties: input.uncertainties,
        maturity: input.maturity,
        industries: input.industries,
        physical_mechanisms: input.physicalMechanisms,
        verification_state: input.verificationState ?? "provisional",
      })
      .select("*")
      .single();

    if (error?.code === "23505") {
      // Concurrent source analyses may discover the same physical principle.
      // Re-run against the row that won the unique-key race and merge normally.
      return mergeExtractedCandidate(input);
    }
    if (error || !data) {
      throw new Error(error?.message || "Failed to insert candidate.");
    }
    candidateRow = data;
  }

  for (const finding of input.findings) {
    const { error } = await supabase.from("live_evidence").insert({
      research_run_id: input.researchRunId,
      candidate_id: candidateRow.id,
      source_id: input.sourceId,
      finding: finding.finding,
      relevance: finding.relevance,
      stance: finding.stance,
      confidence: input.confidence,
      exact_excerpt: finding.exactExcerpt ?? null,
    });
    if (error) {
      throw new Error(error.message);
    }
  }

  await refreshRunCounters(input.researchRunId);
  return mapCandidate(candidateRow);
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.map((v) => v.trim()).filter(Boolean))];
}

function preferCategory(
  current: CandidateCategory,
  incoming: CandidateCategory,
): CandidateCategory {
  const rank = { established: 3, adjacent: 2, exploratory: 1 } as const;
  return rank[incoming] > rank[current] ? incoming : current;
}
