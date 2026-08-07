import type { Metadata } from "next";

import QuestionTesterView from "@/components/features/question-tester/QuestionTesterView";

export const metadata: Metadata = {
  title: "Question Tester | ClearCutoff",
  description: "Preview how a question renders in the real exam.",
};

export default function Page() {
  return <QuestionTesterView />;
}
