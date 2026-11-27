import type { AnalyzerRule } from "../types";
import { createFinding } from "./ruleUtils";

export const orderByRandomRule: AnalyzerRule = {
  id: "order-by-random",
  titleKey: "rule.order-by-random.title",
  passedKey: "rule.order-by-random.passed",
  category: "performance",
  analyze: (context) => {
    const order = /\border\s+by\s+([\s\S]*?)(?:\blimit\b|\boffset\b|\bfetch\b|$)/i.exec(context.maskedSql);
    if (!order) return null;
    const start = order.index + order[0].indexOf(order[1]!);
    return [...order[1]!.matchAll(/\b(?:random|rand|newid)\s*\(\s*\)/gi)].map((match) => createFinding({
      id: "order-by-random",
      severity: "warning",
      category: "performance",
      detectedFragment: context.sql.slice(start + match.index, start + match.index + match[0].length),
      statementOffset: start + match.index,
      scoreImpact: 12,
      relatedTopicIds: ["query-optimization-basics", "order-by"],
      // Sampling changes selection probabilities and result semantics. Do not
      // offer a pasteable rewrite without workload and distribution context.
    }));
  },
};
