"use client";

import { useEffect, useState } from "react";
import Script from "next/script";

const CLARITY_ID = process.env.NEXT_PUBLIC_CLARITY_ID;

// Mirrors LazyGTM.tsx's lazy-on-first-interaction pattern — nothing is
// requested until the visitor clicks, scrolls or types. Gated on
// NODE_ENV === "production" (unlike this file's LazyGTM sibling, which is
// ungated — a pre-existing, separate issue, not repeated here) so local/dev
// traffic never reports into the real Clarity project.
export default function LazyClarity() {
  const [loadClarity, setLoadClarity] = useState(false);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !CLARITY_ID) return;

    const enable = () => setLoadClarity(true);

    window.addEventListener("click", enable, { once: true });
    window.addEventListener("scroll", enable, { once: true });
    window.addEventListener("keydown", enable, { once: true });

    return () => {
      window.removeEventListener("click", enable);
      window.removeEventListener("scroll", enable);
      window.removeEventListener("keydown", enable);
    };
  }, []);

  if (!loadClarity || !CLARITY_ID) return null;

  return (
    <Script id="clarity-init" strategy="afterInteractive">
      {`
        (function(c,l,a,r,i,t,y){
            c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
            t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
            y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
        })(window, document, "clarity", "script", "${CLARITY_ID}");
      `}
    </Script>
  );
}
