"use client";

import { useEffect, useState } from "react";
import { GoogleTagManager } from "@next/third-parties/google";

export default function LazyGTM() {
  const [loadGTM, setLoadGTM] = useState(false);

  useEffect(() => {
    const enableGTM = () => setLoadGTM(true);

    // Trigger on first interaction
    window.addEventListener("click", enableGTM, { once: true });
    window.addEventListener("scroll", enableGTM, { once: true });
    window.addEventListener("keydown", enableGTM, { once: true });

    return () => {
      window.removeEventListener("click", enableGTM);
      window.removeEventListener("scroll", enableGTM);
      window.removeEventListener("keydown", enableGTM);
    };
  }, []);

  if (!loadGTM) return null;

  return <GoogleTagManager gtmId="GTM-WC2GWW9Z" />;
}
