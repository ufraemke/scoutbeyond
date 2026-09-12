/**
 * ScoutAI research model.
 * Existing application fields are preserved.
 * New fields on existing types are optional for compatibility.
 * Import code must validate incoming data at runtime.
 * Missing verification means not checked, never verified.
 * This file defines types; it does not create database tables.
 * Persistent IDs belong to the database. Provider IDs are scoped to a run.
 */

export type RecordVerificationStatus =
  | "not_checked"
  | "verified"
  | "corrected"
  | "unverified";

export type ExcerptSource = "abstract" | "full_text" | "webpage";

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export type ImportReference = {
  ingestionRunId: string;
  providerRecordId: string;
};

export type CandidateCategory =
  | "established"
  | "adjacent"
  | "exploratory";

export type ConfidenceLevel = "low" | "medium" | "high";
export type ResearchStatus = "complete" | "partial" | "error";
export type EvidenceStance = "supports" | "contradicts" | "neutral";
export type EvidenceQuality = "strong" | "moderate" | "weak";
export type ApplicabilityRating = "high" | "medium" | "low" | "uncertain";
export type PurposeFit = "yes" | "partial" | "no";
export type TransferRequirement = "low" | "medium" | "high";

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
// DETERMINISTIC EVALUATION INPUTS
// --------------------------------------------------

export type ClassificationInput = {
  physicalPrincipleRelevant: boolean;
  samePurpose: PurposeFit;
  comparableConditions: PurposeFit;
  industrialUse: boolean;
  independentApplications: number;
  transferRequired: TransferRequirement;
};

export type ConfidenceInput = {
  evidenceCount: number;
  independentSourceCount: number;
  hasStrongTechnicalSource: boolean;
  directEvidence: boolean;
  contradictoryEvidence: boolean;
};

export type ApplicabilityInput = {
  physicalPrincipleRelevant: boolean;
  samePurpose: PurposeFit;
  comparableConditions: PurposeFit;
  transferRequired: TransferRequirement;
  unresolvedKeyConditions: boolean;
};

export type EvidenceQualityInput = {
  evidenceCount: number;
  independentSourceCount: number;
  hasStrongTechnicalSource: boolean;
  directEvidence: boolean;
  contradictoryEvidence: boolean;
};

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
  /** Permanent ID for this result version. */
  id?: string;
  requestId: string;
  ingestionRunIds?: string[];
  verificationSummary?: ResearchVerificationSummary;
  searchGaps?: string[];
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
  researchResultId?: string;
  importReferences?: ImportReference[];

  /** Retrieval details retained separately from assessed app fields. */
  retrievedDetails?: RetrievedPrinciple;

  name: string;

  /** Underlying physical principle, rather than simply a product name. */
  principle: string;

  category: CandidateCategory;

  /** Structured facts used to derive the category. */
  classificationEvidence?: ClassificationInput;

  summary: string;

  /** Analysis of relevance to this problem, separate from source facts. */
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
  rating: ApplicabilityRating;
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

  /** Concise source-backed finding, preferably a factual paraphrase. */
  finding: string;

  /** Why this evidence matters for the candidate. */
  relevance: string;

  stance: EvidenceStance;
  source: Source;
  confidence?: ConfidenceLevel;

  /** Older exports may contain summaries; do not treat them as quotes. */
  supportingText?: string | null;

  /** Exact short passage from the source. */
  exactExcerpt?: string | null;

  excerptSource?: ExcerptSource | null;
  excerptUrl?: string | null;
  excerptLocator?: string | null;
  limitations?: string[];

  /** null means not established. */
  isDemonstratedInTank?: boolean | null;
  isSupplierClaim?: boolean | null;

  verificationStatus?: RecordVerificationStatus;
  verificationReason?: string | null;
  verificationUrl?: string | null;
  verifiedAt?: string | null;
  verifiedBy?: string | null;

  /** Provider assertions remain separate from independent verification. */
  providerVerificationStatus?: RecordVerificationStatus | null;
  providerVerificationReason?: string | null;
  providerVerificationUrl?: string | null;

  importReferences?: ImportReference[];
  fieldCitations?: Record<string, string[]>;
  createdAt?: string;
  updatedAt?: string;
};

export type Source = {
  id: string;
  title: string;
  url: string;
  sourceType: SourceType;
  publisher?: string;
  publicationDate?: string;
  accessedAt?: string;

  /** Normalized DOI without the https://doi.org/ prefix. */
  doi?: string | null;

  authors?: string[];
  journal?: string | null;

  /** Preserve a year without inventing a month or day. */
  publicationYear?: number | null;

  canonicalUrl?: string | null;
  sourceLabel?: string | null;

  /** null or absent means unknown. */
  isPeerReviewed?: boolean | null;

  /** Firecrawl's assertion, pending independent verification. */
  providerIsPeerReviewed?: boolean | null;

  peerReviewVerificationUrl?: string | null;
  peerReviewVerificationReason?: string | null;

  /** corrected means the corrected metadata was subsequently verified. */
  verificationStatus?: RecordVerificationStatus;

  verificationReason?: string | null;
  verificationUrl?: string | null;
  unverifiedFields?: string[];
  verifiedAt?: string | null;
  verifiedBy?: string | null;

  providerVerificationStatus?: RecordVerificationStatus | null;
  providerVerificationReason?: string | null;
  providerVerificationUrl?: string | null;

  importReferences?: ImportReference[];
  fieldCitations?: Record<string, string[]>;
  createdAt?: string;
  updatedAt?: string;

  /** Retrieval/check date, separate from publication dates. */
  lastCheckedAt?: string | null;
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

  /** Common comparison scale: 1 = poor fit, 5 = strong fit. */
  score?: number;

  rationale: string;
  evidenceIds: string[];
  confidence: ConfidenceLevel;
  method: "ai_assessment" | "calculated" | "user_assigned";
};

export type Score = {
  value: number;
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

// --------------------------------------------------
// OPTIONAL NORMALIZED DATABASE RECORDS
// --------------------------------------------------

/** Shared source facts; candidate relevance and stance belong to the link. */
export type EvidenceRecord = Omit<
  EvidenceItem,
  "source" | "relevance" | "stance"
> & {
  sourceId: string;
};

export type CandidateEvidence = {
  candidateId: string;
  evidenceId: string;
  relevance: string;
  stance: EvidenceStance;
};

export type ShortlistRecord = ShortlistEntry & {
  researchResultId: string;
};

export type ResearchResultRecord = Omit<
  ResearchResult,
  "id" | "candidates" | "shortlist"
> & {
  id: string;
};

export type CandidateRecord = Omit<
  Candidate,
  "researchResultId" | "evidence"
> & {
  researchResultId: string;
};

// --------------------------------------------------
// VERIFICATION COUNTS & CORRECTION HISTORY
// --------------------------------------------------

export type ResearchVerificationSummary = {
  totalSourceCount: number;

  /** Relevant, deduplicated, independently verified peer-reviewed papers. */
  verifiedPeerReviewedCount: number;

  unverifiedSourceCount: number;
  nonPeerReviewedSourceCount: number;
  verifiedFindingCount: number;
  unverifiedFindingCount: number;
  targetPeerReviewedCount: number;

  /** max(0, targetPeerReviewedCount - verifiedPeerReviewedCount). */
  shortfall: number;

  /** Distinguishes import totals from cumulative research totals. */
  scope: "ingestion_run" | "research_result";

  notes: string[];
};

export type CorrectionEntry = {
  id: string;
  ingestionRunId: string;
  targetType: "source" | "evidence" | "candidate";

  /** Permanent database ID, not a provider's run-local label. */
  targetId: string;

  field: string;

  /** Use null if the original is unknown. */
  originalValue: JsonValue;

  /** Distinguishes an unknown original from an actual JSON null. */
  originalValueKnown: boolean;

  correctedValue: JsonValue;
  reason: string;
  verificationUrl: string | null;
  changedAt: string;
  changedBy: string;
};

// --------------------------------------------------
// DAILY INGESTION — APPLICATION RECORD CONTRACTS
// These require mapping to the deployed importer's database schema.
// --------------------------------------------------

export type IngestionStatus =
  | "queued"
  | "starting"
  | "submission_unknown"
  | "researching"
  | "validating"
  | "importing"
  | "completed"
  | "partial"
  | "failed"
  | "cancelled";

export type IngestionRun = {
  id: string;
  requestId: string;
  scheduleId?: string | null;
  researchResultId?: string | null;
  provider: "firecrawl";
  firecrawlJobId: string | null;

  /**
   * Unique local key for a scheduled occurrence or manual request.
   * Does not guarantee Firecrawl deduplicates external submissions.
   */
  idempotencyKey: string;

  status: IngestionStatus;

  /** Exact request configuration, without API secrets. */
  promptSnapshot: string;
  outputSchemaSnapshot: JsonValue;
  promptVersion: string;
  schemaVersion: string;

  scheduledFor: string | null;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  lastCheckedAt: string | null;
  nextRetryAt: string | null;
  retryCount: number;
  maxRetries: number;

  /** Database lease used to avoid concurrent processing of one run. */
  lockedUntil: string | null;
  lockedBy: string | null;

  errorCode: string | null;
  errorMessage: string | null;
  warnings: string[];
  maxCredits: number;
  creditsUsed: number | null;

  /** Private storage reference. */
  rawResponseLocation: string | null;
  rawResponseChecksum: string | null;

  resultsExpireAt: string | null;
  retrievedAt: string | null;
  importedAt: string | null;

  sourcesReceived: number;
  sourcesInserted: number;
  sourcesUpdated: number;
  sourcesUnchanged: number;
  sourcesRejected: number;
  findingsReceived: number;
  findingsImported: number;
  findingsRejected: number;

  verificationSummary?: ResearchVerificationSummary;
};

export type IngestionSchedule = {
  id: string;
  requestId: string;
  enabled: boolean;

  /** 24 hours = 86,400 seconds. */
  intervalSeconds: number;

  nextRunAt: string;
  lastRunAt: string | null;
  lastSuccessfulRunAt: string | null;
  maxCreditsPerRun: number;
  prompt: string;
  outputSchema: JsonValue;
  promptVersion: string;
  schemaVersion: string;
};

// --------------------------------------------------
// FIRECRAWL INPUT CONTRACT — ALL THREE OBSERVED EXPORTS
// --------------------------------------------------

/** Preserve extra fields and nested citation fields; validate at runtime. */
export type FirecrawlFields = {
  [field: string]: unknown;
};

export type FirecrawlText =
  | string
  | (FirecrawlFields & {
      value: string;
    });

export type FirecrawlTextList = FirecrawlText[];

export type FirecrawlSource = FirecrawlFields & {
  source_id: string;
  url: string;
  title: string;
  publisher?: string | null;
  source_type?: string | null;
  authors?: FirecrawlTextList | null;
  journal?: string | null;
  publication_year?: number | null;
  publication_date?: string | null;
  doi?: string | null;
  is_peer_reviewed?: boolean | null;
  source_label?: string | null;
  verification_status?: RecordVerificationStatus | null;
  verification_reason?: string | null;
  verification_url?: string | null;
  unverified_fields?: FirecrawlTextList | null;
};

export type FirecrawlFinding = FirecrawlFields & {
  finding_id: string;
  source_id: string;
  claim: string;
  supporting_excerpt?: string | null;
  exact_excerpt?: string | null;
  excerpt_source?: ExcerptSource | null;
  is_supplier_claim?: boolean | null;
  limitations?: string | FirecrawlTextList | null;
  is_demonstrated_in_tank?: boolean | null;
  verification_status?: RecordVerificationStatus | null;
  verification_reason?: string | null;
  verification_url?: string | null;
};

export type FirecrawlImplementation = FirecrawlFields & {
  entity_name: string;
  finding_ids: FirecrawlTextList;
};

export type FirecrawlPrinciple = FirecrawlFields & {
  /** Missing in the first two exports. */
  principle_id?: string | null;

  name: string;
  physical_mechanism: string;

  /** Provider prose may differ from CandidateCategory. */
  classification?: string | null;

  technical_maturity?: string | null;
  documented_applications?: FirecrawlTextList | null;
  example_implementations?: FirecrawlImplementation[] | null;
  relevance_assessment?: string | null;
  finding_ids?: FirecrawlTextList | null;
  contradictory_evidence?: string | null;
  requirements?: string | FirecrawlTextList | null;
  limitations?: string | FirecrawlTextList | null;

  performance_data?: (FirecrawlFields & {
    reported_savings?: string | null;
    baselines?: string | null;
    test_conditions?: string | null;
  }) | null;

  integration_and_requirements?: (FirecrawlFields & {
    operating_requirements?: string | null;
    retrofit_feasibility?: string | null;
  }) | null;

  limitations_and_risks?: (FirecrawlFields & {
    failure_conditions?: string | null;
    conflicting_evidence?: string | null;
    validation_requirements?: string | null;
  }) | null;

  unknowns_and_next_steps?: (FirecrawlFields & {
    critical_unknowns?: FirecrawlTextList | null;
    practical_next_step?: string | null;
  }) | null;
};

export type FirecrawlCorrection = FirecrawlFields & {
  target_id: string;
  field: string;
  corrected: JsonValue;

  /** Absent in export 3; do not infer it from cross-run provider IDs. */
  original?: JsonValue;

  reason: string;
  verification_url?: string | null;
};

export type FirecrawlVerificationSummary = FirecrawlFields & {
  total_peer_reviewed_count?: number | null;
  verified_peer_reviewed_count?: number | null;
  shortfall?: number | null;
  gap_explanation?: string | null;
};

/** Result payload, separate from the API's outer job-status envelope. */
export type FirecrawlExport = FirecrawlFields & {
  sources: FirecrawlSource[];
  findings: FirecrawlFinding[];
  solution_principles: FirecrawlPrinciple[];
  search_gaps?: FirecrawlTextList | null;

  correction_log?: (FirecrawlFields & {
    summary?: string | null;
    changes: FirecrawlCorrection[];
  }) | null;

  verification_summary?: FirecrawlVerificationSummary | null;
};

// --------------------------------------------------
// RETRIEVED PRINCIPLES & IMPORT BATCHES
// --------------------------------------------------

/**
 * Convert a retrieved principle into a Candidate only after assessment.
 * Provider classification, relevance, and maturity remain assertions.
 * Importing does not establish scores, applicability, or confidence.
 */
export type RetrievedPrinciple = {
  ingestionRunId: string;

  /** Available even when the provider omitted principle_id. */
  providerRecordIndex: number;

  providerRecordId: string | null;
  name: string;
  physicalMechanism: string;
  providerClassification: string | null;
  providerTechnicalMaturity: string | null;
  providerRelevanceAssessment: string | null;
  documentedApplications: string[];

  exampleImplementations: {
    entityName: string;
    findingIds: string[];
  }[];

  /** Run-local IDs until resolved to permanent evidence IDs. */
  findingIds: string[];

  performanceData: {
    /** Preserve wording; not every reported value represents savings. */
    reportedSavings: string | null;
    baselines: string | null;
    testConditions: string | null;
  } | null;

  operatingRequirements: string[];
  retrofitFeasibility: string | null;
  limitations: string[];
  failureConditions: string | null;
  contradictoryEvidence: string[];
  validationRequirements: string | null;
  criticalUnknowns: string[];
  practicalNextStep: string | null;
  raw: FirecrawlPrinciple;
};

export type FirecrawlImportBatch = {
  ingestionRunId: string;
  receivedAt: string;

  /** Original JSON, retaining nested citations and provider assertions. */
  raw: FirecrawlExport;

  retrievedPrinciples: RetrievedPrinciple[];
  warnings: string[];

  /** Proposed corrections are not automatically applied database changes. */
  providerCorrectionLog?: FirecrawlExport["correction_log"];

  providerVerificationSummary?: FirecrawlVerificationSummary | null;
  searchGaps: string[];
};

// --------------------------------------------------
// LIVE RESEARCH RUN CONTRACT
// --------------------------------------------------

export type ResearchRunStatus =
  | "queued"
  | "searching"
  | "scraping"
  | "analysing"
  | "counter_checking"
  | "synthesising"
  | "completed"
  | "failed";

export type ResearchSourceStatus =
  | "discovered"
  | "scraping"
  | "scraped"
  | "analysing"
  | "analysed"
  | "failed";

export type SourceAnalysisStatus =
  | "pending"
  | "queued"
  | "running"
  | "completed"
  | "failed"
  | "skipped";

export type ScrapeJobPhase = "initial_research" | "counter_check";

export type CandidateVerificationState =
  | "provisional"
  | "verified"
  | "rejected";

export type SearchQueryDimension =
  | "direct"
  | "physical_principle"
  | "adjacent_application"
  | "cross_industry"
  | "emerging";

export type DiversifiedSearchQuery = {
  query: string;
  dimension: SearchQueryDimension;
  rationale?: string;
};

export type ResearchRunRecord = {
  id: string;
  ownerId: string;
  challenge: string;
  structuredProblem: StructuredProblem;
  status: ResearchRunStatus;
  phase: string;
  errorMessage?: string | null;
  sourcesFound: number;
  sourcesScraped: number;
  sourcesAnalysed: number;
  sourcesFailed: number;
  candidatesCount: number;
  searchQueries: DiversifiedSearchQuery[];
  warnings: string[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string | null;
};

export type ResearchSourceRecord = {
  id: string;
  researchRunId: string;
  url: string;
  canonicalUrl: string;
  title?: string | null;
  description?: string | null;
  searchDimension?: SearchQueryDimension | string | null;
  searchQuery?: string | null;
  status: ResearchSourceStatus;
  analysisStatus: SourceAnalysisStatus;
  scrapeId?: string | null;
  markdown?: string | null;
  metadata?: Record<string, unknown>;
  errorMessage?: string | null;
  createdAt: string;
  updatedAt: string;
  scrapedAt?: string | null;
  analysedAt?: string | null;
};

export type ResearchEventRecord = {
  id: string;
  researchRunId: string;
  eventType: string;
  message: string;
  payload?: Record<string, unknown>;
  createdAt: string;
};

export type LiveCandidateRecord = {
  id: string;
  researchRunId: string;
  name: string;
  principle: string;
  normalizedPrinciple: string;
  category: CandidateCategory;
  summary: string;
  relevance: string;
  classificationEvidence?: ClassificationInput;
  applicability?: ApplicabilityAssessment | Record<string, unknown>;
  confidence?: ConfidenceLevel | null;
  evidenceQuality?: EvidenceQuality | null;
  benefits: string[];
  limitations: string[];
  uncertainties: Uncertainty[] | string[];
  maturity?: MaturityAssessment | Record<string, unknown>;
  industries: string[];
  physicalMechanisms: string[];
  verificationState: CandidateVerificationState;
  createdAt: string;
  updatedAt: string;
};

export type LiveEvidenceRecord = {
  id: string;
  researchRunId: string;
  candidateId: string;
  sourceId: string;
  finding: string;
  relevance: string;
  stance: EvidenceStance;
  confidence?: ConfidenceLevel | null;
  exactExcerpt?: string | null;
  createdAt: string;
  source?: Pick<
    ResearchSourceRecord,
    "id" | "url" | "canonicalUrl" | "title"
  >;
};

export type ResearchRunSnapshot = {
  run: ResearchRunRecord;
  sources: ResearchSourceRecord[];
  events: ResearchEventRecord[];
  candidates: LiveCandidateRecord[];
  evidence: LiveEvidenceRecord[];
};
