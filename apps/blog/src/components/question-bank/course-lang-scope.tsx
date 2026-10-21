"use client";
import React from "react";
import { useCourseLang } from "@/lib/question-bank/use-course-lang";
import { useLanguageStore } from "@/store/useLanguageStore";

/**
 * Marks its subtree with the course language (en | hi) its cards show.
 * Server-rendered content tagged `data-tr="en" | "hi"` is shown/hidden by CSS
 * from this attribute (globals.css), so the cards themselves never re-render.
 * The URL decides the language (/hi -> Hindi, see courseLangFor), and the
 * saved course language is kept in step with it so older components that
 * still read the store show the same language.
 */
export default function CourseLangScope({ children, className }: { children: React.ReactNode; className?: string }) {
  const courseLang = useCourseLang();
  React.useEffect(() => {
    if (useLanguageStore.getState().courseLanguage !== courseLang) {
      useLanguageStore.setState({ courseLanguage: courseLang });
    }
  }, [courseLang]);
  return (
    <div data-course-lang={courseLang} className={className}>
      {children}
    </div>
  );
}
