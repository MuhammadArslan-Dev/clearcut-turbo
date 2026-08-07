export function trackFacebookEvent(eventName: string) {
  if (typeof window === "undefined" || !window.fbq) return;

  window.fbq("track", eventName);
}
