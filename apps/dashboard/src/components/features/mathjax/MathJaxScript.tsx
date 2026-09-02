"use client";

import Script from "next/script";

// Config is set globally in app/[locale]/layout.tsx <head> as an inline script,
// which is guaranteed to run before this CDN script loads.
export default function MathJaxScript() {
  return (
    <>
      {/* Warms up the DNS/TLS connection to jsdelivr as soon as a route that
          needs MathJax mounts, instead of only starting once the script tag
          below actually fetches (afterInteractive, so after hydration).
          Shrinks — doesn't eliminate — the window where raw, un-typeset
          LaTeX is visible before Math.tsx can swap in the real render.
          React 19 hoists this <link> into <head> wherever it's rendered. */}
      <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
      <link rel="dns-prefetch" href="https://cdn.jsdelivr.net" />
      <Script
        id="mathjax-script"
        src="https://cdn.jsdelivr.net/npm/mathjax@4/tex-chtml.js"
        strategy="afterInteractive"
      />
    </>
  );
}
