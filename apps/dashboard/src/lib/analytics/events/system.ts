// src/lib/analytics/events/system.ts

export type SystemEventName = 'Error Occurred';

export interface SystemEventPayloads {
  'Error Occurred': {
    error_type: string;
    error_message: string;
    page_context: string;
    object_id?: string;
  };
}
