"use client";

import { useEffect } from "react";
import { initAmplitude } from "@/services/analytics";

let initialized = false;

export default function AnalyticsLoader() {
  useEffect(() => {
    if (initialized) return;

    initialized = true;

    const loadAnalytics = () => {
      setTimeout(() => {
        initAmplitude();
      }, 1500);
    };

    if ("requestIdleCallback" in window) {
      requestIdleCallback(loadAnalytics);
    } else {
      setTimeout(loadAnalytics, 2500);
    }
  }, []);

  return null;
}