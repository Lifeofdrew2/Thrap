import countries from "i18n-iso-countries";
import englishCountryNames from "i18n-iso-countries/langs/en.json";
import type { ConversationLanguage, Region } from "../api/types";

countries.registerLocale(englishCountryNames);

export interface RegionOption {
  value: Region;
  label: string;
}

export interface LanguageOption {
  value: ConversationLanguage;
  label: string;
}

const nigeria: RegionOption = { value: "NG", label: "Nigeria" };

export const REGION_OPTIONS: RegionOption[] = [
  nigeria,
  ...Object.entries(countries.getNames("en"))
    .filter(([value]) => value !== nigeria.value)
    .map(([value, label]) => ({ value, label }))
    .sort((left, right) => left.label.localeCompare(right.label)),
];

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { value: "pcm", label: "Nigerian Pidgin" },
  { value: "eng", label: "English" },
  { value: "spa", label: "Spanish" },
  { value: "zho", label: "Chinese (Mandarin)" },
  { value: "ara", label: "Arabic" },
  { value: "por", label: "Portuguese" },
  { value: "rus", label: "Russian" },
  { value: "jpn", label: "Japanese" },
  { value: "fra", label: "French" },
  { value: "deu", label: "German" },
  { value: "ind", label: "Indonesian" },
  { value: "ita", label: "Italian" },
  { value: "tur", label: "Turkish" },
  { value: "kor", label: "Korean" },
];

export const DEFAULT_REGION: Region = nigeria.value;
export const DEFAULT_LANGUAGE: ConversationLanguage = "eng";

export function languagesForRegion(_region: Region): LanguageOption[] {
  return LANGUAGE_OPTIONS;
}
