import type { Language } from "../types";
import { translations } from "./translations";
import type { TranslationKey, TranslationVariables, Translator } from "./types";

export const translate = (
  language: Language,
  key: TranslationKey,
  variables?: TranslationVariables,
): string => {
  const template = translations[language][key] ?? translations.en[key] ?? key;

  if (!variables) {
    return template;
  }

  return Object.entries(variables).reduce(
    (value, [variable, replacement]) =>
      value.split(`{${variable}}`).join(String(replacement)),
    template,
  );
};

export const createTranslator =
  (language: Language): Translator =>
  (key, variables) =>
    translate(language, key, variables);
