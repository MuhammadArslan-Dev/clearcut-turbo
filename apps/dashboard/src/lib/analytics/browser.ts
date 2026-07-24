'use client';

import {
    init as amplitudeInit,
    track as amplitudeTrack,
    Identify,
    identify as amplitudeIdentify,
    setUserId as amplitudeSetUserId,
} from '@amplitude/analytics-browser';
import type {
    AnalyticsEventName,
    AnalyticsEventPayload,
    AnalyticsUserTraits,
} from './types';

// These are replaced at build time; safe to read in client code
const AMPLITUDE_API_KEY = process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY;
const AMPLITUDE_ENABLED =
    process.env.NEXT_PUBLIC_AMPLITUDE_ENABLED === 'true';

// NEW: how to format event names when sending
type EventNameCase = 'as-is' | 'lower' | 'upper';

const EVENT_NAME_CASE: EventNameCase =
    (process.env.NEXT_PUBLIC_ANALYTICS_EVENT_CASE as EventNameCase) || 'as-is';

function formatEventName(name: string): string {
    switch (EVENT_NAME_CASE) {
        case 'lower':
            return name.toLowerCase();
        case 'upper':
            return name.toUpperCase();
        case 'as-is':
        default:
            return name;
    }
}

let isInitialized = false;

function internalInit() {
    if (isInitialized) return;
    if (typeof window === 'undefined') return;

    if (!AMPLITUDE_ENABLED || !AMPLITUDE_API_KEY) {
        // if (process.env.MODE === 'development') {
        //   console.info(
        //     '[analytics] Amplitude disabled (missing key or flag is false)',
        //   );
        // }
        return;
    }
//     amplitudeInit(AMPLITUDE_API_KEY, undefined, {
//   logLevel: 4, // DEBUG
// });


    amplitudeInit(AMPLITUDE_API_KEY, undefined, {
        defaultTracking: {
            pageViews: false,
            sessions: true,
            formInteractions: false,
            fileDownloads: false,
        },
    });

    isInitialized = true;
}

export function initAmplitude() {
    internalInit();
}

export function trackEvent<TName extends AnalyticsEventName>(
    name: TName,
    payload?: AnalyticsEventPayload<TName>,
) {
    if (!AMPLITUDE_ENABLED) return;
    internalInit();
    if (!isInitialized) return;

    const eventName = formatEventName(name);
    amplitudeTrack(eventName, (payload ?? {}) as Record<string, any>);
}

export function setAnalyticsUser(
  userId: string | null,
  traits?: AnalyticsUserTraits,
) {
  if (!AMPLITUDE_ENABLED) return;
  internalInit();
  if (!isInitialized || !userId) return;

  // 1️⃣ Set userId FIRST
  amplitudeSetUserId(userId);

  // 2️⃣ Identify AFTER userId is set
  if (traits) {
    const identify = new Identify();

    Object.entries(traits).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        identify.set(key, value as never);
      }
    });

    // ⏱ Delay ensures SDK is ready
    setTimeout(() => {
      amplitudeIdentify(identify);
    }, 0);
  }
}
