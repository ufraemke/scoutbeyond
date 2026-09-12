export type CandidateCategory = "established" | "adjacent" | "exploratory";

export type ConfidenceLevel = "low" | "medium" | "high";

export type ResearchStatus = "complete" | "partial" | "error";

export type EvidenceStance = "supports" | "contradicts" | "neutral";

export type SourceType =
  | "research_paper"
  | "patent"
  | "supplier"
  | "research_institution"
  | "technical_article"
  | "industry_source"
  | "internal"
  | "other";

// --------------------------------------------------
// INPUT / PROBLEM DEFINITION
// --------------------------------------------------

export type ResearchRequest = {
  id: string;

  rawInput: string;

  problem: StructuredProblem;

  evaluationCriteria: EvaluationCriterion[];
};

export type StructuredProblem = {
  statement: string;

  currentSolution?: string;

  goals: string[];

  constraints: Constraint[];

  assumptions: Assumption[];

  unknowns: string[];

  searchDimensions: SearchDimension[];
};

export type Constraint = {
  id: string;
  description: string;

  importance?: "must" | "should";
};

export type Assumption = {
  id: string;
  description: string;

  origin: "user" | "ai";

  status: "confirmed" | "unconfirmed" | "rejected";
};

export type SearchDimension = {
  id: string;
  name: string;

  description?: string;
};

// --------------------------------------------------
// EVALUATION CRITERIA
// --------------------------------------------------

export type EvaluationCriterion = {
  id: string;

  name: string;

  description?: string;

  weight?: number;
};

// --------------------------------------------------
// FINAL RESEARCH RESULT
// --------------------------------------------------

export type ResearchResult = {
  requestId: string;

  problem: StructuredProblem;

  candidates: Candidate[];

  shortlist: ShortlistEntry[];

  status: ResearchStatus;

  warnings: string[];

  metadata?: ResearchMetadata;
};

// --------------------------------------------------
// CANDIDATE / SOLUTION PRINCIPLE
// --------------------------------------------------

export type Candidate = {
  id: string;

  name: string;

  /**
   * Underlying physical or engineering principle.
   * Example:
   * "acoustic cavitation"
   * rather than simply a product name.
   */
  principle: string;

  category: CandidateCategory;

  summary: string;

  /**
   * Why this solution is relevant to THIS problem.
   * This is analysis / interpretation, not source evidence.
   */
  relevance: string;

  industries: string[];

  physicalMechanisms: string[];

  applications: ApplicationExample[];

  applicability: ApplicabilityAssessment;

  evidence: EvidenceItem[];

  benefits: string[];

  limitations: string[];

  uncertainties: Uncertainty[];

  maturity?: MaturityAssessment;

  evaluations: CriterionAssessment[];

  overallScore?: Score;

  sustainability?: SustainabilityAssessment;

  verification?: VerificationResult;
};

// --------------------------------------------------
// APPLICATION / TRANSFERABILITY
// --------------------------------------------------

export type ApplicationExample = {
  industry?: string;

  useCase: string;

  conditions?: string[];

  outcome?: string;

  evidenceIds: string[];
};

export type ApplicabilityAssessment = {
  rating: "high" | "medium" | "low" | "uncertain";

  rationale: string;

  demonstratedConditions: string[];

  requiredConditions: string[];

  transferGaps: string[];

  integrationRisks: string[];

  confidence: ConfidenceLevel;
};

// --------------------------------------------------
// EVIDENCE & SOURCES
// --------------------------------------------------

export type EvidenceItem = {
  id: string;

  /**
   * Concise source-backed finding.
   * Prefer a paraphrased factual statement,
   * not AI interpretation.
   */
  finding: string;

  /**
   * Why this evidence matters for the candidate.
   */
  relevance: string;

  stance: EvidenceStance;

  source: Source;

  confidence?: ConfidenceLevel;
};

export type Source = {
  id: string;

  title: string;

  url: string;

  sourceType: SourceType;

  publisher?: string;

  publicationDate?: string;

  accessedAt?: string;
};

// --------------------------------------------------
// BENEFITS / RISKS / UNCERTAINTY
// --------------------------------------------------

export type Uncertainty = {
  id: string;

  description: string;

  impact?: "low" | "medium" | "high";

  howToResolve?: string;
};

// --------------------------------------------------
// MATURITY
// --------------------------------------------------

export type MaturityAssessment = {
  label?: string;

  trl?: number;

  rationale?: string;

  confidence?: ConfidenceLevel;
};

// --------------------------------------------------
// COMPARISON / SCORING
// --------------------------------------------------

export type CriterionAssessment = {
  criterionId: string;

  /**
   * Common comparison scale.
   * 1 = poor fit
   * 5 = strong fit
   */
  score?: number;

  rationale: string;

  evidenceIds: string[];

  confidence: ConfidenceLevel;

  method: "ai_assessment" | "calculated" | "user_assigned";
};

export type Score = {
  value: number;

  /**
   * Recommended MVP scale: 0–100.
   */
  maxValue: 100;

  method: "weighted" | "ai_assessment";

  explanation?: string;
};

// --------------------------------------------------
// SUSTAINABILITY
// --------------------------------------------------

export type SustainabilityAssessment = {
  water?: string;

  energy?: string;

  chemicals?: string;

  waste?: string;
};

// --------------------------------------------------
// COUNTER-CHECK / VERIFICATION
// --------------------------------------------------

export type VerificationResult = {
  status: "not_checked" | "supported" | "mixed" | "weak_evidence";

  notes: string[];

  contradictoryEvidenceIds: string[];
};

// --------------------------------------------------
// SHORTLIST
// --------------------------------------------------

export type ShortlistEntry = {
  candidateId: string;

  rank: number;

  rationale: string;

  keyCaveat?: string;
};

// --------------------------------------------------
// TECHNICAL / RESEARCH METADATA
// --------------------------------------------------

export type ResearchMetadata = {
  generatedAt: string;

  researchMode: "live" | "prepared" | "hybrid";

  llmProvider?: string;

  retrievalProviders?: string[];
};
