import type { AppPage, Language, ThemeMode } from "../types";
import type { Translator } from "../i18n/types";
import type { QueryAnalysisResult } from "../core/analyzer/types";

export interface AppContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  page: AppPage;
  setPage: (page: AppPage) => void;
  t: Translator;
  latestAnalysis: QueryAnalysisResult | null;
  setLatestAnalysis: (analysis: QueryAnalysisResult | null) => void;
}
