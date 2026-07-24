import MathJaxScript from "@/components/features/mathjax/MathJaxScript";
import React from "react";

export default function layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <MathJaxScript />
      {children}
    </>
  );
}
