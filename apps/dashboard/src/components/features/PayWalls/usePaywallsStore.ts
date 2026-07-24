import { create } from "zustand";
import { Exam } from "@/types/Exam";

/** Allowed modes */
export type PaywallTypes =
  | "preparation-paywall"
  | "test-series-paywall"
  | "main-paywall"
  | "course-paywall";

export type PaywallSource =
  | "my_courses_card_clicked"
  | "topic_card_clicked"
  | "chapter_card_clicked"
  | "chapter_index_list_card_clicked"
  | "floating_widget_clicked"
  | "full_test_card_clicked"
  | "sectional_test_card_clicked"
  | "test_series_card_clicked"
  | "payment_failed_retry_clicked";
interface EditCourseState {
  isOpen: boolean;
  data: Exam | undefined | null;
  mode: PaywallTypes | null;
  source?: PaywallSource | null;

  open: (mode: PaywallTypes, data: Exam, source?: PaywallSource) => void;
  close: () => void;
}

const isMobile = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(max-width: 768px)").matches;

export const usePaywallsStore = create<EditCourseState>((set) => ({
  isOpen: false,
  data: null,
  mode: null,
  source: null,

  open: (mode, data, source) => {
    if (isMobile()) {
      window.history.pushState({ drawer: true }, "");
    }

    set({
      isOpen: true,
      mode,
      data,
      source,
    });
  },

  close: () =>
    set({
      isOpen: false,
      mode: null,
      source: null,
      data: null,
    }),
}));
