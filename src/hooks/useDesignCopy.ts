import { useTranslation } from "react-i18next";

/** The reference's English copy is the fallback for every redesigned screen. Missing keys must never fall through to another language. */
export function useDesignCopy() {
  const { t } = useTranslation("redesign");
  return (text: string) => t(text, { keySeparator: false, nsSeparator: false, defaultValue: text, fallbackLng: false });
}
