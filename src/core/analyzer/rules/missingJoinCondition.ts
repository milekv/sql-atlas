import type { AnalyzerRule } from "../types";
import { createFinding, firstMatch } from "./ruleUtils";

const joinPattern =
  /\b(?:(natural|cross)\s+)?(?:(?:inner|left|right|full)(?:\s+outer)?\s+)?join\s+[\w."]+(?:\s+(?:as\s+)?(?!on\b|using\b|join\b|left\b|right\b|full\b|inner\b|cross\b|natural\b|where\b|group\b|order\b|having\b|limit\b|offset\b|fetch\b)[\w"]+)?/gi;

const missingJoinPredicate = (sql: string): RegExpMatchArray | undefined => {
  const joins = Array.from(sql.matchAll(joinPattern));

  return joins.find((join, index) => {
    if (join[1]) return false;
    const nextJoin = joins[index + 1]?.index ?? sql.length;
    const tail = sql.slice(join.index! + join[0].length, nextJoin);
    const clauseBoundary = tail.search(
      /\bwhere\b|\bgroup\s+by\b|\border\s+by\b|\bhaving\b|\blimit\b|\boffset\b|\bfetch\b/i,
    );
    const joinClause = clauseBoundary < 0 ? tail : tail.slice(0, clauseBoundary);
    return !/\bon\b|\busing\s*\(/i.test(joinClause);
  });
};

export const missingJoinConditionRule: AnalyzerRule = {
  id: "missing-join-condition",
  titleKey: "rule.missing-join-condition.title",
  passedKey: "rule.missing-join-condition.passed",
  category: "safety",
  analyze: (context) => {
    const commaJoin = firstMatch(
      context,
      /\bfrom\s+[\w."]+(?:\s+\w+)?\s*,\s*[\w."]+(?:\s+\w+)?/i,
    );
    const missingJoin = missingJoinPredicate(context.maskedSql);

    if (!commaJoin && !missingJoin) {
      return null;
    }

    return createFinding({
      id: "missing-join-condition",
      severity: "critical",
      category: "safety",
      detectedFragment:
        commaJoin ??
        context.sql.slice(missingJoin!.index, missingJoin!.index! + missingJoin![0].length),
      scoreImpact: 25,
      relatedTopicIds: ["join-fundamentals", "inner-join-vs-left-join"],
      suggestedSqlSnippet:
        "SELECT o.id, c.email\nFROM orders o\nJOIN customers c ON c.id = o.customer_id;",
    });
  },
};
