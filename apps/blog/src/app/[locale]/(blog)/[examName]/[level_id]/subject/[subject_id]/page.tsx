import SubjectQuestionsPage, {
  subjectPageMetadata,
  type SubjectParams,
} from "@/components/question-bank/pages/subject-questions-page";

// Page 1 of a subject's questions; pages 2+ are ./page/[page]. Both render
// the same module (components/question-bank/pages/subject-questions-page).

// Cached and regenerated in the background — see lib/question-bank/route-cache.ts.
export const revalidate = 600;
export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: { params: Promise<SubjectParams> }) {
  return subjectPageMetadata(await params);
}

export default async function Page({ params }: { params: Promise<SubjectParams> }) {
  return <SubjectQuestionsPage params={await params} />;
}
