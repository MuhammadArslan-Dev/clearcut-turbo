// import { init as amplitudeNodeInit } from '@amplitude/analytics-node';
// import type {
//   AnalyticsEventName,
//   AnalyticsEventPayload,
// } from './types';

// const SERVER_API_KEY = process.env.AMPLITUDE_API_KEY_SERVER;

// let client: ReturnType<typeof amplitudeNodeInit> | null = null;

// function getClient() {
//   if (!SERVER_API_KEY) return null;
//   if (!client) {
//     client = amplitudeNodeInit(SERVER_API_KEY);
//   }
//   return client;
// }

// /**
//  * Track an event from the server (API routes, server actions, cron jobs, etc.).
//  */
// export async function trackServerEvent<TName extends AnalyticsEventName>(
//   name: TName,
//   payload: AnalyticsEventPayload<TName>,
//   options?: { userId?: string; deviceId?: string },
// ) {
//   const c = getClient();
//   if (!c) return;

//   await c.track({
//     event_type: name,
//     user_id: options?.userId,
//     device_id: options?.deviceId,
//     event_properties: payload as Record<string, any>,
//   });
// }