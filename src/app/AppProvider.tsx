import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { createTranslator } from "../i18n/i18n";
import type { AppPage, Language, ThemeMode } from "../types";
import type { QueryAnalysisResult } from "../core/analyzer/types";
import type { AppContextValue } from "./types";

const AppContext = createContext<AppContextValue | null>(null);

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider = ({ children }: AppProviderProps) => {
  const [language, setLanguage] = useState<Language>("en");
  const [theme, setTheme] = useState<ThemeMode>("dark");
  const [page, setPage] = useState<AppPage>("dashboard");
  const [latestAnalysis, setLatestAnalysis] =
    useState<QueryAnalysisResult | null>(null);

  useEffect(() => {
    document.documentElement.classList.toggle("light", theme === "light");
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const value = useMemo<AppContextValue>(
    () => ({
      language,
      setLanguage,
      theme,
      setTheme,
      page,
      setPage,
      t: createTranslator(language),
      latestAnalysis,
      setLatestAnalysis,
    }),
    [language, latestAnalysis, page, theme],
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
