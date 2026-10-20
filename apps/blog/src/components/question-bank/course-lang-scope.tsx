"use client";
import React from "react";
import { useLanguageStore } from "@/store/useLanguageStore";
import { normalizeCourseLang } from "@/utils/question-translation";

/**
 * Marks its subtree with the visitor's course language (en | hi). Server-
 * rendered content tagged `data-tr="en" | "hi"` is shown/hidden by CSS from
 * this attribute (globals.css), so switching language re-renders only this
 * element — never the server-rendered cards passed in as children. Server
 * HTML uses the store's default ("en"), same as before.
 */
export default function CourseLangScope({ children, className }: { children: React.ReactNode; className?: string }) {
  const courseLang = normalizeCourseLang(useLanguageStore((s) => s.courseLanguage));
  return (
    <div data-course-lang={courseLang} className={className}>
      {children}
    </div>
  );
}
