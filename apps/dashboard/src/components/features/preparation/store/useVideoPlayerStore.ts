import { create } from "zustand";
import { ContentItem } from "../types/topic-content-type";

interface VideoPlayerState {
  video: ContentItem | null;
  player: any;
  setPlayer: (player: any) => void;
  seekTo: (time: number) => void;
  setVideo: (video: ContentItem | null) => void;
}

export const useVideoPlayerStore = create<VideoPlayerState>((set, get) => ({
  player: null,
  video: null,
  setVideo: (video) => set({ video }),

  setPlayer: (player) => set({ player }),

  seekTo: (time) => {
    const player = get().player;

    if (!player) return;

    player.seekTo(time, true);
    player.playVideo();
  },
}));
