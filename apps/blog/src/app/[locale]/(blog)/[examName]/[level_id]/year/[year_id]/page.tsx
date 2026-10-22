import YearQuestionsPage, { yearPageMetadata, type YearParams } from "@/components/question-bank/pages/year-questions-page";

// Page 1 of a year paper's questions; pages 2+ are ./page/[page]. Both render
// the same module (components/question-bank/pages/year-questions-page).

// Cached and regenerated in the background — see lib/question-bank/route-cache.ts.
export const revalidate = 86400;
export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: { params: Promise<YearParams> }) {
  return yearPageMetadata(await params);
}

export default async function Page({ params }: { params: Promise<YearParams> }) {
  return <YearQuestionsPage params={await params} />;
}
