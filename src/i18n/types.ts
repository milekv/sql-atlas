import type { Language } from "../types";
import type { en } from "./translations";

export type TranslationKey = keyof typeof en;

export type TranslationVariables = Record<string, string | number>;

export type Translator = (
  key: TranslationKey,
  variables?: TranslationVariables,
) => string;

export type TranslationDictionary = Record<TranslationKey, string>;

export type LocaleRegistry = Record<Language, TranslationDictionary>;
