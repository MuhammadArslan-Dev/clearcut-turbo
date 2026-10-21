"use client";
import React from "react";
import { useCourseLang } from "@/lib/question-bank/use-course-lang";

/**
 * Marks its subtree with the course language (en | hi) its cards show.
 * Server-rendered content tagged `data-tr="en" | "hi"` is shown/hidden by CSS
 * from this attribute (globals.css), so switching language re-renders only
 * this element — never the server-rendered cards passed in as children.
 * Server HTML follows the URL's locale: /hi pages render Hindi.
 */
export default function CourseLangScope({ children, className }: { children: React.ReactNode; className?: string }) {
  const courseLang = useCourseLang();
  return (
    <div data-course-lang={courseLang} className={className}>
      {children}
    </div>
  );
}
