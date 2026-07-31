/**
 * Interaction events that promote a visitor from "arrived" to "engaged".
 *
 * Analytics loads on the first of these, never before. Keeping the list here
 * rather than inside the GTM component means a future provider (GA4, Clarity,
 * Meta Pixel) reuses the exact same trigger definition instead of inventing its
 * own — so every provider agrees on what "first interaction" means.
 */
export const INTERACTION_EVENTS = ["click", "scroll", "keydown"] as const;

export type InteractionEvent = (typeof INTERACTION_EVENTS)[number];
