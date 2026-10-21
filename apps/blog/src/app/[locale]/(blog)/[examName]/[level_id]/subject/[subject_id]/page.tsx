import SubjectQuestionsPage, {
  subjectPageMetadata,
  type SubjectParams,
} from "@/components/question-bank/pages/subject-questions-page";
import { subjectStaticParams } from "@/lib/question-bank/static-params";

// Page 1 of a subject's questions; pages 2+ are ./page/[page]. Both render
// the same module (components/question-bank/pages/subject-questions-page).

// Prerendered at build time, every URL — see lib/question-bank/route-cache.ts.
export async function generateStaticParams() {
  return subjectStaticParams(true);
}

export async function generateMetadata({ params }: { params: Promise<SubjectParams> }) {
  return subjectPageMetadata(await params);
}

export default async function Page({ params }: { params: Promise<SubjectParams> }) {
  return <SubjectQuestionsPage params={await params} />;
}
