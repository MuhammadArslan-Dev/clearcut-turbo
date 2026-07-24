"use client";

import ProfileWrap from "@/components/features/profile/ProfileWrap";
import PaymentHistoryWrap from "@/components/features/payment/PaymentHistoryWrap";
import SubscriptionWrap from "@/components/features/subscription/SubscriptionWrap";
import { Tab } from "@/app/[locale]/(protected)/(dashboard)/dashboard/profile/page";
import { useEffect } from "react";
import { useCourseStore } from "@/store/course/useCourseStore";
import { SettingFooter } from "@/components/features/navigation/setting-sidebar/SettingsSidebarFooter";

export default function ProfilePage({ activeTab }: { activeTab: Tab | null }) {
  const { close } = useCourseStore();

  useEffect(() => {
    close();
  }, []);

  if (activeTab === "payment") {
    return (
      <div className="px-3">
        <PaymentHistoryWrap />
      </div>
    );
  }

  if (activeTab === "profile") {
    return (
      <div className="px-3">
        <ProfileWrap />
      </div>
    );
  }

  if (activeTab === "subscription") {
    return (
      <div className="px-3 py-2">
        <SubscriptionWrap />
      </div>
    );
  }

  if (activeTab === "privacy") {
    return (
      <div className="px-0">
        <SettingFooter />
      </div>
    );
  }

  return null;
}
