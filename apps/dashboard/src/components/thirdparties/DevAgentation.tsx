"use client";

import dynamic from "next/dynamic";

// Dev-only annotation toolbar. The NODE_ENV check sits at module level (not
// in JSX) so production builds drop the import() entirely. The layout used to
// import `agentation` statically behind a JSX check: the check kept it from
// rendering, but the import still put its 414 KB (~90 KB gzip) chunk on the
// critical path of every dashboard page for every user.
// Same wrapper apps/landing and apps/tools already use.
const Agentation =
  process.env.NODE_ENV === "development"
    ? dynamic(() => import("agentation").then((m) => m.Agentation), { ssr: false })
    : () => null;

export default function DevAgentation() {
  return <Agentation />;
}
