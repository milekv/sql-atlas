import type { Language } from "../types";
import { antiPatterns } from "./antiPatterns";
import { knowledgeTopics } from "./knowledgeTopics";
import type { KnowledgeDialect, KnowledgeTopic, TopicCategory, TopicDifficulty } from "./types";

export const topicCategories: TopicCategory[] = [
  "basics",
  "joins",
  "aggregation",
  "indexes",
  "performance",
  "transactions",
  "explain",
  "dialects",
  "antipatterns",
];

export const getKnowledgeTopicById = (
  topicId: string,
): KnowledgeTopic | undefined =>
  knowledgeTopics.find((topic) => topic.id === topicId);

export const searchKnowledgeTopics = ({
  language,
  query,
  category,
  difficulty = "all",
  dialect = "all",
}: {
  language: Language;
  query: string;
  category: TopicCategory | "all";
  difficulty?: TopicDifficulty | "all";
  dialect?: KnowledgeDialect | "all";
}): KnowledgeTopic[] => {
  const normalizedQuery = query.trim().toLowerCase();

  return knowledgeTopics.filter((topic) => {
    const text = topic.translations[language];
    const matchesCategory = category === "all" || topic.category === category;
    const matchesDifficulty =
      difficulty === "all" || topic.difficulty === difficulty;
    const matchesDialect =
      dialect === "all" || topic.dialects.includes(dialect);
    const matchesQuery =
      normalizedQuery.length === 0 ||
      `${text.title} ${text.shortDescription}`.toLowerCase().includes(normalizedQuery);

    return matchesCategory && matchesDifficulty && matchesDialect && matchesQuery;
  });
};

export const contentStats = {
  knowledgeTopics: knowledgeTopics.length,
  antiPatterns: antiPatterns.length,
  dialects: 5,
};
