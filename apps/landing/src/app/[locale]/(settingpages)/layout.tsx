import FloatingButton from "@/components/global/FloatingButton";
import FooterWrap from "@/components/layout/FooterWrap";
import React from "react";

export default function layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <FloatingButton />
      <FooterWrap />
    </>
  );
}
