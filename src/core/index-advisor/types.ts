import type { Language } from "../../types";

export type IndexConfidence = "low" | "medium" | "high";

export type IndexSuggestionSource =
  | "where"
  | "join"
  | "order-by"
  | "group-by"
  | "functional"
  | "composite";

export type LocalizedText = Record<Language, string>;

export interface IndexSuggestion {
  id: string;
  tableName: string;
  columns: string[];
  expression?: string;
  source: IndexSuggestionSource;
  sqlSnippet: string;
  reason: LocalizedText;
  confidence: IndexConfidence;
  relatedQueryFragment: string;
  educationalWarning: LocalizedText;
}

export interface TableReference {
  name: string;
  alias: string;
}

export interface ColumnReference {
  tableName: string;
  columnName: string;
  fragment: string;
}
