import { useMemo, useState } from "react";
import { Exam, ExamTranslation } from "@/types/Exam";
import useLanguageSwitch from "../useLanguageSwitch";
import { AppLocale } from "@/types/components/language";
import { parseTranslation } from "@/utils/text/translation";

export type FilterTab = {
  label: string;
  value: string;
};

export function useCourseFilters(data?: Exam[]) {
  const [selectedState, setSelectedState] = useState<string>("all");

  const { locale } = useLanguageSwitch();

  // helper: get localized label from translation
  const getTranslatedState = (
    translations: ExamTranslation | string | undefined,
    locale: AppLocale
  ): string => {
    if (!translations) return "";

    let parsed: ExamTranslation | undefined;

    if (typeof translations === "string") {
      try {
        parsed = JSON.parse(translations);
      } catch {
        return "";
      }
    } else {
      parsed = translations;
    }

    return parsed?.[locale]?.state ?? parsed?.en?.state ?? "";
  };

  // memoized unique translated states
  const states = useMemo(() => {
    const unique = new Map<string, { label: string; value: string }>();

    (data ?? []).forEach((exam) => {
      const parsed =
        typeof exam.translation === "string"
          ? JSON.parse(exam.translation)
          : exam.translation;

      const label = parsed?.[locale]?.state ?? parsed?.en?.state;

      const value = parsed?.en?.state; // 👈 stable value

      if (!label || !value) return;

      unique.set(value.toLowerCase(), {
        label,
        value: value.toLowerCase(),
      });
    });

    return Array.from(unique.values());
  }, [data, locale]);

  // translated filter tabs
  const stateTabs: FilterTab[] = useMemo(
    () => [
      {
        label: locale === "hi" ? "सभी" : "All",
        value: "all",
      },
      ...states.map(({ label, value }) => ({
        label,
        value,
      })),
    ],
    [states, locale]
  );

  const filteredExams = useMemo(() => {
    if (selectedState === "all") return data ?? [];

    return (data ?? []).filter(
      (exam) => exam.state?.trim().toLowerCase() === selectedState
    );
  }, [data, selectedState]);

  return {
    selectedState,
    setSelectedState,
    stateTabs,
    filteredExams,
  };
}
