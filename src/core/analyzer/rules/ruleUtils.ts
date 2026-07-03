import type {
  AnalyzerCategory,
  AnalyzerContext,
  AnalyzerFinding,
  RuleId,
} from "../types";
import type { TranslationKey } from "../../../i18n/types";

interface FindingInput {
  id: RuleId;
  severity: AnalyzerFinding["severity"];
  category: AnalyzerCategory;
  detectedFragment?: string;
  scoreImpact: number;
  relatedTopicIds: string[];
  suggestedSqlSnippet?: string;
}

export const createFinding = ({
  id,
  severity,
  category,
  detectedFragment,
  scoreImpact,
  relatedTopicIds,
  suggestedSqlSnippet,
}: FindingInput): AnalyzerFinding => ({
  id,
  titleKey: `rule.${id}.title` as TranslationKey,
  descriptionKey: `rule.${id}.description` as TranslationKey,
  severity,
  category,
  detectedFragment,
  explanationKey: `rule.${id}.explanation` as TranslationKey,
  suggestionKey: `rule.${id}.suggestion` as TranslationKey,
  scoreImpact,
  relatedTopicIds,
  suggestedSqlSnippet,
});

export const firstMatch = (
  context: AnalyzerContext,
  pattern: RegExp,
): string | undefined => context.sql.match(pattern)?.[0]?.trim();

export const countMatches = (value: string, pattern: RegExp): number =>
  Array.from(value.matchAll(pattern)).length;

export const getWhereClause = (sql: string): string | null => {
  const match = sql.match(
    /\bwhere\b([\s\S]*?)(\bgroup\s+by\b|\border\s+by\b|\bhaving\b|\blimit\b|\boffset\b|\bfetch\b|$)/i,
  );

  return match?.[1]?.trim() ?? null;
};

export const getClause = (sql: string, clause: "group by" | "order by") => {
  const escaped = clause.replace(" ", "\\s+");
  const pattern = new RegExp(
    `\\b${escaped}\\b([\\s\\S]*?)(\\bwhere\\b|\\bgroup\\s+by\\b|\\border\\s+by\\b|\\bhaving\\b|\\blimit\\b|\\boffset\\b|\\bfetch\\b|$)`,
    "i",
  );
  return sql.match(pattern)?.[1]?.trim() ?? null;
};

export const splitColumns = (clause: string): string[] =>
  clause
    .split(",")
    .map((column) => column.trim())
    .filter(Boolean);

export const statementHasKeyword = (statement: string, keyword: string) =>
  new RegExp(`\\b${keyword}\\b`, "i").test(statement);
