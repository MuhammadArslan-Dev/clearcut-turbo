import { Section } from "@/components/features/preparation/types/types";
import type { AppLocale } from "@/types/components/language";
import { toContentLocale } from "@/utils/text/contentLocale";

type Paper = {
  id: number;
  name: string; // JSON string
};

export const mapPapersToItems = (
  papers: Paper[],
  locale: AppLocale | string
) => {
  const contentLocale = toContentLocale(locale as AppLocale);
  return papers.map((paper) => {
    let parsedName: any = {};

    try {
      parsedName = JSON.parse(paper.name);
    } catch (e) {
      console.warn("Invalid JSON in paper.name", paper.name);
    }

    return {
      id: paper.id.toString(),
      label: (
        <div className="flex flex-col">
          <span className="heading-small">
            {parsedName?.[contentLocale]?.name || "N/A"}
          </span>
          <span className="body-xsmall !font-normal">
            {parsedName?.[contentLocale]?.detail || ""}
          </span>
        </div>
      ),
    };
  });
};


export const mapSectionsToItems = (sections: Section[], locale: AppLocale | string) => {
  const contentLocale = toContentLocale(locale as AppLocale);
  return sections.map((section) => {
    const parsed = JSON.parse(section.translation);

    return {
      id: String(section.id),
      label: parsed?.[contentLocale]?.name ?? parsed?.en?.name ?? "",
    };
  })
};