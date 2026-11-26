import { useState } from "react";
import { useApp } from "../../app/AppProvider";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { parseSqlServerShowplan, type ParsedSqlServerShowplan, type ShowplanOperator } from "../../core/explain/parseSqlServerShowplan";
import { parseSqlServerStatistics, type ParsedSqlServerStatistics } from "../../core/explain/parseSqlServerStatistics";
import { compareSqlServerPlans } from "../../core/explain/compareSqlServerPlans";

export const SqlServerShowplanPage = () => {
  const { t } = useApp();
  const [xml, setXml] = useState("");
  const [plan, setPlan] = useState<ParsedSqlServerShowplan>();
  const [selected, setSelected] = useState<ShowplanOperator>();
  const [error, setError] = useState(false);
  const [messages, setMessages] = useState("");
  const [statistics, setStatistics] = useState<ParsedSqlServerStatistics>();
  const [statisticsError, setStatisticsError] = useState(false);
  const [comparisonPlan, setComparisonPlan] = useState<ParsedSqlServerShowplan>();
  const [comparisonError, setComparisonError] = useState(false);

  const analyze = (source: string) => {
    try {
      const parsed = parseSqlServerShowplan(source);
      setXml(source);
      setPlan(parsed);
      setSelected(parsed.statements[0]?.root);
      setComparisonPlan(undefined);
      setComparisonError(false);
      setError(false);
    } catch {
      setPlan(undefined);
      setSelected(undefined);
      setComparisonPlan(undefined);
      setError(true);
    }
  };

  return <div className="space-y-5">
    <header>
      <h1 className="text-2xl font-semibold">{t("showplan.title")}</h1>
      <p className="mt-2 text-sm text-atlas-muted">{t("showplan.subtitle")}</p>
    </header>
    <Card className="space-y-3">
      <label htmlFor="showplan-file" className="block text-sm font-medium">{t("showplan.file")}</label>
      <input id="showplan-file" type="file" accept=".sqlplan,.xml,text/xml,application/xml"
        className="block w-full text-sm text-atlas-text file:mr-3 file:rounded file:border file:border-atlas-border file:bg-atlas-panelStrong file:p-2 file:text-atlas-text"
        onChange={async (event) => {
          const file = event.currentTarget.files?.[0];
          if (!file) return;
          if (file.size > 2_000_000) { setError(true); setPlan(undefined); setSelected(undefined); return; }
          analyze(await file.text());
        }} />
      <label htmlFor="showplan-xml" className="block text-sm font-medium">{t("showplan.paste")}</label>
      <textarea id="showplan-xml" value={xml} onChange={(event) => { setXml(event.target.value); setPlan(undefined); setSelected(undefined); setError(false); }}
        className="min-h-32 w-full rounded border border-atlas-border bg-atlas-panelStrong p-3 font-mono text-xs text-atlas-text" spellCheck={false} />
      <Button type="button" variant="primary" onClick={() => analyze(xml)}>{t("explain.analyze")}</Button>
      {error && <p role="alert" className="text-sm text-atlas-red">{t("showplan.invalid")}</p>}
      <p className="text-xs text-atlas-muted">{t("showplan.privacy")}</p>
    </Card>
    {plan && <>
      <p className="text-sm text-atlas-muted">{plan.kind === "actual" ? t("showplan.actual") : t("showplan.estimated")} · {plan.statements.length} {t("showplan.statements")}</p>
      {plan.statements.map((statement, index) => <Card key={`${statement.id ?? index}-${index}`} className="space-y-3">
        <h2 className="font-semibold">{statement.type || "SQL"} #{statement.id ?? index + 1}</h2>
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-atlas-muted">
          {statement.degreeOfParallelism !== undefined && <span>{t("showplan.dop")}: {statement.degreeOfParallelism}</span>}
          {statement.memoryGrant?.grantedMemoryKb !== undefined && <span>{t("showplan.grantedMemory")}: {statement.memoryGrant.grantedMemoryKb} KB</span>}
          {statement.memoryGrant?.maxUsedMemoryKb !== undefined && <span>{t("showplan.usedMemory")}: {statement.memoryGrant.maxUsedMemoryKb} KB</span>}
        </div>
        {summarizeWarnings(statement.warnings ?? []).map(({ detail, count }) => <p key={detail} className="text-xs text-atlas-amber">{t("showplan.conversion")}{count > 1 ? ` (×${count})` : ""}: {detail}</p>)}
        <div className="grid gap-4 lg:grid-cols-[minmax(260px,1fr)_minmax(300px,1fr)]">
          <div className="max-h-[620px] overflow-auto rounded border border-atlas-border p-3" aria-label={t("showplan.tree")}>
            <OperatorTree node={statement.root} onSelect={setSelected} selected={selected} depth={0} />
          </div>
          {selected && <OperatorDetails node={selected} />}
        </div>
      </Card>)}
      <Card className="space-y-3">
        <h2 className="text-lg font-semibold">{t("showplan.compareTitle")}</h2>
        <p className="text-sm text-atlas-muted">{t("showplan.compareHelp")}</p>
        <label htmlFor="showplan-compare-file" className="block text-sm font-medium">{t("showplan.compareFile")}</label>
        <input id="showplan-compare-file" type="file" accept=".sqlplan,.xml,text/xml,application/xml"
          className="block w-full text-sm text-atlas-text file:mr-3 file:rounded file:border file:border-atlas-border file:bg-atlas-panelStrong file:p-2 file:text-atlas-text"
          onChange={async (event) => {
            const file = event.currentTarget.files?.[0];
            if (!file) return;
            try {
              if (file.size > 2_000_000) throw new Error("Plan too large");
              setComparisonPlan(parseSqlServerShowplan(await file.text()));
              setComparisonError(false);
            } catch { setComparisonPlan(undefined); setComparisonError(true); }
          }} />
        {comparisonError && <p role="alert" className="text-sm text-atlas-red">{t("showplan.invalid")}</p>}
        {comparisonPlan && <PlanComparison left={plan} right={comparisonPlan} />}
      </Card>
    </>}
    <Card className="space-y-3">
      <h2 className="text-lg font-semibold">{t("showplan.statistics")}</h2>
      <p className="text-sm text-atlas-muted">{t("showplan.statisticsHelp")}</p>
      <label htmlFor="sqlserver-messages" className="block text-sm font-medium">{t("showplan.messages")}</label>
      <textarea id="sqlserver-messages" value={messages} onChange={(event) => { setMessages(event.target.value); setStatistics(undefined); }}
        className="min-h-28 w-full rounded border border-atlas-border bg-atlas-panelStrong p-3 font-mono text-xs text-atlas-text" spellCheck={false} />
      <Button type="button" onClick={() => {
        try { setStatistics(parseSqlServerStatistics(messages)); setStatisticsError(false); }
        catch { setStatistics(undefined); setStatisticsError(true); }
      }}>{t("showplan.importStatistics")}</Button>
      {statisticsError && <p role="alert" className="text-sm text-atlas-red">{t("showplan.statisticsError")}</p>}
      {statistics && (statistics.io.length || statistics.time.length ? <>
        {statistics.io.length > 0 && <div className="overflow-x-auto"><table className="w-full text-left text-sm">
          <thead><tr><th className="p-2">{t("showplan.object")}</th><th className="p-2">{t("showplan.scans")}</th><th className="p-2">{t("showplan.reads")}</th><th className="p-2">{t("showplan.physicalReads")}</th></tr></thead>
          <tbody>{statistics.io.map((entry, index) => <tr key={`${entry.table}-${index}`} className="border-t border-atlas-border"><td className="p-2">{entry.table}</td><td className="p-2">{display(entry.scanCount)}</td><td className="p-2">{display(entry.logicalReads)}</td><td className="p-2">{display(entry.physicalReads)}</td></tr>)}</tbody>
        </table></div>}
        {statistics.time.map((entry, index) => <p key={index} className="text-sm">{entry.phase === "compile" ? t("showplan.compile") : t("showplan.execution")}: {t("showplan.cpu")} {entry.cpuMs} ms · {t("showplan.elapsed")} {entry.elapsedMs} ms</p>)}
        <p className="text-xs text-atlas-muted">{t("showplan.statisticsCaveat")}</p>
      </> : <p className="text-sm text-atlas-muted">{t("showplan.noStatistics")}</p>)}
    </Card>
  </div>;
};

const PlanComparison = ({ left, right }: { left: ParsedSqlServerShowplan; right: ParsedSqlServerShowplan }) => {
  const { t } = useApp();
  const result = compareSqlServerPlans(left, right);
  const rows = [
    [t("showplan.rootOperator"), result.left.rootOperator, result.right.rootOperator],
    [t("showplan.operatorCount"), result.left.operators, result.right.operators],
    [t("showplan.estimatedRows"), result.left.rootEstimatedRows, result.right.rootEstimatedRows],
    [t("showplan.actualRows"), result.left.rootActualRows, result.right.rootActualRows],
    [t("showplan.estimatedCost"), result.left.estimatedSubtreeCost, result.right.estimatedSubtreeCost],
    [t("showplan.ceVersion"), result.left.cardinalityEstimationModelVersion, result.right.cardinalityEstimationModelVersion],
  ];
  return <div className="space-y-3">
    <p role={result.sameQueryHash === false ? "alert" : undefined} className={`text-sm ${result.sameQueryHash === false ? "text-atlas-amber" : "text-atlas-muted"}`}>
      {result.sameQueryHash === true ? t("showplan.hashMatch") : result.sameQueryHash === false ? t("showplan.hashMismatch") : t("showplan.hashUnknown")}
    </p>
    <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr>
      <th className="p-2">{t("showplan.metric")}</th><th className="p-2">{t("showplan.firstPlan")}</th><th className="p-2">{t("showplan.secondPlan")}</th>
    </tr></thead><tbody>{rows.map(([label, first, second]) => <tr key={String(label)} className="border-t border-atlas-border">
      <th scope="row" className="p-2 font-normal">{label}</th><td className="p-2">{display(first)}</td><td className="p-2">{display(second)}</td>
    </tr>)}</tbody></table></div>
    <p className="text-xs text-atlas-muted">{t("showplan.compareCaveat")}</p>
  </div>;
};

const display = (value?: number | string) => value === undefined ? "—" : String(value);

const summarizeWarnings = (warnings: readonly { detail?: string }[]) => {
  const counts = new Map<string, number>();
  for (const warning of warnings) {
    const detail = warning.detail ?? "—";
    counts.set(detail, (counts.get(detail) ?? 0) + 1);
  }
  return [...counts].map(([detail, count]) => ({ detail, count }));
};

const OperatorTree = ({ node, onSelect, selected, depth }: { node: ShowplanOperator; onSelect: (node: ShowplanOperator) => void; selected?: ShowplanOperator; depth: number }) => (
  <div className="border-l border-atlas-border pl-3">
    <button type="button" aria-current={selected === node ? "true" : undefined} onClick={() => onSelect(node)}
      className={`w-full rounded px-2 py-1 text-left text-sm hover:bg-atlas-panelStrong ${selected === node ? "bg-atlas-panelStrong text-atlas-cyan" : ""}`}>
      {node.physicalOp} <span className="text-xs text-atlas-muted">#{display(node.nodeId)}</span>
    </button>
    {node.children.length > 0 && <details open={depth === 0} className="ml-2"><summary className="cursor-pointer py-1 text-xs text-atlas-muted">{node.children.length} ↓</summary>
      <div className="space-y-1">{node.children.map((child, index) => <OperatorTree key={`${child.nodeId ?? index}-${index}`} node={child} onSelect={onSelect} selected={selected} depth={depth + 1} />)}</div>
    </details>}
  </div>
);

const OperatorDetails = ({ node }: { node: ShowplanOperator }) => {
  const { t } = useApp();
  return <section aria-label={t("showplan.details")} className="rounded border border-atlas-border bg-atlas-panelStrong p-4">
    <h3 className="mb-3 font-semibold">{node.physicalOp} #{display(node.nodeId)}</h3>
    <dl className="grid gap-x-4 gap-y-2 text-sm sm:grid-cols-2">
      <div>{t("showplan.logicalOp")}: {display(node.logicalOp)}</div>
      <div>{t("showplan.parallel")}: {node.parallel === undefined ? "—" : node.parallel ? t("showplan.yes") : t("showplan.no")}</div>
      <div>{t("showplan.estimatedRows")}: {display(node.estimateRows)}</div>
      <div>{t("showplan.actualRows")}: {display(node.actualRows)}</div>
      <div>{t("showplan.executions")}: {display(node.actualExecutions)}</div>
      <div>{t("showplan.estimatedCost")}: {display(node.estimatedSubtreeCost)}</div>
      <div>{t("showplan.estimatedRowsRead")}: {display(node.estimatedRowsRead)}</div>
      {node.object?.table && <div>{t("showplan.object")}: {node.object.schema}.{node.object.table}</div>}
      {node.object?.index && <div>{t("showplan.index")}: {node.object.index}</div>}
    </dl>
    {node.runtime?.map((thread, index) => <div className="mt-3 border-t border-atlas-border pt-2 text-xs text-atlas-muted" key={index}>
      <strong>{t("showplan.thread")} {display(thread.thread)}</strong> · {t("showplan.actualRows")} {display(thread.actualRows)} · {t("showplan.executions")} {display(thread.actualExecutions)} · {t("showplan.elapsed")} {display(thread.actualElapsedMs)} ms · {t("showplan.cpu")} {display(thread.actualCpuMs)} ms · {t("showplan.reads")} {display(thread.actualLogicalReads)}
    </div>)}
    {node.warnings.map((warning, index) => <p className="mt-2 text-xs text-atlas-amber" key={index}>{warning.kind === "spill" ? t("showplan.spill") : t("showplan.conversion")}: {display(warning.detail)}</p>)}
    <p className="mt-3 text-xs text-atlas-muted">{t("showplan.metricNote")}</p>
  </section>;
};
