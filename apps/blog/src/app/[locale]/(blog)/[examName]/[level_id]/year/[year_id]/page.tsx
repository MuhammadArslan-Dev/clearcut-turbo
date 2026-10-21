import YearQuestionsPage, { yearPageMetadata, type YearParams } from "@/components/question-bank/pages/year-questions-page";
import { yearStaticParams } from "@/lib/question-bank/static-params";

// Page 1 of a year paper's questions; pages 2+ are ./page/[page]. Both render
// the same module (components/question-bank/pages/year-questions-page).

// Prerendered at build time, every URL — see lib/question-bank/route-cache.ts.
export async function generateStaticParams() {
  return yearStaticParams(true);
}

export async function generateMetadata({ params }: { params: Promise<YearParams> }) {
  return yearPageMetadata(await params);
}

export default async function Page({ params }: { params: Promise<YearParams> }) {
  return <YearQuestionsPage params={await params} />;
}
