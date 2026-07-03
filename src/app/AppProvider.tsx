import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { createTranslator } from "../i18n/i18n";
import type { AppPage, Language, ThemeMode } from "../types";
import type { QueryAnalysisResult, SqlDialect } from "../core/analyzer/types";
import { demoSql } from "../samples/demoQuery";
import type { AppContextValue } from "./types";

const AppContext = createContext<AppContextValue | null>(null);

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider = ({ children }: AppProviderProps) => {
  const [language, setLanguage] = useState<Language>("en");
  const [theme, setTheme] = useState<ThemeMode>("dark");
  const [page, setPage] = useState<AppPage>("dashboard");
  const [analyzerSql, setAnalyzerSql] = useState("");
  const [analyzerDialect, setAnalyzerDialect] =
    useState<SqlDialect>("postgresql");
  const [latestAnalysis, setLatestAnalysis] =
    useState<QueryAnalysisResult | null>(null);

  useEffect(() => {
    document.documentElement.classList.toggle("light", theme === "light");
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const analyzeCurrentSql = useCallback(async () => {
    if (!analyzerSql.trim()) {
      setLatestAnalysis(null);
      return;
    }

    const { analyzeQuery } = await import("../core/analyzer/analyzeQuery");
    setLatestAnalysis(analyzeQuery(analyzerSql, analyzerDialect));
  }, [analyzerDialect, analyzerSql]);

  const runDemoAnalysis = useCallback(async () => {
    const { analyzeQuery } = await import("../core/analyzer/analyzeQuery");
    setAnalyzerSql(demoSql);
    setLatestAnalysis(analyzeQuery(demoSql, analyzerDialect));
    setPage("query-analyzer");
  }, [analyzerDialect]);

  const value = useMemo<AppContextValue>(
    () => ({
      language,
      setLanguage,
      theme,
      setTheme,
      page,
      setPage,
      t: createTranslator(language),
      analyzerSql,
      setAnalyzerSql,
      analyzerDialect,
      setAnalyzerDialect,
      analyzeCurrentSql,
      runDemoAnalysis,
      latestAnalysis,
      setLatestAnalysis,
    }),
    [
      analyzeCurrentSql,
      analyzerDialect,
      analyzerSql,
      language,
      latestAnalysis,
      page,
      runDemoAnalysis,
      theme,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = (): AppContextValue => {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error("useApp must be used within AppProvider");
  }

  return context;
};
