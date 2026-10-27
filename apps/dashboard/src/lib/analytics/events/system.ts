// src/lib/analytics/events/system.ts

export type SystemEventName = 'Error Occurred' | 'Meta Pixel Status' | 'Slow Load Shown' | 'Slow Load Retried';

export interface SystemEventPayloads {
  'Error Occurred': {
    error_type: string;
    error_message: string;
    page_context: string;
    object_id?: string;
  };
  // Temporary canary for the Meta Pixel outage monitoring. Sent once per page
  // load (10s after mount) with whether the real Meta SDK loaded. Remove once
  // the Meta event graph is stable (client-approved).
  'Meta Pixel Status': {
    pixel_loaded: boolean;
    page_context: string;
  };
  // CC-152: a screen's data had not arrived after 10 s, so the "Taking
  // longer than usual" notice was shown (once per wait) / its Try again was
  // tapped. No existing event covers this moment.
  'Slow Load Shown': {
    page_context: string;
    seconds_waited: number;
  };
  'Slow Load Retried': {
    page_context: string;
    seconds_waited: number;
  };
}
