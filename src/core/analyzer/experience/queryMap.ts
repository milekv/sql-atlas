import type { TranslationKey } from "../../../i18n/types";
import type { AnalyzerFinding, RuleId } from "../types";
import type { QueryMapClause, QueryMapSection } from "./types";

interface ClauseDefinition {
  clause: QueryMapClause;
  startPattern: RegExp;
  endPatterns: RegExp[];
  noteKey: TranslationKey;
  relatedRuleIds: RuleId[];
}

const clauseDefinitions: ClauseDefinition[] = [
  {
    clause: "select",
    startPattern: /\bselect\b/i,
    endPatterns: [/\bfrom\b/i],
    noteKey: "analyzer.queryMap.note.select",
    relatedRuleIds: ["select-star", "distinct-overuse", "unbounded-select"],
  },
  {
    clause: "from",
    startPattern: /\bfrom\b/i,
    endPatterns: [
      /\b(?:inner|left|right|full|cross)?\s+join\b/i,
      /\bwhere\b/i,
      /\bgroup\s+by\b/i,
      /\bhaving\b/i,
      /\border\s+by\b/i,
      /\blimit\b/i,
      /\bfetch\s+(?:first|next)\b/i,
      /\boffset\b/i,
    ],
    noteKey: "analyzer.queryMap.note.from",
    relatedRuleIds: ["unbounded-select"],
  },
  {
    clause: "join",
    startPattern: /\b(?:inner|left(?:\s+outer)?|right(?:\s+outer)?|full(?:\s+outer)?|cross)?\s+join\b/i,
    endPatterns: [
      /\bwhere\b/i,
      /\bgroup\s+by\b/i,
      /\bhaving\b/i,
      /\border\s+by\b/i,
      /\blimit\b/i,
      /\bfetch\s+(?:first|next)\b/i,
      /\boffset\b/i,
    ],
    noteKey: "analyzer.queryMap.note.join",
    relatedRuleIds: ["cross-join", "missing-join-condition", "too-many-joins"],
  },
  {
    clause: "where",
    startPattern: /\bwhere\b/i,
    endPatterns: [
      /\bgroup\s+by\b/i,
      /\bhaving\b/i,
      /\border\s+by\b/i,
      /\blimit\b/i,
      /\bfetch\s+(?:first|next)\b/i,
      /\boffset\b/i,
    ],
    noteKey: "analyzer.queryMap.note.where",
    relatedRuleIds: [
      "function-in-where",
      "leading-wildcard-like",
      "too-many-or-conditions",
      "not-in-null-risk",
      "nullable-not-in",
      "implicit-conversion-risk",
    ],
  },
  {
    clause: "group-by",
    startPattern: /\bgroup\s+by\b/i,
    endPatterns: [
      /\bhaving\b/i,
      /\border\s+by\b/i,
      /\blimit\b/i,
      /\bfetch\s+(?:first|next)\b/i,
      /\boffset\b/i,
    ],
    noteKey: "analyzer.queryMap.note.groupBy",
    relatedRuleIds: ["group-by-many-columns"],
  },
  {
    clause: "having",
    startPattern: /\bhaving\b/i,
    endPatterns: [
      /\border\s+by\b/i,
      /\blimit\b/i,
      /\bfetch\s+(?:first|next)\b/i,
      /\boffset\b/i,
    ],
    noteKey: "analyzer.queryMap.note.having",
    relatedRuleIds: ["group-by-many-columns"],
  },
  {
    clause: "order-by",
    startPattern: /\border\s+by\b/i,
    endPatterns: [/\blimit\b/i, /\bfetch\s+(?:first|next)\b/i, /\boffset\b/i],
    noteKey: "analyzer.queryMap.note.orderBy",
    relatedRuleIds: [
      "order-by-without-limit",
      "offset-pagination",
      "order-by-random",
    ],
  },
  {
    clause: "limit",
    startPattern: /\b(?:limit\s+\d+|fetch\s+(?:first|next)\s+\d+\s+rows?|top\s+\d+)\b/i,
    endPatterns: [/\boffset\b/i],
    noteKey: "analyzer.queryMap.note.limit",
    relatedRuleIds: ["order-by-without-limit", "offset-pagination"],
  },
  {
    clause: "offset",
    startPattern: /\boffset\s+\d+\b/i,
    endPatterns: [],
    noteKey: "analyzer.queryMap.note.offset",
    relatedRuleIds: ["offset-pagination"],
  },
];

const cleanFragment = (fragment: string): string =>
  fragment.trim().replace(/;+\s*$/, "").trim();

const findFragment = (
  sql: string,
  startPattern: RegExp,
  endPatterns: RegExp[],
): string | null => {
  const startMatch = startPattern.exec(sql);

  if (!startMatch || startMatch.index === undefined) {
    return null;
  }

  const startIndex = startMatch.index;
  const tail = sql.slice(startIndex);
  const endIndex = endPatterns
    .map((pattern) => pattern.exec(tail)?.index)
    .filter((index): index is number => typeof index === "number" && index > 0)
    .sort((left, right) => left - right)[0];

  return cleanFragment(tail.slice(0, endIndex ?? tail.length));
};

const relatedIssuesForClause = (
  findings: AnalyzerFinding[],
  relatedRuleIds: RuleId[],
): RuleId[] =>
  findings
    .filter((finding) => relatedRuleIds.includes(finding.id))
    .map((finding) => finding.id);

export const extractQueryMap = (
  sql: string,
  findings: AnalyzerFinding[] = [],
): QueryMapSection[] =>
  clauseDefinitions
    .map((definition) => {
      const fragment = findFragment(
        sql,
        definition.startPattern,
        definition.endPatterns,
      );

      if (!fragment) {
        return null;
      }

      return {
        clause: definition.clause,
        fragment,
        noteKey: definition.noteKey,
        relatedIssueIds: relatedIssuesForClause(
          findings,
          definition.relatedRuleIds,
        ),
      } satisfies QueryMapSection;
    })
    .filter((section): section is QueryMapSection => section !== null);
