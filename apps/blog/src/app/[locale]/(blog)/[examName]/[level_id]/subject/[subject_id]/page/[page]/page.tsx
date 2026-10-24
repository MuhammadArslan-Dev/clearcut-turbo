import SubjectQuestionsPage, {
  subjectPageMetadata,
  type SubjectParams,
} from "@/components/question-bank/pages/subject-questions-page";

// Page N (>= 2) of a subject's questions. "/page/1" 308s to the subject URL.
// The static "page" segment takes precedence over the sibling [chapter_name].

// Cached and regenerated in the background — see lib/question-bank/route-cache.ts.
export const revalidate = 604800;
export async function generateStaticParams() {
  return [];
}

type Params = Promise<SubjectParams & { page: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  return subjectPageMetadata(await params);
}

export default async function Page({ params }: { params: Params }) {
  return <SubjectQuestionsPage params={await params} />;
}
