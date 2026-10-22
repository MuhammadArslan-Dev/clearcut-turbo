import YearQuestionsPage, { yearPageMetadata, type YearParams } from "@/components/question-bank/pages/year-questions-page";

// Page N (>= 2) of a year paper's questions. "/page/1" 308s to the year URL.

// Cached and regenerated in the background — see lib/question-bank/route-cache.ts.
export const revalidate = 86400;
export async function generateStaticParams() {
  return [];
}

type Params = Promise<YearParams & { page: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  return yearPageMetadata(await params);
}

export default async function Page({ params }: { params: Params }) {
  return <YearQuestionsPage params={await params} />;
}
