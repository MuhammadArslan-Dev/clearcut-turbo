/**
 * Payment page headline by `?source=` (CC-74): the student sees what they
 * tried to unlock. Keys live in `modals.unlockFullAccessModal`; any other
 * source keeps today's headline ("title"). The sub-headline doesn't change.
 */
export type PaymentHeadlineKey =
  | "title"
  | "headline_full_test"
  | "headline_chapter"
  | "headline_trial_ended"
  | "headline_plan_ended";

const BY_SOURCE: Record<string, PaymentHeadlineKey> = {
  full_test_card_clicked: "headline_full_test",
  chapter_card_clicked: "headline_chapter",
  topic_card_clicked: "headline_chapter",
  chapter_index_list_card_clicked: "headline_chapter",
  // The locked "Next topic" button.
  next_button_clicked: "headline_chapter",
  trial_ended: "headline_trial_ended",
  plan_ended: "headline_plan_ended",
};

export function paymentHeadlineKey(source: string | null | undefined): PaymentHeadlineKey {
  return (source && BY_SOURCE[source]) || "title";
}
