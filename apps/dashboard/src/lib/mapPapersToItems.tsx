import { Section } from "@/components/features/preparation/types/types";

type Paper = {
  id: number;
  name: string; // JSON string
};

type Locale = "en" | "hi" | string;

export const mapPapersToItems = (
  papers: Paper[],
  locale: Locale
) => {
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
            {parsedName?.[locale]?.name || "N/A"}
          </span>
          <span className="body-xsmall !font-normal">
            {parsedName?.[locale]?.detail || ""}
          </span>
        </div>
      ),
    };
  });
};


export const mapSectionsToItems = (sections: Section[], locale: Locale) => {
  return sections.map((section) => {
    const parsed = JSON.parse(section.translation);

    return {
      id: String(section.id),
      label: parsed?.[locale]?.name ?? parsed?.en?.name ?? "",
    };
  })
};