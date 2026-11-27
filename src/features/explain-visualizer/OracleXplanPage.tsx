import { useState, type ReactNode } from "react";
import { useApp } from "../../app/AppProvider";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { parseOracleXplan, type OraclePlanNode, type ParsedOracleXplan } from "../../core/explain/parseOracleXplan";
import { sampleOracleXplan } from "../../core/explain/sampleOracleXplan";

const display = (value?: number | string) => value === undefined ? "—" : String(value);

export const OracleXplanPage = () => {
  const { t } = useApp();
  const [input, setInput] = useState("");
  const [plan, setPlan] = useState<ParsedOracleXplan>();
  const [selected, setSelected] = useState<OraclePlanNode>();
  const [error, setError] = useState(false);

  const importPlan = (text: string) => {
    setInput(text);
    try {
      const parsed = parseOracleXplan(text);
      setPlan(parsed);
      setSelected(parsed.root);
      setError(false);
    } catch {
      setPlan(undefined);
      setSelected(undefined);
      setError(true);
    }
  };

  const tree = (node: OraclePlanNode, depth = 0): ReactNode => (
    <div key={node.id}>
      <button type="button" onClick={() => setSelected(node)} aria-current={selected === node ? "true" : undefined}
        className={`w-full rounded px-3 py-2 text-left text-sm hover:bg-atlas-panelStrong focus-visible:outline focus-visible:outline-2 focus-visible:outline-atlas-cyan ${selected === node ? "bg-atlas-panelStrong text-atlas-cyan" : "text-atlas-text"}`}
        style={{ paddingLeft: 12 + depth * 16 }}>
        <span className="font-mono text-atlas-muted">{node.id}</span> · {node.operation}
        {node.objectName && <span className="ml-2 text-atlas-muted">{node.objectName}</span>}
      </button>
      {node.children.map((child) => tree(child, depth + 1))}
    </div>
  );

  return <div className="space-y-5">
    <header>
      <h1 className="text-2xl font-semibold">{t("oracle.title")}</h1>
      <p className="mt-2 text-sm text-atlas-muted">{t("oracle.subtitle")}</p>
    </header>
    <Card className="space-y-3">
      <label htmlFor="oracle-plan-file" className="block text-sm font-medium">{t("oracle.file")}</label>
      <input id="oracle-plan-file" type="file" accept=".txt,.log,text/plain"
        className="block w-full text-sm text-atlas-text file:mr-3 file:rounded file:border file:border-atlas-border file:bg-atlas-panelStrong file:p-2 file:text-atlas-text"
        onChange={async (event) => {
          const file = event.currentTarget.files?.[0];
          if (!file) return;
          if (file.size > 2_000_000) { setError(true); setPlan(undefined); setSelected(undefined); return; }
          importPlan(await file.text());
        }} />
      <label htmlFor="oracle-plan-text" className="block text-sm font-medium">{t("oracle.paste")}</label>
      <textarea id="oracle-plan-text" value={input} spellCheck={false}
        onChange={(event) => { setInput(event.target.value); setPlan(undefined); setSelected(undefined); setError(false); }}
        className="min-h-44 w-full rounded border border-atlas-border bg-atlas-panelStrong p-3 font-mono text-xs text-atlas-text" />
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="primary" onClick={() => importPlan(input)}>{t("explain.analyze")}</Button>
        <Button type="button" onClick={() => importPlan(sampleOracleXplan)}>{t("actions.loadSample")}</Button>
        <Button type="button" variant="ghost" onClick={() => { setInput(""); setPlan(undefined); setSelected(undefined); setError(false); }}>{t("actions.clear")}</Button>
      </div>
      {error && <p role="alert" className="text-sm text-atlas-red">{t("oracle.invalid")}</p>}
      <p className="text-xs text-atlas-muted">{t("oracle.privacy")}</p>
    </Card>
    {plan && <>
      <Card className="space-y-2 text-sm text-atlas-muted">
        <p>{plan.kind === "actual" ? t("oracle.actual") : t("oracle.estimated")} · {plan.nodes.length} {t("oracle.operators")}</p>
        <p>{t("oracle.sqlId")}: {plan.sqlId ?? "—"} · {t("oracle.childNumber")}: {display(plan.childNumber)} · {t("oracle.hash")}: {plan.planHashValue ?? "—"}</p>
        <p className="text-xs">{t("oracle.metricNote")}</p>
      </Card>
      <div className="grid gap-4 lg:grid-cols-[minmax(250px,1fr)_minmax(320px,1fr)]">
        <Card>
          <h2 className="mb-3 font-semibold">{t("oracle.tree")}</h2>
          <div className="max-h-[620px] overflow-auto">{tree(plan.root)}</div>
        </Card>
        {selected && <Card className="space-y-3">
          <h2 className="font-semibold">{t("oracle.details")}: {selected.operation}</h2>
          {selected.objectName && <p className="text-sm text-atlas-muted">{t("oracle.object")}: {selected.objectName}</p>}
          <dl className="grid grid-cols-2 gap-3 text-sm">
            {[
              [t("oracle.estimatedRows"), selected.estimatedRows], [t("oracle.actualRows"), selected.actualRows],
              [t("oracle.starts"), selected.starts], [t("oracle.buffers"), selected.buffers],
              [t("oracle.reads"), selected.reads], [t("oracle.cost"), selected.cost],
              [t("oracle.actualTime"), selected.actualTimeMs === undefined ? undefined : `${selected.actualTimeMs} ms`],
            ].map(([label, value]) =>
              <div key={label}><dt className="text-atlas-muted">{label}</dt><dd className="font-medium">{display(value)}</dd></div>)}
          </dl>
          {selected.predicates.length > 0 && <section><h3 className="text-sm font-medium">{t("oracle.predicates")}</h3>
            {selected.predicates.map((value, index) => <pre key={index} className="mt-2 overflow-x-auto whitespace-pre-wrap break-words rounded bg-atlas-panelStrong p-2 text-xs">{value}</pre>)}
          </section>}
        </Card>}
      </div>
      {plan.notes.length > 0 && <Card><h2 className="font-semibold">{t("oracle.notes")}</h2>
        <ul className="mt-2 list-disc pl-5 text-sm text-atlas-muted">{plan.notes.map((note, index) => <li key={index}>{note}</li>)}</ul>
      </Card>}
    </>}
  </div>;
};
