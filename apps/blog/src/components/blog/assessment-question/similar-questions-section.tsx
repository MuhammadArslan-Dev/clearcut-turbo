import Button from "@mui/joy/Button";
import MainContainer from "@/components/main-container";
import React from "react";

const items = [
  {
    title: "Question 1",
    description:
      "This is a question: Figma has become a household name in the UIUX community. Being a truly browser-first product",
  },
  {
    title: "Question 2",
    description:
      "This is a question: Figma has become a household name in the UIUX community. Being a truly browser-first product",
  },
  {
    title: "Question 3",
    description:
      "This is a question: Figma has become a household name in the UIUX community. Being a truly browser-first product",
  },
];

export default function SimilarQuestionsSection() {
  return (
    <MainContainer maxWidth="max-w-[900px]">
    <div className="p-4">
      <div>
        <div className="heading-xlarge font-semibold mb-4">
          Assessment Questions
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4">
        {items.map((item, index) => (
          <div key={index}>
            <div className="flex md:flex-row flex-col gap-4 bg-softskyblue p-4 rounded-2xl">
              <div className="flex  gap-1">
                <div>{index + 1}.</div>
                <div className="body-large font-semibold mb-2">
                  {item.description}
                </div>
              </div>
              <div className="w-full md:w-1/3">
                <Button fullWidth>View Sollution</Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
    </MainContainer>
    );
}
