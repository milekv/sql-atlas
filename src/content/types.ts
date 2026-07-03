import { z } from "zod";
import type { AnalyzerSeverity, RuleId, SqlDialect } from "../core/analyzer/types";
import type { Language } from "../types";

export type TopicCategory =
  | "basics"
  | "joins"
  | "aggregation"
  | "indexes"
  | "performance"
  | "transactions"
  | "explain"
  | "dialects"
  | "antipatterns";

export type TopicDifficulty = "beginner" | "intermediate" | "advanced";

export type KnowledgeDialect = SqlDialect;

export interface KnowledgeTopicText {
  title: string;
  shortDescription: string;
  explanation: string;
  syntax: string;
  basicExample: string;
  advancedExample: string;
  commonMistakes: string[];
  performanceTips: string[];
}

export interface KnowledgeTopic {
  id: string;
  slug: string;
  category: TopicCategory;
  difficulty: TopicDifficulty;
  dialects: KnowledgeDialect[];
  relatedTopics: string[];
  relatedRules: RuleId[];
  translations: Record<Language, KnowledgeTopicText>;
}

export interface AntiPatternText {
  title: string;
  explanation: string;
  whyItHurtsPerformance: string;
  suggestedFix: string;
}

export interface AntiPattern {
  id: string;
  severity: Exclude<AnalyzerSeverity, "success">;
  badExample: string;
  goodExample: string;
  relatedKnowledgeTopic: string;
  translations: Record<Language, AntiPatternText>;
}

export const knowledgeTopicSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  category: z.enum([
    "basics",
    "joins",
    "aggregation",
    "indexes",
    "performance",
    "transactions",
    "explain",
    "dialects",
    "antipatterns",
  ]),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]),
  dialects: z
    .enum(["postgresql", "mysql", "oracle", "sqlite", "sqlserver", "generic"])
    .array()
    .min(1),
  relatedTopics: z.string().array(),
  relatedRules: z.string().array(),
  translations: z.record(
    z.enum(["en", "pl"]),
    z.object({
      title: z.string(),
      shortDescription: z.string(),
      explanation: z.string(),
      syntax: z.string(),
      basicExample: z.string(),
      advancedExample: z.string(),
      commonMistakes: z.string().array(),
      performanceTips: z.string().array(),
    }),
  ),
});
