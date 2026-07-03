import type { Language } from "../types";

export const languageStorageKey = "sql-atlas.language";

const supportedLanguages: readonly Language[] = ["en", "pl"];

export const isSupportedLanguage = (value: string | null | undefined): value is Language =>
  supportedLanguages.includes(value as Language);

export const detectBrowserLanguage = (
  browserLanguages: readonly string[] = [],
): Language => {
  for (const language of browserLanguages) {
    const normalized = language.toLowerCase();

    if (normalized === "pl" || normalized.startsWith("pl-")) {
      return "pl";
    }

    if (normalized === "en" || normalized.startsWith("en-")) {
      return "en";
    }
  }

  return "en";
};

export const resolveInitialLanguage = ({
  browserLanguages,
  storedLanguage,
}: {
  browserLanguages: readonly string[];
  storedLanguage?: string | null;
}): Language => {
  if (isSupportedLanguage(storedLanguage)) {
    return storedLanguage;
  }

  return detectBrowserLanguage(browserLanguages);
};
