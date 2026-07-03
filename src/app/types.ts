import type { AppPage, Language, ThemeMode } from "../types";
import type { Translator } from "../i18n/types";
import type { QueryAnalysisResult, SqlDialect } from "../core/analyzer/types";

export interface AppContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  page: AppPage;
  setPage: (page: AppPage) => void;
  t: Translator;
  analyzerSql: string;
  setAnalyzerSql: (sql: string) => void;
  analyzerDialect: SqlDialect;
  setAnalyzerDialect: (dialect: SqlDialect) => void;
  analyzeCurrentSql: () => Promise<void>;
  runDemoAnalysis: () => Promise<void>;
  latestAnalysis: QueryAnalysisResult | null;
  setLatestAnalysis: (analysis: QueryAnalysisResult | null) => void;
}
