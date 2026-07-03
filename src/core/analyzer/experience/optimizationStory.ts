import type {
  AnalyzerCategory,
  AnalyzerFinding,
  AnalyzerSeverity,
  RuleId,
} from "../types";
import type {
  OptimizationBenefitId,
  OptimizationStep,
  OptimizationStory,
} from "./types";

const severityRank: Record<Exclude<AnalyzerSeverity, "success">, number> = {
  critical: 0,
  warning: 1,
  info: 2,
};

const categoryRank: Record<AnalyzerCategory, number> = {
  performance: 0,
  safety: 1,
  indexing: 2,
  readability: 3,
  schema: 4,
  dialect: 5,
};

const ruleBenefits: Partial<Record<RuleId, OptimizationBenefitId[]>> = {
  "select-star": ["lower-io", "better-readability"],
  "update-without-where": ["safer-query"],
  "delete-without-where": ["safer-query"],
  "leading-wildcard-like": ["better-index-usage", "lower-full-scan-risk"],
  "function-in-where": ["better-index-usage"],
  "order-by-without-limit": ["lower-sort-cost"],
  "offset-pagination": ["lower-io", "lower-sort-cost"],
  "too-many-or-conditions": ["better-index-usage"],
  "cross-join": ["lower-io", "lower-full-scan-risk"],
  "missing-join-condition": ["safer-query", "lower-full-scan-risk"],
  "distinct-overuse": ["lower-sort-cost", "better-readability"],
  "group-by-many-columns": ["lower-sort-cost"],
  "not-in-null-risk": ["safer-query"],
  "implicit-conversion-risk": ["better-index-usage"],
  "unbounded-select": ["lower-io", "lower-full-scan-risk"],
  "too-many-joins": ["lower-io"],
  "possible-n-plus-one-pattern": ["lower-io"],
  "order-by-random": ["lower-sort-cost"],
  "nullable-not-in": ["safer-query"],
  "unsafe-drop-table": ["safer-query"],
};

const categoryBenefits: Record<AnalyzerCategory, OptimizationBenefitId[]> = {
  performance: ["lower-io"],
  safety: ["safer-query"],
  indexing: ["better-index-usage"],
  readability: ["better-readability"],
  schema: ["safer-query"],
  dialect: ["better-readability"],
};

const uniqueBenefits = (
  benefits: OptimizationBenefitId[],
): OptimizationBenefitId[] => Array.from(new Set(benefits));

const benefitsForFinding = (finding: AnalyzerFinding): OptimizationBenefitId[] =>
  uniqueBenefits([
    ...(ruleBenefits[finding.id] ?? []),
    ...categoryBenefits[finding.category],
  ]);

const compareFindings = (
  left: AnalyzerFinding,
  right: AnalyzerFinding,
): number =>
  severityRank[left.severity] - severityRank[right.severity] ||
  right.scoreImpact - left.scoreImpact ||
  categoryRank[left.category] - categoryRank[right.category] ||
  left.id.localeCompare(right.id);

export const createOptimizationStory = (
  findings: AnalyzerFinding[],
): OptimizationStory => {
  const steps: OptimizationStep[] = [...findings]
    .sort(compareFindings)
    .map((finding, index) => ({
      stepNumber: index + 1,
      issueId: finding.id,
      titleKey: finding.titleKey,
      severity: finding.severity,
      category: finding.category,
      detectedFragment: finding.detectedFragment,
      whyKey: finding.explanationKey,
      actionKey: finding.suggestionKey,
      expectedBenefits: benefitsForFinding(finding),
      relatedTopicIds: finding.relatedTopicIds,
      suggestedSqlSnippet: finding.suggestedSqlSnippet,
      scoreImpact: finding.scoreImpact,
    }));

  return { steps };
};
