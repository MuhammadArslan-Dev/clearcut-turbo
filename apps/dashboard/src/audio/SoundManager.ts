import { SOUND_FILES, SoundKey } from "./sounds";

class SoundManager {
  private static instance: SoundManager;
  private audioCache: Map<SoundKey, HTMLAudioElement> = new Map();
  private volume = 1;
  private muted = false;

  private constructor() {}

  static getInstance() {
    if (!SoundManager.instance) {
      SoundManager.instance = new SoundManager();
    }
    return SoundManager.instance;
  }

  private getAudio(key: SoundKey): HTMLAudioElement {
    if (!this.audioCache.has(key)) {
      const audio = new Audio(SOUND_FILES[key]);
      audio.preload = "auto";
      this.audioCache.set(key, audio);
    }
    return this.audioCache.get(key)!;
  }

  setVolume(volume: number) {
    this.volume = Math.min(1, Math.max(0, volume));
  }

  setMuted(muted: boolean) {
    this.muted = muted;
  }

  play(key: SoundKey) {
    if (typeof window === "undefined") return; // SSR guard
    if (this.muted) return;

    const audio = this.getAudio(key);
    audio.currentTime = 0;
    audio.volume = this.volume;

    audio.play().catch((err) => {
      console.warn("Audio play failed:", err);
    });
  }
}

export const soundManager = SoundManager.getInstance();
