"use client";

import dynamic from "next/dynamic";

// Dev-only annotation toolbar. The NODE_ENV check sits at module level (not
// in JSX) so production builds drop the import() entirely — a static import
// shipped its ~100 KB gzip chunk to every visitor even though it never
// rendered.
const Agentation =
  process.env.NODE_ENV === "development"
    ? dynamic(() => import("agentation").then((m) => m.Agentation), { ssr: false })
    : () => null;

export default function DevAgentation() {
  return <Agentation />;
}
