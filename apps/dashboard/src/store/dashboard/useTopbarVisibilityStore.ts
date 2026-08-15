import { create } from "zustand";

type TopbarVisibilityStore = {
  /** Mobile-only: hide the preparation Topbar's title row while scrolling
   * down the chapter list, reveal it when scrolling back up. */
  visible: boolean;
  setVisible: (visible: boolean) => void;
};

export const useTopbarVisibilityStore = create<TopbarVisibilityStore>(
  (set) => ({
    visible: true,
    setVisible: (visible) => set({ visible }),
  }),
);
