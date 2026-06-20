import type { LanguageCode, Translation } from "./types";
import { en } from "./en";
import { es } from "./es";
import { pt } from "./pt";

export const translations: Record<LanguageCode, Translation> = {
  en,
  es,
  pt
};

export const languageNames: Record<LanguageCode, string> = {
  en: "English",
  es: "Español",
  pt: "Português"
};
