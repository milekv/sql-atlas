import { useMemo, useState } from "react";
import { useApp } from "../../app/AppProvider";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { CodeBlock } from "../../components/ui/CodeBlock";
import { SelectInput, TextInput } from "../../components/ui/Field";
import {
  getKnowledgeTopicById,
  searchKnowledgeTopics,
  topicCategories,
} from "../../content/contentRegistry";
import { knowledgeTopics } from "../../content/knowledgeTopics";
import type {
  KnowledgeDialect,
  KnowledgeTopic,
  TopicCategory,
  TopicDifficulty,
} from "../../content/types";
import type { TranslationKey } from "../../i18n/types";

export const KnowledgeBasePage = () => {
  const { language, t } = useApp();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<TopicCategory | "all">("all");
  const [difficulty, setDifficulty] = useState<TopicDifficulty | "all">("all");
  const [dialect, setDialect] = useState<KnowledgeDialect | "all">("all");
  const [selectedTopicId, setSelectedTopicId] = useState(knowledgeTopics[0].id);
  const topics = useMemo(
    () => searchKnowledgeTopics({ language, query, category, difficulty, dialect }),
    [category, dialect, difficulty, language, query],
  );
  const selectedTopic =
    getKnowledgeTopicById(selectedTopicId) ?? topics[0] ?? knowledgeTopics[0];

  return (
    <div className="space-y-6">
      <PageHeader title={t("knowledge.title")} subtitle={t("knowledge.subtitle")} />
      <section className="grid gap-4 lg:grid-cols-[360px_1fr]">
        <div className="space-y-3">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
            <TextInput
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("knowledge.search")}
            />
            <SelectInput
              value={category}
              onChange={(event) =>
                setCategory(event.target.value as TopicCategory | "all")
              }
            >
              <option value="all">{t("knowledge.allCategories")}</option>
              {topicCategories.map((item) => (
                <option key={item} value={item}>
                  {t(`topicCategory.${item}` as TranslationKey)}
                </option>
              ))}
            </SelectInput>
            <SelectInput
              value={difficulty}
              onChange={(event) =>
                setDifficulty(event.target.value as TopicDifficulty | "all")
              }
            >
              <option value="all">{t("knowledge.allDifficulties")}</option>
              {(["beginner", "intermediate", "advanced"] as TopicDifficulty[]).map(
                (item) => (
                  <option key={item} value={item}>
                    {t(`difficulty.${item}` as TranslationKey)}
                  </option>
                ),
              )}
            </SelectInput>
            <SelectInput
              value={dialect}
              onChange={(event) =>
                setDialect(event.target.value as KnowledgeDialect | "all")
              }
            >
              <option value="all">{t("knowledge.allDialects")}</option>
              {[
                "postgresql",
                "mysql",
                "oracle",
                "sqlite",
                "sqlserver",
                "generic",
              ].map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </SelectInput>
          </div>
          <div className="max-h-[720px] space-y-3 overflow-auto pr-1">
            {topics.length === 0 ? (
              <Card>
                <p className="text-sm text-atlas-muted">{t("knowledge.noResults")}</p>
              </Card>
            ) : (
              topics.map((topic) => (
                <TopicListItem
                  key={topic.id}
                  topic={topic}
                  active={topic.id === selectedTopic.id}
                  onSelect={() => setSelectedTopicId(topic.id)}
                />
              ))
            )}
          </div>
        </div>
        <TopicDocument topic={selectedTopic} />
      </section>
    </div>
  );
};

const TopicListItem = ({
  topic,
  active,
  onSelect,
}: {
  topic: KnowledgeTopic;
  active: boolean;
  onSelect: () => void;
}) => {
  const { language, t } = useApp();
  const text = topic.translations[language];

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-lg border p-4 text-left transition ${
        active
          ? "border-atlas-cyan/60 bg-atlas-cyan/10"
          : "border-atlas-border bg-atlas-panel hover:border-atlas-cyan/50"
      }`}
    >
      <div className="mb-2 flex flex-wrap gap-2">
        <Badge tone="neutral">
          {t(`topicCategory.${topic.category}` as TranslationKey)}
        </Badge>
        <Badge tone="violet">
          {t(`difficulty.${topic.difficulty}` as TranslationKey)}
        </Badge>
      </div>
      <h3 className="font-semibold">{text.title}</h3>
      <p className="mt-1 text-sm leading-6 text-atlas-muted">
        {text.shortDescription}
      </p>
    </button>
  );
};

const TopicDocument = ({ topic }: { topic: KnowledgeTopic }) => {
  const { language, t } = useApp();
  const text = topic.translations[language];
  const relatedTopics = topic.relatedTopics
    .map((topicId) => getKnowledgeTopicById(topicId))
    .filter((relatedTopic): relatedTopic is KnowledgeTopic => Boolean(relatedTopic));

  return (
    <article className="rounded-lg border border-atlas-border bg-atlas-panel p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-3xl font-semibold">{text.title}</h2>
          <p className="mt-2 max-w-3xl leading-7 text-atlas-muted">
            {text.explanation}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge tone="neutral">
            {t(`topicCategory.${topic.category}` as TranslationKey)}
          </Badge>
          <Badge tone="violet">
            {t(`difficulty.${topic.difficulty}` as TranslationKey)}
          </Badge>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {topic.dialects.map((dialect) => (
          <Badge key={dialect} tone="cyan">
            {dialect}
          </Badge>
        ))}
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <DocBlock title={t("knowledge.syntax")} code={text.syntax} />
        <DocBlock title={t("knowledge.basicExample")} code={text.basicExample} />
        <DocBlock
          title={t("knowledge.advancedExample")}
          code={text.advancedExample}
          className="xl:col-span-2"
        />
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <ListSection title={t("knowledge.commonMistakes")} items={text.commonMistakes} />
        <ListSection title={t("knowledge.performanceTips")} items={text.performanceTips} />
      </div>

      {relatedTopics.length > 0 ? (
        <div className="mt-6">
          <h3 className="mb-3 text-sm font-semibold">{t("knowledge.related")}</h3>
          <div className="flex flex-wrap gap-2">
            {relatedTopics.map((relatedTopic) => (
              <Badge key={relatedTopic.id} tone="neutral">
                {relatedTopic.translations[language].title}
              </Badge>
            ))}
          </div>
        </div>
      ) : null}
    </article>
  );
};

const DocBlock = ({
  title,
  code,
  className,
}: {
  title: string;
  code: string;
  className?: string;
}) => (
  <section className={className}>
    <h3 className="mb-2 text-sm font-semibold">{title}</h3>
    <CodeBlock code={code} />
  </section>
);

const ListSection = ({ title, items }: { title: string; items: string[] }) => (
  <section className="rounded-md border border-atlas-border bg-atlas-panelStrong p-4">
    <h3 className="mb-3 text-sm font-semibold">{title}</h3>
    <ul className="space-y-2 text-sm leading-6 text-atlas-muted">
      {items.map((item) => (
        <li key={item}>- {item}</li>
      ))}
    </ul>
  </section>
);

const PageHeader = ({ title, subtitle }: { title: string; subtitle: string }) => (
  <section>
    <h1 className="text-3xl font-semibold">{title}</h1>
    <p className="mt-2 text-atlas-muted">{subtitle}</p>
  </section>
);
