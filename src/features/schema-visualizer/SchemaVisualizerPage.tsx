import { useMemo, useState } from "react";
import { AlertTriangle, Database, KeyRound, Link2, Network } from "lucide-react";
import { useApp } from "../../app/AppProvider";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { parseCreateTableSchema } from "../../core/schema/parseCreateTable";
import type { SchemaWarning } from "../../core/schema/types";
import { schemaDdlSample } from "../../samples/schemaDdl";

export const SchemaVisualizerPage = () => {
  const { t } = useApp();
  const [ddl, setDdl] = useState(schemaDdlSample);
  const [submittedDdl, setSubmittedDdl] = useState(schemaDdlSample);
  const schema = useMemo(
    () => parseCreateTableSchema(submittedDdl),
    [submittedDdl],
  );
  const columnCount = schema.tables.reduce(
    (count, table) => count + table.columns.length,
    0,
  );

  return (
    <div className="space-y-6">
      <PageHeader title={t("schema.title")} subtitle={t("schema.subtitle")} />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <Card className="min-w-0 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-semibold">{t("schema.inputLabel")}</h2>
              <p className="mt-1 text-sm text-atlas-muted">{t("schema.privacy")}</p>
            </div>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setDdl(schemaDdlSample)}
            >
              {t("actions.loadSample")}
            </Button>
          </div>
          <textarea
            aria-label={t("schema.inputLabel")}
            className="min-h-[520px] w-full resize-y rounded-lg border border-atlas-border bg-[#070a10] p-4 font-mono text-sm leading-6 text-atlas-text outline-none transition focus:border-atlas-cyan/70"
            spellCheck={false}
            value={ddl}
            onChange={(event) => setDdl(event.target.value)}
          />
          <Button
            type="button"
            variant="primary"
            icon={<Network size={16} />}
            disabled={!ddl.trim()}
            onClick={() => setSubmittedDdl(ddl)}
          >
            {t("schema.visualize")}
          </Button>
        </Card>

        <div className="min-w-0 space-y-4">
          <section className="grid grid-cols-3 gap-3" aria-label={t("schema.summary")}>
            <Metric label={t("schema.tables")} value={schema.tables.length} />
            <Metric label={t("schema.columns")} value={columnCount} />
            <Metric label={t("schema.relations")} value={schema.foreignKeys.length} />
          </section>

          {schema.warnings.length > 0 && (
            <Card className="border-atlas-amber/40 bg-atlas-amber/5">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 text-atlas-amber" size={18} />
                <div>
                  <h2 className="font-semibold">{t("schema.warnings")}</h2>
                  <ul className="mt-2 space-y-1 text-sm text-atlas-muted">
                    {schema.warnings.map((warning, index) => (
                      <li key={`${warning.code}:${index}`}>
                        {translateWarning(warning, t)}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>
          )}

          {schema.tables.length === 0 ? (
            <Card className="flex min-h-72 flex-col items-center justify-center text-center">
              <Database size={38} className="text-atlas-cyan" />
              <p className="mt-4 max-w-md text-atlas-muted">{t("schema.empty")}</p>
            </Card>
          ) : (
            <section className="grid gap-4 lg:grid-cols-2">
              {schema.tables.map((table) => (
                <Card key={table.name} className="overflow-hidden p-0">
                  <div className="flex items-center gap-2 border-b border-atlas-border bg-atlas-panelStrong px-4 py-3">
                    <Database size={16} className="text-atlas-cyan" />
                    <h2 className="truncate font-mono text-sm font-semibold">
                      {table.name}
                    </h2>
                  </div>
                  <ul className="divide-y divide-atlas-border/70">
                    {table.columns.map((column) => (
                      <li
                        key={column.name}
                        className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          {column.primaryKey ? (
                            <KeyRound size={14} className="shrink-0 text-atlas-amber" />
                          ) : (
                            <span className="h-3.5 w-3.5 shrink-0 rounded-full border border-atlas-border" />
                          )}
                          <span className="truncate font-mono">{column.name}</span>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <span className="font-mono text-xs text-atlas-muted">
                            {column.dataType}
                          </span>
                          {!column.nullable && <Badge tone="neutral">NN</Badge>}
                          {column.unique && <Badge tone="cyan">UQ</Badge>}
                        </div>
                      </li>
                    ))}
                  </ul>
                </Card>
              ))}
            </section>
          )}

          {schema.foreignKeys.length > 0 && (
            <Card>
              <div className="mb-4 flex items-center gap-2">
                <Link2 size={17} className="text-atlas-violet" />
                <h2 className="font-semibold">{t("schema.relationships")}</h2>
              </div>
              <ul className="space-y-3">
                {schema.foreignKeys.map((foreignKey) => (
                  <li
                    key={foreignKey.id}
                    className="flex flex-wrap items-center gap-2 rounded-md border border-atlas-border bg-atlas-panelStrong px-3 py-2 font-mono text-xs"
                  >
                    <span>{foreignKey.sourceTable}.{foreignKey.sourceColumns.join(", ")}</span>
                    <span className="text-atlas-violet">-&gt;</span>
                    <span>{foreignKey.targetTable}.{foreignKey.targetColumns.join(", ")}</span>
                    <Badge tone={foreignKey.resolved ? "success" : "warning"}>
                      {foreignKey.resolved
                        ? t("schema.resolved")
                        : t("schema.unresolved")}
                    </Badge>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

const Metric = ({ label, value }: { label: string; value: number }) => (
  <Card className="p-4">
    <p className="text-2xl font-semibold text-atlas-text">{value}</p>
    <p className="mt-1 text-xs uppercase tracking-[0.14em] text-atlas-muted">
      {label}
    </p>
  </Card>
);

const translateWarning = (
  warning: SchemaWarning,
  t: (key: never, variables?: Record<string, string | number>) => string,
): string => {
  if (warning.code === "definition-unparsed") {
    return t("schema.warning.definition" as never, {
      table: warning.table,
      definition: warning.definition,
    });
  }
  if (warning.code === "no-columns") {
    return t("schema.warning.noColumns" as never, { table: warning.table });
  }
  if (warning.code === "missing-reference") {
    return t("schema.warning.missingReference" as never, {
      table: warning.table,
    });
  }
  return t("schema.warning.noCreateTable" as never);
};

const PageHeader = ({ title, subtitle }: { title: string; subtitle: string }) => (
  <section>
    <h1 className="text-3xl font-semibold">{title}</h1>
    <p className="mt-2 max-w-3xl text-atlas-muted">{subtitle}</p>
  </section>
);
