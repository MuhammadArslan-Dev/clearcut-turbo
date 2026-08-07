"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { soundManager } from "@/audio/SoundManager";

type SoundContextType = {
  muted: boolean;
  volume: number;
  toggleMute: () => void;
  setVolume: (v: number) => void;
};

const SoundContext = createContext<SoundContextType | null>(null);

export const SoundProvider = ({ children }: { children: React.ReactNode }) => {
  const [muted, setMuted] = useState(false);
  const [volume, setVolumeState] = useState(1);

  useEffect(() => {
    soundManager.setMuted(muted);
  }, [muted]);

  useEffect(() => {
    soundManager.setVolume(volume);
  }, [volume]);

  const toggleMute = () => setMuted((m) => !m);
  const setVolume = (v: number) => setVolumeState(v);

  return (
    <SoundContext.Provider
      value={{ muted, volume, toggleMute, setVolume }}
    >
      {children}
    </SoundContext.Provider>
  );
};

export const useSoundSettings = () => {
  const ctx = useContext(SoundContext);
  if (!ctx) throw new Error("useSoundSettings must be used within SoundProvider");
  return ctx;
};
