import { usePaywallsStore } from "@/components/features/PayWalls/usePaywallsStore";
import type { ExamEnrollmentWithExam } from "@/lib/dashboard/learning";
import type { InfoSurface } from "@/lib/freeCredits/ui";

/**
 * Opens the Variant B credits modal (LockedContentModal, mode "credits-info-modal") from the
 * info bar, sidebar card and Learn row. Only its primary button goes to payment. A second tap
 * while it is open is ignored (a phone pushes a history entry on every open).
 */
export function openCreditsInfo(
  course: ExamEnrollmentWithExam | null | undefined,
  surface: InfoSurface,
  testType = "unknown",
): boolean {
  const store = usePaywallsStore.getState();
  if (store.isOpen || !course?.exam) return false;
  store.open("credits-info-modal", course.exam, undefined, course, { surface, testType });
  return true;
}
