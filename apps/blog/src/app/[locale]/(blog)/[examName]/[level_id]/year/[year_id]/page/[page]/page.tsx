import YearQuestionsPage, { yearPageMetadata, type YearParams } from "@/components/question-bank/pages/year-questions-page";
import { yearStaticParams } from "@/lib/question-bank/static-params";

// Page N (>= 2) of a year paper's questions. "/page/1" 308s to the year URL.

// Prerendered at build time, every URL — see lib/question-bank/route-cache.ts.
export async function generateStaticParams() {
  return yearStaticParams(false);
}

type Params = Promise<YearParams & { page: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  return yearPageMetadata(await params);
}

export default async function Page({ params }: { params: Params }) {
  return <YearQuestionsPage params={await params} />;
}
