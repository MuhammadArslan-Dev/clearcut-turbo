// src/lib/analytics/events/global_user.ts

export type GlobalUserEventName = 'ANY EVENT';

export interface GlobalUserEventPayloads {
  'ANY EVENT': {
    up_last_seen_date: string;
  };
}
