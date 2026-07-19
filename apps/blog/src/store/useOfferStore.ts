// src/store/useOfferStore.ts
import { createStore } from "@clearcut/state/create-store";

interface OfferState {
  offerEnd: boolean; // true = expired, false = active
  setOfferEnd: (status: boolean) => void;
  resetOffer: () => void;
}

export const useOfferStore = createStore<OfferState>("offerStore", (set) => ({
  offerEnd: false, // initially not expired
  setOfferEnd: (status) => set({ offerEnd: status }),
  resetOffer: () => set({ offerEnd: false }),
}));
