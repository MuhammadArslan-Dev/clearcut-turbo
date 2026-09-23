// Small decorative mountain-with-flag graphic (the "Stay Focused" tip card on
// the Daily Test attempt page and the full exam page). No existing
// illustration asset matches this motif, so it's a minimal inline SVG.
export default function MountainFlagIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 90" fill="none" className={className} aria-hidden="true">
      <path d="M0 90L45 25L75 60L95 35L160 90H0Z" fill="var(--color-brand)" opacity="0.18" />
      <path d="M20 90L60 35L85 65L110 40L160 90H20Z" fill="var(--color-brand)" opacity="0.3" />
      <line x1="110" y1="40" x2="110" y2="14" stroke="var(--color-brand)" strokeWidth="2" opacity="0.6" />
      <path d="M110 14L128 20L110 26V14Z" fill="var(--color-brand)" opacity="0.6" />
    </svg>
  );
}
