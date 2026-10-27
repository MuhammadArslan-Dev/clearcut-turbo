"use client";

import dynamic from "next/dynamic";

// Dev-only annotation toolbar. The NODE_ENV check sits at module level (not
// in JSX) so production builds drop the import() entirely. The layout used to
// import `agentation` statically behind a JSX check: the check kept it from
// rendering, but the import still shipped its ~100 KB gzip chunk to every
// reader. Same wrapper apps/landing, apps/tools and apps/dashboard use.
const Agentation =
  process.env.NODE_ENV === "development"
    ? dynamic(() => import("agentation").then((m) => m.Agentation), { ssr: false })
    : () => null;

export default function DevAgentation() {
  return <Agentation />;
}
