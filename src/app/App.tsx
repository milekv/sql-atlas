import { lazy, Suspense } from "react";
import { useApp } from "./AppProvider";
import { AppLayout } from "../components/layout/AppLayout";

const DashboardPage = lazy(() =>
  import("../features/dashboard/DashboardPage").then((module) => ({
    default: module.DashboardPage,
  })),
);
const QueryAnalyzerPage = lazy(() =>
  import("../features/query-analyzer/QueryAnalyzerPage").then((module) => ({
    default: module.QueryAnalyzerPage,
  })),
);
const IndexAdvisorPage = lazy(() =>
  import("../features/index-advisor/IndexAdvisorPage").then((module) => ({
    default: module.IndexAdvisorPage,
  })),
);
const KnowledgeBasePage = lazy(() =>
  import("../features/knowledge-base/KnowledgeBasePage").then((module) => ({
    default: module.KnowledgeBasePage,
  })),
);
const AntiPatternsPage = lazy(() =>
  import("../features/anti-patterns/AntiPatternsPage").then((module) => ({
    default: module.AntiPatternsPage,
  })),
);
const DialectComparePage = lazy(() =>
  import("../features/dialect-compare/DialectComparePage").then((module) => ({
    default: module.DialectComparePage,
  })),
);
const ExplainVisualizerPage = lazy(() =>
  import("../features/explain-visualizer/ExplainVisualizerPage").then(
    (module) => ({
      default: module.ExplainVisualizerPage,
    }),
  ),
);
const SchemaVisualizerPage = lazy(() =>
  import("../features/schema-visualizer/SchemaVisualizerPage").then((module) => ({
    default: module.SchemaVisualizerPage,
  })),
);
const ReportExportPage = lazy(() =>
  import("../features/report-export/ReportExportPage").then((module) => ({
    default: module.ReportExportPage,
  })),
);
const SettingsPage = lazy(() =>
  import("../features/settings/SettingsPage").then((module) => ({
    default: module.SettingsPage,
  })),
);

export const App = () => {
  const { page } = useApp();

  const pageContent = {
    dashboard: <DashboardPage />,
    "query-analyzer": <QueryAnalyzerPage />,
    "index-advisor": <IndexAdvisorPage />,
    "knowledge-base": <KnowledgeBasePage />,
    "anti-patterns": <AntiPatternsPage />,
    "dialect-compare": <DialectComparePage />,
    "explain-visualizer": <ExplainVisualizerPage />,
    "schema-visualizer": <SchemaVisualizerPage />,
    "report-export": <ReportExportPage />,
    settings: <SettingsPage />,
  }[page];

  return (
    <AppLayout>
      <Suspense fallback={<PageSkeleton />}>{pageContent}</Suspense>
    </AppLayout>
  );
};

const PageSkeleton = () => (
  <div className="space-y-4">
    <div className="h-8 w-64 animate-pulse rounded bg-atlas-border" />
    <div className="h-4 w-96 max-w-full animate-pulse rounded bg-atlas-border" />
    <div className="grid gap-4 md:grid-cols-2">
      <div className="h-52 animate-pulse rounded-lg border border-atlas-border bg-atlas-panel" />
      <div className="h-52 animate-pulse rounded-lg border border-atlas-border bg-atlas-panel" />
    </div>
  </div>
);
