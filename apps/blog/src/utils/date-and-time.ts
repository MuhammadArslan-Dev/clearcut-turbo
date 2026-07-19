export default function createTargetDate(minutes: number): string {
  const now = new Date();
  // This is just for demonstration. In a real app, this date would be static
  // and fetched from a server to avoid client-side time drifts.
  now.setMinutes(now.getMinutes() + minutes);
  return now.toISOString();
}
