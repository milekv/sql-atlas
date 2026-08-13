import type { AnalyzerRule } from "../types";
import { createFinding, firstMatch } from "./ruleUtils";

const coercingDialects = ["mysql", "oracle", "sqlserver"] as const;

export const implicitConversionRiskRule: AnalyzerRule = {
  id: "implicit-conversion-risk",
  titleKey: "rule.implicit-conversion-risk.title",
  passedKey: "rule.implicit-conversion-risk.passed",
  category: "performance",
  analyze: (context) => {
    if (!coercingDialects.some((dialect) => dialect === context.dialect)) {
      return null;
    }
    const fragment = firstMatch(
      context,
      /\b[\w."]*(?:id|count|amount|price|age|number|total|quantity)[\w."]*\s*=\s*'\d+(?:\.\d+)?'/i,
      "comments",
    );

    if (!fragment) {
      return null;
    }

    return createFinding({
      id: "implicit-conversion-risk",
      severity: "info",
      category: "performance",
      detectedFragment: fragment,
      scoreImpact: 5,
      relatedTopicIds: ["where-filtering", "dialect-differences"],
      suggestedSqlSnippet: "WHERE customer_id = 42",
    });
  },
};
