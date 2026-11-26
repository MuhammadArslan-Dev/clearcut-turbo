import { handleOpenPaywall } from "@/components/features/PayWalls/PaywallFloatingWidget";
import type { ExamEnrollmentWithExam } from "@/lib/dashboard/learning";

let lastNavAt = 0;

/**
 * The ONE navigation every "Get unlimited tests" button uses (lock modal, info bar, sidebar card,
 * Learn card): the same payment page and params as before - source cutoff_meter, one-time plan
 * preselected, plus test_type / credits_used / free_credits_variant for the payment events.
 * A second tap within 1.5 s is ignored (double tap = one navigation).
 */
export function openCreditsCheckout(args: {
  router: { push: (href: string) => void };
  groupCode: string | number | null | undefined;
  examShort: string | null | undefined;
  testType: string;
  creditsUsed: number | null | undefined;
  variant: string | null | undefined;
  plan?: "1month-onetime" | "1month";
}): boolean {
  const now = Date.now();
  if (now - lastNavAt < 1500) return false;
  lastNavAt = now;
  handleOpenPaywall(
    args.router,
    "cutoff_meter",
    { group_code: args.groupCode, exam: { short_name: args.examShort } } as unknown as ExamEnrollmentWithExam,
    {
      plan: args.plan ?? "1month-onetime",
      test_type: args.testType,
      credits_used: args.creditsUsed,
      free_credits_variant: args.variant,
    },
  );
  return true;
}
