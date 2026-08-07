"use client";
import ExamCard from "@/components/ui/exam-card";
import MainContainer from "@/components/main-container";
import React from "react";

const items = Array.from({ length: 3 }, (_, index) => index + 1);

export default function OthersExamsSection() {
  return (
    <MainContainer maxWidth="max-w-[900px]">
      <div className="p-4">
        <div>Other Exams</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {items.map((item, index) => (
            <ExamCard key={index} />
          ))}
        </div>
      </div>
    </MainContainer>
  );
}
