import { describe, expect, it } from "vitest";
import {
  assessApplicability,
  assessEvidenceQuality,
  calculateConfidence,
  classifyCandidate,
  ClassificationInputSchema,
} from "@/lib/research";
import type { ClassificationInput, ConfidenceInput } from "@/types";

describe("classifyCandidate", () => {
  it("returns established for same purpose with industrial use and comparable conditions", () => {
    const input: ClassificationInput = {
      physicalPrincipleRelevant: true,
      samePurpose: "yes",
      comparableConditions: "partial",
      industrialUse: true,
      independentApplications: 4,
      transferRequired: "low",
    };
    expect(classifyCandidate(input)).toBe("established");
  });

  it("returns adjacent when industrial use exists but transfer is required", () => {
    const input: ClassificationInput = {
      physicalPrincipleRelevant: true,
      samePurpose: "partial",
      comparableConditions: "partial",
      industrialUse: true,
      independentApplications: 3,
      transferRequired: "medium",
    };
    expect(classifyCandidate(input)).toBe("adjacent");
  });

  it("returns exploratory when industrial use is missing", () => {
    const input: ClassificationInput = {
      physicalPrincipleRelevant: true,
      samePurpose: "partial",
      comparableConditions: "no",
      industrialUse: false,
      independentApplications: 0,
      transferRequired: "high",
    };
    expect(classifyCandidate(input)).toBe("exploratory");
  });

  it("returns exploratory when physical principle is not relevant", () => {
    const input: ClassificationInput = {
      physicalPrincipleRelevant: false,
      samePurpose: "yes",
      comparableConditions: "yes",
      industrialUse: true,
      independentApplications: 5,
      transferRequired: "low",
    };
    expect(classifyCandidate(input)).toBe("exploratory");
  });
});

describe("calculateConfidence", () => {
  it("returns high with independent strong direct evidence and no contradiction", () => {
    const input: ConfidenceInput = {
      evidenceCount: 4,
      independentSourceCount: 2,
      hasStrongTechnicalSource: true,
      directEvidence: true,
      contradictoryEvidence: false,
    };
    expect(calculateConfidence(input)).toBe("high");
  });

  it("returns medium with multiple evidence items and no contradiction", () => {
    const input: ConfidenceInput = {
      evidenceCount: 2,
      independentSourceCount: 1,
      hasStrongTechnicalSource: false,
      directEvidence: false,
      contradictoryEvidence: false,
    };
    expect(calculateConfidence(input)).toBe("medium");
  });

  it("returns low when evidence is sparse or contradictory", () => {
    expect(
      calculateConfidence({
        evidenceCount: 1,
        independentSourceCount: 1,
        hasStrongTechnicalSource: false,
        directEvidence: false,
        contradictoryEvidence: false,
      }),
    ).toBe("low");

    expect(
      calculateConfidence({
        evidenceCount: 5,
        independentSourceCount: 3,
        hasStrongTechnicalSource: true,
        directEvidence: true,
        contradictoryEvidence: true,
      }),
    ).toBe("low");
  });
});

describe("assessApplicability", () => {
  it("returns high for aligned purpose, conditions, and low transfer", () => {
    expect(
      assessApplicability({
        physicalPrincipleRelevant: true,
        samePurpose: "yes",
        comparableConditions: "yes",
        transferRequired: "low",
        unresolvedKeyConditions: false,
      }),
    ).toBe("high");
  });

  it("returns uncertain when key conditions are unresolved", () => {
    expect(
      assessApplicability({
        physicalPrincipleRelevant: true,
        samePurpose: "yes",
        comparableConditions: "yes",
        transferRequired: "low",
        unresolvedKeyConditions: true,
      }),
    ).toBe("uncertain");
  });

  it("returns low for high transfer burden", () => {
    expect(
      assessApplicability({
        physicalPrincipleRelevant: true,
        samePurpose: "partial",
        comparableConditions: "partial",
        transferRequired: "high",
        unresolvedKeyConditions: false,
      }),
    ).toBe("low");
  });
});

describe("assessEvidenceQuality", () => {
  it("returns strong for independent strong direct evidence", () => {
    expect(
      assessEvidenceQuality({
        evidenceCount: 3,
        independentSourceCount: 2,
        hasStrongTechnicalSource: true,
        directEvidence: true,
        contradictoryEvidence: false,
      }),
    ).toBe("strong");
  });

  it("returns weak when contradictory", () => {
    expect(
      assessEvidenceQuality({
        evidenceCount: 4,
        independentSourceCount: 2,
        hasStrongTechnicalSource: true,
        directEvidence: true,
        contradictoryEvidence: true,
      }),
    ).toBe("weak");
  });
});

describe("ClassificationInputSchema", () => {
  it("rejects ambiguous industrialUse strings", () => {
    const result = ClassificationInputSchema.safeParse({
      physicalPrincipleRelevant: true,
      samePurpose: "partial",
      comparableConditions: "partial",
      industrialUse: "probably",
      independentApplications: 3,
      transferRequired: "medium",
    });
    expect(result.success).toBe(false);
  });

  it("accepts valid structured facts", () => {
    const result = ClassificationInputSchema.safeParse({
      physicalPrincipleRelevant: true,
      samePurpose: "partial",
      comparableConditions: "partial",
      industrialUse: true,
      independentApplications: 3,
      transferRequired: "medium",
    });
    expect(result.success).toBe(true);
  });
});
