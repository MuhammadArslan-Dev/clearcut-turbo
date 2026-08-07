// // DynamicSectionRenderer.tsx
// import AssessmentQuestionBlock from "@/components/sections/AssessmentQuestionBlock";
// import OthersExamsSection from "@/components/sections/OthersExamsSection";
// import SimilarQuestionsSection from "@/components/sections/SimilarQuestionsSection";

// const sectionMap: Record<string, React.FC<any>> = {
//   assessment_question: AssessmentQuestionBlock,
//   others_exams: OthersExamsSection,
//   similar_questions: SimilarQuestionsSection,
// };

// export default function DynamicSectionRenderer({ sections }: { sections: any[] }) {
//   return (
//     <>
//       {sections?.map((section, i) => {
//         const Component = sectionMap[section.blockType];
//         return Component ? <Component key={i} {...section} /> : null;
//       })}
//     </>
//   );
// }
