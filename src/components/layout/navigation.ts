import {
  BarChart3,
  BookOpen,
  Boxes,
  FileText,
  Gauge,
  GitCompare,
  GraduationCap,
  Home,
  Network,
  SearchCode,
  Settings,
  type LucideIcon,
} from "lucide-react";
import type { AppPage } from "../../types";
import type { TranslationKey } from "../../i18n/types";

export interface NavigationItem {
  page: AppPage;
  labelKey: TranslationKey;
  icon: LucideIcon;
}

export const navigationItems: NavigationItem[] = [
  { page: "dashboard", labelKey: "nav.dashboard", icon: Home },
  { page: "query-analyzer", labelKey: "nav.queryAnalyzer", icon: SearchCode },
  { page: "index-advisor", labelKey: "nav.indexAdvisor", icon: Gauge },
  { page: "knowledge-base", labelKey: "nav.knowledgeBase", icon: GraduationCap },
  { page: "anti-patterns", labelKey: "nav.antiPatterns", icon: BookOpen },
  { page: "dialect-compare", labelKey: "nav.dialectCompare", icon: GitCompare },
  { page: "explain-visualizer", labelKey: "nav.explainVisualizer", icon: BarChart3 },
  { page: "schema-visualizer", labelKey: "nav.schemaVisualizer", icon: Network },
  { page: "report-export", labelKey: "nav.reportExport", icon: FileText },
  { page: "settings", labelKey: "nav.settings", icon: Settings },
];

export const dashboardQuickLinks = navigationItems.filter((item) =>
  [
    "query-analyzer",
    "index-advisor",
    "knowledge-base",
    "anti-patterns",
    "dialect-compare",
    "explain-visualizer",
  ].includes(item.page),
);

export const schemaIcon = Boxes;
