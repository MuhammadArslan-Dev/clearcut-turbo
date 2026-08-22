import { create } from "zustand";

type TopbarVisibilityStore = {
  /** Mobile-only: raw scroll-hide offset in px — 0 means the title row is
   * fully visible, growing 1:1 with how far the user has scrolled down (not
   * capped to the row's own height here; Topbar clamps against its own
   * measured height). Lets Topbar track the scroll gesture pixel-for-pixel
   * instead of snapping through a fixed-duration animation. */
  offset: number;
  setOffset: (offset: number) => void;
  /** Mobile-only: 0..1 fraction of how hidden the Topbar title row
   * currently is (0 = fully visible, 1 = fully hidden). Topbar computes
   * this once it knows its own measured height (`clampedOffset / rowHeight`)
   * and writes it here; every other consumer that needs to move in sync
   * with it — the bottom-fixed Course/Test Series switch reveal,
   * PaywallFloatingWidget's price row — reads this SAME fraction and
   * applies it to their own measured size, so all of them complete their
   * transition at exactly the same scroll point instead of drifting out of
   * sync with independent thresholds/timers. */
  progress: number;
  setProgress: (progress: number) => void;
};

export const useTopbarVisibilityStore = create<TopbarVisibilityStore>(
  (set) => ({
    offset: 0,
    setOffset: (offset) => set({ offset }),
    progress: 0,
    setProgress: (progress) => set({ progress }),
  }),
);
