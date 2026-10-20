import type { ExamIndex } from "./exam-index";

// Shape mirrors the real CTET tree: CDP is shared by both papers (same
// section), English is a different section per paper (paper 2's is empty),
// some subjects list no chapters at all, and some listed chapters have no
// questions (e.g. "phonetics-and-reading", every Science chapter such as
// "tissues"). Paper 2's "mathematics" mirrors HTET, where get-subject lists
// one slug twice (two sections, merged; the page shows the first).
export const fixtureIndex: ExamIndex = {
  exam: "ctet",
  emptyChapters: ["phonetics-and-reading", "tissues"],
  levels: [
    {
      slug: "paper-1",
      subjects: [
        { slug: "child-development-pedagogy", sectionId: "CTET_CDP", chapters: ["development-theories", "social-development"] },
        { slug: "english", sectionId: "CTET_L1_ENG", chapters: ["parts-of-speech", "phonetics-and-reading"] },
        { slug: "science", sectionId: "CTET_SCI", chapters: ["tissues"] },
      ],
    },
    {
      slug: "paper-2",
      subjects: [
        { slug: "child-development-pedagogy", sectionId: "CTET_CDP", chapters: ["development-theories", "social-development"] },
        { slug: "english", sectionId: "CTET_L2_ENG", chapters: [] },
        { slug: "social-studies", sectionId: "CTET_SST", chapters: ["history-basics"] },
        { slug: "sanskrit", sectionId: "CTET_L2_SANS", chapters: [] },
        {
          slug: "mathematics",
          sectionId: "CTET_MATH",
          chapters: ["phonetics-and-reading", "number-system"],
          pageChapters: ["phonetics-and-reading"],
        },
      ],
    },
    { slug: "paper-3", subjects: [] },
    { slug: "paper-4", subjects: [{ slug: "science", sectionId: "CTET_SCI", chapters: ["tissues"] }] },
  ],
};
