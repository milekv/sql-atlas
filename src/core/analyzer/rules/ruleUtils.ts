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
  statementOffset?: number;
  scoreImpact: number;
  relatedTopicIds: string[];
  suggestedSqlSnippet?: string;
}

export const createFinding = ({
  id,
  severity,
  category,
  detectedFragment,
  statementOffset,
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
  statementOffset,
  explanationKey: `rule.${id}.explanation` as TranslationKey,
  suggestionKey: `rule.${id}.suggestion` as TranslationKey,
  scoreImpact,
  relatedTopicIds,
  suggestedSqlSnippet,
});

export const allMatches = (
  context: AnalyzerContext,
  pattern: RegExp,
  source: "structure" | "comments" = "structure",
): Array<{ fragment: string; offset: number }> => {
  const searchable = source === "structure" ? context.maskedSql : context.commentMaskedSql;
  return [...searchable.matchAll(pattern)]
    .filter((match) => /\S/.test(context.maskedSql.slice(match.index, match.index + 1)))
    .map((match) => ({
      fragment: context.sql.slice(match.index, match.index + match[0].length),
      offset: match.index,
    }));
};

export const firstMatch = (
  context: AnalyzerContext,
  pattern: RegExp,
  source: "structure" | "comments" = "structure",
): string | undefined => {
  const searchable = source === "structure" ? context.maskedSql : context.commentMaskedSql;
  const match = searchable.match(pattern);
  if (!match || match.index === undefined) return undefined;
  return context.sql.slice(match.index, match.index + match[0].length).trim();
};

export const countMatches = (value: string, pattern: RegExp): number =>
  Array.from(value.matchAll(pattern)).length;

export const getWhereClause = (context: AnalyzerContext): string | null => {
  const match = context.maskedSql.match(
    /\bwhere\b([\s\S]*?)(\bgroup\s+by\b|\border\s+by\b|\bhaving\b|\blimit\b|\boffset\b|\bfetch\b|$)/i,
  );

  return match?.[1]?.trim() ?? null;
};

export const getClause = (context: AnalyzerContext, clause: "group by" | "order by") => {
  const escaped = clause.replace(" ", "\\s+");
  const pattern = new RegExp(
    `\\b${escaped}\\b([\\s\\S]*?)(\\bwhere\\b|\\bgroup\\s+by\\b|\\border\\s+by\\b|\\bhaving\\b|\\blimit\\b|\\boffset\\b|\\bfetch\\b|$)`,
    "i",
  );
  return context.maskedSql.match(pattern)?.[1]?.trim() ?? null;
};

export const splitColumns = (clause: string): string[] => {
  const columns: string[] = [];
  let current = "";
  let depth = 0;
  for (const character of clause) {
    if (character === "(") depth += 1;
    if (character === ")") depth = Math.max(0, depth - 1);
    if (character === "," && depth === 0) {
      if (current.trim()) columns.push(current.trim());
      current = "";
    } else {
      current += character;
    }
  }
  if (current.trim()) columns.push(current.trim());
  return columns;
};

export const statementHasKeyword = (statement: string, keyword: string) =>
  new RegExp(`\\b${keyword}\\b`, "i").test(statement);

/** Find a top-level action after a CTE without inspecting its nested SELECT. */
export const actionStart = (statement: string, action: "update" | "delete"): number => {
  if (!/^\s*with\b/i.test(statement)) {
    const match = statement.match(action === "delete" ? /^(\s*)delete\s+from\b/i : /^(\s*)update\b/i);
    return match ? match[1]!.length : -1;
  }
  let depth = 0;
  let closedCte = false;
  for (let index = 0; index < statement.length; index += 1) {
    if (statement[index] === "(") depth += 1;
    else if (statement[index] === ")") {
      depth = Math.max(0, depth - 1);
      if (depth === 0) closedCte = true;
    } else if (depth === 0 && closedCte && /^(?:select|insert|update|delete|merge)\b/i.test(statement.slice(index)) &&
      (index === 0 || !/\w/.test(statement[index - 1]!))) {
      const keyword = statement.slice(index).match(/^\w+/i)?.[0].toLowerCase();
      return keyword === action ? index : -1;
    }
  }
  return -1;
};

/** Input must be a masked SQL statement: comments and literals stay blanked. */
export const hasTopLevelWhere = (statement: string): boolean => {
  let depth = 0;
  for (let index = 0; index < statement.length; index += 1) {
    const character = statement[index];
    if (character === "(") depth += 1;
    else if (character === ")") depth = Math.max(0, depth - 1);
    else if (depth === 0 && /^where\b/i.test(statement.slice(index)) &&
      (index === 0 || !/[\w]/.test(statement[index - 1]!))) return true;
  }
  return false;
};
