import type {
  AnalyzerFinding,
  ScoreBreakdown,
} from "./types";

type ScoredCategory = keyof ScoreBreakdown;

const scoredCategories = [
  "performance",
  "safety",
  "readability",
  "indexing",
] as const satisfies ScoredCategory[];

const isScoredCategory = (category: string): category is ScoredCategory =>
  scoredCategories.includes(category as ScoredCategory);

const clampScore = (value: number): number =>
  Math.max(0, Math.min(100, Math.round(value)));

export const calculateScoreBreakdown = (
  findings: AnalyzerFinding[],
): ScoreBreakdown => {
  const initial: ScoreBreakdown = {
    performance: 100,
    safety: 100,
    readability: 100,
    indexing: 100,
  };

  return findings.reduce<ScoreBreakdown>((breakdown, finding) => {
    if (!isScoredCategory(finding.category)) {
      return breakdown;
    }

    return {
      ...breakdown,
      [finding.category]: clampScore(
        breakdown[finding.category] - finding.scoreImpact,
      ),
    };
  }, initial);
};

export const calculateOverallScore = (findings: AnalyzerFinding[]): number => {
  const totalImpact = findings.reduce(
    (impact, finding) => impact + finding.scoreImpact,
    0,
  );
  return clampScore(100 - totalImpact);
};
