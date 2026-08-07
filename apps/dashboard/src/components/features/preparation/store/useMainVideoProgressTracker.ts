import { create } from "zustand";

type MainVideoProgressState = {
  currentTime: number;
  duration: number;
  progressPercent: number;
  isPlaying: boolean;

  setProgress: (currentTime: number, duration: number) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  reset: () => void;
};

export const useMainVideoProgressTrackerStore =
  create<MainVideoProgressState>((set) => ({
    currentTime: 0,
    duration: 0,
    progressPercent: 0,
    isPlaying: false,

    setProgress: (currentTime, duration) =>
      set(() => {
        const percent =
          duration > 0 ? Math.floor((currentTime / duration) * 100) : 0;

        return {
          currentTime,
          duration,
          progressPercent: percent,
        };
      }),

    setIsPlaying: (isPlaying) => set({ isPlaying }),

    reset: () =>
      set({
        currentTime: 0,
        duration: 0,
        progressPercent: 0,
        isPlaying: false,
      }),
  }));
