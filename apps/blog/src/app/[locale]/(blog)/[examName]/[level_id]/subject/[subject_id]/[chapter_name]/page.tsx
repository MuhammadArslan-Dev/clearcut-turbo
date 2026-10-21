import ChapterQuestionsPage, {
  chapterPageMetadata,
  type ChapterParams,
} from "@/components/question-bank/pages/chapter-questions-page";
import { chapterStaticParams } from "@/lib/question-bank/static-params";

// Page 1 of a chapter's questions; pages 2+ are ./page/[page]. Both render
// the same module (components/question-bank/pages/chapter-questions-page).

// Prerendered at build time, every URL — see lib/question-bank/route-cache.ts.
export async function generateStaticParams() {
  return chapterStaticParams(true);
}

export async function generateMetadata({ params }: { params: Promise<ChapterParams> }) {
  return chapterPageMetadata(await params);
}

export default async function Page({ params }: { params: Promise<ChapterParams> }) {
  return <ChapterQuestionsPage params={await params} />;
}
