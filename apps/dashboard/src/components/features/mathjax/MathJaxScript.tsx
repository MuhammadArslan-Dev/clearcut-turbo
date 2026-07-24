"use client";

import Script from "next/script";

// Config is set globally in app/[locale]/layout.tsx <head> as an inline script,
// which is guaranteed to run before this CDN script loads.
export default function MathJaxScript() {
  return (
    <Script
      id="mathjax-script"
      src="https://cdn.jsdelivr.net/npm/mathjax@4/tex-chtml.js"
      strategy="afterInteractive"
    />
  );
}
