import { useApp } from "../../app/AppProvider";
import { Badge } from "../../components/ui/Badge";
import { Card } from "../../components/ui/Card";
import { sampleExplainPlan } from "../../core/explain/samplePlan";
import type { PostgresExplainPlanNode } from "../../core/explain/types";

export const ExplainVisualizerPage = () => {
  const { t } = useApp();

  return (
    <div className="space-y-6">
      <PageHeader title={t("explain.title")} subtitle={t("explain.subtitle")} />
      <Card>
        <h2 className="mb-4 text-xl font-semibold">{t("explain.placeholder")}</h2>
        <PlanNode node={sampleExplainPlan} depth={0} />
      </Card>
    </div>
  );
};

const PlanNode = ({
  node,
  depth,
}: {
  node: PostgresExplainPlanNode;
  depth: number;
}) => (
  <div
    className="border-l border-atlas-border pl-4"
    style={{ marginLeft: depth === 0 ? 0 : 18 }}
  >
    <div className="mb-3 rounded-md border border-atlas-border bg-atlas-panelStrong p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={node.nodeType === "Seq Scan" ? "warning" : "cyan"}>
          {node.nodeType}
        </Badge>
        {node.relationName ? <Badge tone="neutral">{node.relationName}</Badge> : null}
        {node.indexName ? <Badge tone="success">{node.indexName}</Badge> : null}
      </div>
      <div className="mt-3 grid gap-2 text-sm text-atlas-muted sm:grid-cols-2 lg:grid-cols-4">
        <span>cost {node.startupCost}..{node.totalCost}</span>
        <span>rows {node.planRows} / {node.actualRows}</span>
        <span>time {node.actualStartupTime}..{node.actualTotalTime} ms</span>
        <span>blocks hit/read {node.sharedHitBlocks}/{node.sharedReadBlocks}</span>
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
