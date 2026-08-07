import React from "react";
import ProtectedPage from "@/components/features/auth/ProtectedPage";
import PaymentFailedWarningModal from "@/components/modals/payment/failed-warning/payment-failed-warning-modal";
import BuySigleCourseModal from "@/components/modals/course/buy-sigle-course/buy-sigle-course-modal";
type ProfilePageProps = {
  children: React.ReactNode;
};
export default function PaymentLayout({ children }: ProfilePageProps) {
  return (
    <ProtectedPage>
      {children}
      <PaymentFailedWarningModal />
       <BuySigleCourseModal />
    </ProtectedPage>
  );
}
