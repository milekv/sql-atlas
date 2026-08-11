import { useState } from "react";
import { useApp } from "../../app/AppProvider";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { parsePostgresExplainJson } from "../../core/explain/parsePostgresExplainJson";
import { sampleExplainJson } from "../../core/explain/samplePlan";
import type {
  ExplainRiskHint,
  ParsedExplainPlan,
  PostgresExplainPlanNode,
} from "../../core/explain/types";
import type { Translator } from "../../i18n/types";

export const ExplainVisualizerPage = () => {
  const { t } = useApp();
  const [input, setInput] = useState(sampleExplainJson);
  const [result, setResult] = useState<ParsedExplainPlan>(() =>
    parsePostgresExplainJson(sampleExplainJson),
  );
  const [hasError, setHasError] = useState(false);

  const analyze = () => {
    try {
      setResult(parsePostgresExplainJson(input));
      setHasError(false);
    } catch {
      setHasError(true);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title={t("explain.title")} subtitle={t("explain.subtitle")} />

      <Card>
        <label className="text-sm font-medium" htmlFor="explain-json">
          {t("explain.inputLabel")}
        </label>
        <textarea
          className="mt-3 min-h-72 w-full resize-y rounded-md border border-atlas-border bg-atlas-panelStrong p-4 font-mono text-xs leading-6 text-atlas-text outline-none transition focus:border-atlas-cyan/70"
          id="explain-json"
          onChange={(event) => setInput(event.target.value)}
          spellCheck={false}
          value={input}
        />
        <div className="mt-4 flex flex-wrap gap-2">
          <Button onClick={analyze} variant="primary">{t("explain.analyze")}</Button>
          <Button
            onClick={() => {
              setInput(sampleExplainJson);
              setResult(parsePostgresExplainJson(sampleExplainJson));
              setHasError(false);
            }}
          >
            {t("actions.loadSample")}
          </Button>
          <Button
            onClick={() => {
              setInput("");
              setHasError(false);
            }}
            variant="ghost"
          >
            {t("actions.clear")}
          </Button>
        </div>
        <p className="mt-4 text-sm text-atlas-muted">{t("explain.privacy")}</p>
        {hasError ? (
          <p className="mt-4 rounded-md border border-atlas-red/50 bg-atlas-red/10 p-3 text-sm text-red-200" role="alert">
            {t("explain.invalid")}
          </p>
        ) : null}
      </Card>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Metric label={t("explain.executionTime")} value={formatMs(result.summary.executionTime)} />
        <Metric label={t("explain.planningTime")} value={formatMs(result.summary.planningTime)} />
        <Metric label={t("explain.nodes")} value={String(result.summary.nodeCount)} />
        <Metric label={t("explain.actualRows")} value={formatNumber(result.summary.actualRows)} />
        <Metric label={t("explain.readBlocks")} value={formatNumber(result.summary.sharedReadBlocks)} />
      </section>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold">{t("explain.risks")}</h2>
          <Badge tone={result.risks.length ? "warning" : "success"}>
            {result.risks.length ? result.risks.length : t("explain.noRisks")}
          </Badge>
        </div>
        {result.risks.length ? (
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            {result.risks.map((risk) => (
              <div className="rounded-md border border-atlas-amber/40 bg-atlas-amber/10 p-4" key={risk.id}>
                <div className="flex flex-wrap gap-2">
                  <Badge tone="warning">{risk.nodeType}</Badge>
                  {risk.relationName ? <Badge tone="neutral">{risk.relationName}</Badge> : null}
                </div>
                <p className="mt-3 text-sm text-atlas-muted">{describeRisk(risk, t)}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-atlas-muted">{t("explain.noRisksBody")}</p>
        )}
      </Card>

      <Card>
        <h2 className="mb-4 text-xl font-semibold">{t("explain.planTree")}</h2>
        <PlanNode node={result.root} depth={0} />
      </Card>
    </div>
  );
};

const Metric = ({ label, value }: { label: string; value: string }) => (
  <Card>
    <div className="text-xs uppercase tracking-wide text-atlas-muted">{label}</div>
    <div className="mt-2 text-2xl font-semibold">{value}</div>
  </Card>
);

const formatNumber = (value?: number) =>
  value === undefined ? "n/a" : new Intl.NumberFormat("en-US").format(value);

const formatMs = (value?: number) => value === undefined ? "n/a" : `${value.toFixed(2)} ms`;

const describeRisk = (risk: ExplainRiskHint, t: Translator): string => {
  const variables = { value: formatNumber(risk.value) };
  switch (risk.code) {
    case "large-seq-scan":
      return t("explain.risk.largeSeqScan", variables);
    case "estimate-mismatch":
      return t("explain.risk.estimateMismatch", variables);
    case "temp-io":
      return t("explain.risk.tempIo", variables);
    case "external-sort":
      return t("explain.risk.externalSort", variables);
    case "filter-waste":
      return t("explain.risk.filterWaste", variables);
  }
};

const PlanNode = ({ node, depth }: { node: PostgresExplainPlanNode; depth: number }) => (
  <div className="border-l border-atlas-border pl-3 sm:pl-4" style={{ marginLeft: depth === 0 ? 0 : 12 }}>
    <div className="mb-3 rounded-md border border-atlas-border bg-atlas-panelStrong p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={node.nodeType === "Seq Scan" ? "warning" : "cyan"}>{node.nodeType}</Badge>
        {node.relationName ? <Badge tone="neutral">{node.relationName}</Badge> : null}
        {node.indexName ? <Badge tone="success">{node.indexName}</Badge> : null}
      </div>
      <div className="mt-3 grid gap-2 text-sm text-atlas-muted sm:grid-cols-2 xl:grid-cols-4">
        <span>cost {formatNumber(node.startupCost)}..{formatNumber(node.totalCost)}</span>
        <span>rows {formatNumber(node.planRows)} / {formatNumber(node.actualRows)}</span>
        <span>time {formatMs(node.actualTotalTime)}</span>
        <span>blocks hit/read {formatNumber(node.sharedHitBlocks)}/{formatNumber(node.sharedReadBlocks)}</span>
      </div>
    </div>
    {node.children.map((child, index) => (
      <PlanNode key={`${child.nodeType}-${index}`} node={child} depth={depth + 1} />
    ))}
  </div>
);

const PageHeader = ({ title, subtitle }: { title: string; subtitle: string }) => (
  <section>
    <h1 className="text-3xl font-semibold">{title}</h1>
    <p className="mt-2 text-atlas-muted">{subtitle}</p>
  </section>
);
