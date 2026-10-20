import ChapterQuestionsPage, {
  chapterPageMetadata,
  type ChapterParams,
} from "@/components/question-bank/pages/chapter-questions-page";

// Page 1 of a chapter's questions; pages 2+ are ./page/[page]. Both render
// the same module (components/question-bank/pages/chapter-questions-page).

// Cached and regenerated in the background — see lib/question-bank/route-cache.ts.
export const revalidate = 600;
export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: { params: Promise<ChapterParams> }) {
  return chapterPageMetadata(await params);
}

export default async function Page({ params }: { params: Promise<ChapterParams> }) {
  return <ChapterQuestionsPage params={await params} />;
}
