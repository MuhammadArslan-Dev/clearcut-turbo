import ChapterQuestionsPage, {
  chapterPageMetadata,
  type ChapterParams,
} from "@/components/question-bank/pages/chapter-questions-page";

// Page N (>= 2) of a chapter's questions. "/page/1" 308s to the chapter URL.

// Cached and regenerated in the background — see lib/question-bank/route-cache.ts.
export const revalidate = 600;
export async function generateStaticParams() {
  return [];
}

type Params = Promise<ChapterParams & { page: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  return chapterPageMetadata(await params);
}

export default async function Page({ params }: { params: Params }) {
  return <ChapterQuestionsPage params={await params} />;
}
