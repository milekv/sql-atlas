import type { TranslationKey } from "../../i18n/types";
import type { IndexSuggestion } from "../index-advisor/types";

export type SqlDialect =
  | "postgresql"
  | "mysql"
  | "oracle"
  | "sqlite"
  | "sqlserver"
  | "generic";

export type AnalyzerSeverity = "critical" | "warning" | "info" | "success";

export type AnalyzerCategory =
  | "performance"
  | "safety"
  | "readability"
  | "indexing"
  | "schema"
  | "dialect";

export type RuleId =
  | "select-star"
  | "update-without-where"
  | "delete-without-where"
  | "leading-wildcard-like"
  | "function-in-where"
  | "order-by-without-limit"
  | "offset-pagination"
  | "too-many-or-conditions"
  | "cross-join"
  | "missing-join-condition"
  | "distinct-overuse"
  | "group-by-many-columns"
  | "not-in-null-risk"
  | "implicit-conversion-risk"
  | "unbounded-select"
  | "too-many-joins"
  | "possible-n-plus-one-pattern"
  | "order-by-random"
  | "nullable-not-in"
  | "unsafe-drop-table";

export interface AnalyzerContext {
  sql: string;
  normalizedSql: string;
  statements: string[];
  dialect: SqlDialect;
}

export interface AnalyzerFinding {
  id: RuleId;
  titleKey: TranslationKey;
  descriptionKey: TranslationKey;
  severity: Exclude<AnalyzerSeverity, "success">;
  category: AnalyzerCategory;
  detectedFragment?: string;
  explanationKey: TranslationKey;
  suggestionKey: TranslationKey;
  scoreImpact: number;
  relatedTopicIds: string[];
  suggestedSqlSnippet?: string;
}

export interface AnalyzerPassedCheck {
  id: RuleId;
  titleKey: TranslationKey;
  descriptionKey: TranslationKey;
  severity: "success";
  category: AnalyzerCategory;
}

export interface AnalyzerRule {
  id: RuleId;
  titleKey: TranslationKey;
  passedKey: TranslationKey;
  category: AnalyzerCategory;
  analyze: (context: AnalyzerContext) => AnalyzerFinding | null;
}

export interface ScoreBreakdown {
  performance: number;
  safety: number;
  readability: number;
  indexing: number;
}

export interface QueryAnalysisResult {
  sql: string;
  dialect: SqlDialect;
  formattedSql: string;
  score: number;
  scoreBreakdown: ScoreBreakdown;
  findings: AnalyzerFinding[];
  passedChecks: AnalyzerPassedCheck[];
  indexSuggestions: IndexSuggestion[];
  relatedTopicIds: string[];
}
