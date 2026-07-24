import { SoundKey } from "@/audio/sounds";
import { soundManager } from "@/audio/SoundManager";

export const useSound = () => {
  const playSound = (key: SoundKey) => {
    soundManager.play(key);
  };

  return { playSound };
};
