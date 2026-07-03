import type { TranslationKey } from "../../../i18n/types";
import type {
  AnalyzerCategory,
  AnalyzerSeverity,
  RuleId,
} from "../types";

export type OptimizationBenefitId =
  | "lower-io"
  | "safer-query"
  | "better-index-usage"
  | "better-readability"
  | "lower-sort-cost"
  | "lower-full-scan-risk";

export interface OptimizationStep {
  stepNumber: number;
  issueId: RuleId;
  titleKey: TranslationKey;
  severity: Exclude<AnalyzerSeverity, "success">;
  category: AnalyzerCategory;
  detectedFragment?: string;
  whyKey: TranslationKey;
  actionKey: TranslationKey;
  expectedBenefits: OptimizationBenefitId[];
  relatedTopicIds: string[];
  suggestedSqlSnippet?: string;
  scoreImpact: number;
}

export interface OptimizationStory {
  steps: OptimizationStep[];
}

export type BeforeAfterStatus =
  | "available"
  | "advice-only"
  | "unsafe-blocked"
  | "none";

export interface BeforeAfterDiffLine {
  lineNumber: number;
  value: string;
  changed: boolean;
}

export interface BeforeAfterRewrite {
  status: BeforeAfterStatus;
  originalSql: string;
  suggestedSql?: string;
  originalLines: BeforeAfterDiffLine[];
  suggestedLines: BeforeAfterDiffLine[];
  notes: TranslationKey[];
  warningKey?: TranslationKey;
  extraSqlSnippet?: string;
}

export type QueryMapClause =
  | "select"
  | "from"
  | "join"
  | "where"
  | "group-by"
  | "having"
  | "order-by"
  | "limit"
  | "offset";

export interface QueryMapSection {
  clause: QueryMapClause;
  fragment: string;
  noteKey: TranslationKey;
  relatedIssueIds: RuleId[];
}
