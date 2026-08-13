import { analyzerRules } from "./rules";
import type { RuleId } from "./types";

export interface AnalyzerConfiguration {
  rules?: Partial<Record<RuleId, "on" | "off">>;
}

export const ruleIds = analyzerRules.map((rule) => rule.id);
const knownRuleIds = new Set<string>(ruleIds);

export const parseRuleList = (value: string, source = "rule list"): RuleId[] => {
  const ids = value.split(/[\s,]+/).filter(Boolean);
  const unknown = ids.filter((id) => !knownRuleIds.has(id));
  if (unknown.length > 0) {
    throw new Error(`${source}: unknown rule ${unknown.join(", ")}.`);
  }
  return [...new Set(ids)] as RuleId[];
};

export const parseAnalyzerConfiguration = (
  content: string,
  source: string,
): AnalyzerConfiguration => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error(`${source}: invalid JSON.`);
  }
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error(`${source}: configuration must be a JSON object.`);
  }
  const rules = (parsed as { rules?: unknown }).rules;
  if (rules === undefined) return {};
  if (rules === null || typeof rules !== "object" || Array.isArray(rules)) {
    throw new Error(`${source}: rules must be an object.`);
  }
  for (const [id, value] of Object.entries(rules)) {
    if (!knownRuleIds.has(id)) throw new Error(`${source}: unknown rule ${id}.`);
    if (value !== "on" && value !== "off") {
      throw new Error(`${source}: rule ${id} must be "on" or "off".`);
    }
  }
  return { rules: rules as AnalyzerConfiguration["rules"] };
};

export const disabledRules = (configuration: AnalyzerConfiguration): RuleId[] =>
  Object.entries(configuration.rules ?? {})
    .filter(([, value]) => value === "off")
    .map(([id]) => id as RuleId);
