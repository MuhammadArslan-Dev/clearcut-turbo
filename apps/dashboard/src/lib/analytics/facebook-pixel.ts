export function trackFacebookEvent(
  eventName: string,
  params?: Record<string, unknown>,
) {
  if (typeof window === "undefined" || !window.fbq) return;

  window.fbq("track", eventName, params);
}
