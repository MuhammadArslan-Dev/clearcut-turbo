"use client";

import { NibMascot, type NibAccessory, type NibMood } from "../nibbu";
import styles from "./meters.module.css";

/**
 * Nibbu as the Cutoff Meter studio draws it: the approved mascot in the "tall" frame
 * (room for cap / star / zzz), optional bob loop, pop-in, and the cap dropping on.
 * Re-key it (key={…}) to replay pop / cap-drop, like the studio's innerHTML swap.
 */
export function Nib({
  mood = "happy",
  accessory = "none",
  bob = false,
  pop = false,
  className,
}: {
  mood?: NibMood;
  accessory?: NibAccessory;
  bob?: boolean;
  pop?: boolean;
  className?: string;
}) {
  const cls = [styles.nib, bob && styles.bob, pop && styles.pop, accessory === "cap" && styles.capDrop, className]
    .filter(Boolean)
    .join(" ");
  return (
    <span className={cls}>
      <NibMascot frame="tall" mood={mood} accessory={accessory} />
    </span>
  );
}
