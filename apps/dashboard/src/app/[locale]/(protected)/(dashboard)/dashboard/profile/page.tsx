"use client";

import React, { useMemo, useEffect, useRef, Suspense } from "react";
import { AnimatePresence, motion } from "framer-motion";
import clsx from "clsx";

import SettingTopBar from "@/components/features/navigation/setting-sidebar/SettingTopBar";
import SettingNav from "@/components/features/navigation/setting-sidebar/SettingNav";
import BottomNavWrap from "@/components/features/navigation/bottom-bar/dashboard-bar/BottomNavWrap";
import { MobileBackButton } from "@/components/ui/button/mobile-back-button";
import LanguageModal from "@/components/modals/language-modal/LanguageModal";
import ContactUsModal from "@/components/modals/contact-us/ContactUsModal";

import { useResponsiveTabs } from "@/hooks/navigation/useResponsiveTabs";
import ProfilePage from "@/components/layout/dasbboard/pages/ProfilePage";
import AccountDeleteSheet from "@/components/features/AccountDelete/AccountDeleteSheet";
import AccountDeleteConfirmSheet from "@/components/features/AccountDelete/AccountDeleteConfirmSheet";
import { useModalStore } from "@/store/modal/useModalStore";

export type Tab = "profile" | "payment" | "privacy" | "subscription";

/* ---------------- TopBar animation variants ---------------- */
const topBarVariants = {
  hidden: { x: "-100%", opacity: 0 },
  visible: { x: 0, opacity: 1 },
};

export default function DashboardLayout() {
  const { activeTab, isMobile, handleTabChange, handleBack } =
    useResponsiveTabs<Tab>({
      defaultTab: "profile",
      queryKey: "tab",
    });

  const { isOpen, closeModal, stack } = useModalStore();
  const active = stack[stack.length - 1];

  // Still useful for safety (keeps behavior consistent)
  const hasMounted = useRef(false);
  useEffect(() => {
    hasMounted.current = true;
  }, []);

  const contentClass = useMemo(
    () => clsx("absolute inset-0 w-full h-full overflow-y-auto"),
    [],
  );

  return (
    <div className="flex flex-1 flex-col min-h-0 min-w-0">
      <Suspense
        fallback={
          <div className="flex w-full justify-center items-center">
            <div className="relative h-16 w-16">
              <div className="absolute inset-0 rounded-full border-4 border-slate-200" />
              <div className="absolute inset-0 animate-spin rounded-full border-4 border-brand border-t-transparent" />
            </div>{" "}
          </div>
        }
      >
        {/* ================= TOP BAR ================= */}

        {/* Desktop → static */}
        {!isMobile && <MemoSettingTopBar />}

        {/* Mobile → animated, but NEVER on reload */}
        {isMobile && (
          <AnimatePresence initial={false}>
            {!activeTab && (
              <motion.div
                key="topbar"
                variants={topBarVariants}
                initial="visible" // ⬅️ force visible on reload
                animate="visible"
                exit="hidden"
                transition={{ duration: 0.25, ease: "easeInOut" }}
              >
                <MemoSettingTopBar />
              </motion.div>
            )}
          </AnimatePresence>
        )}

        <main className="flex-1 overflow-y-auto md:px-3 md:pt-2 md:pb-5 relative">
          <div className="relative flex h-full overflow-hidden">
            {/* ================= DESKTOP ================= */}
            {!isMobile && (
              <>
                <div className="w-72 shrink-0">
                  <MemoSettingNav
                    activeTab={activeTab}
                    onTabChange={handleTabChange}
                  />
                </div>

                <section className="flex-1 overflow-y-auto">
                  <div className="py-0 px-3">
                    <ProfilePage activeTab={activeTab} />
                  </div>
                </section>
              </>
            )}

            {/* ================= MOBILE ================= */}
            {isMobile && (
              <AnimatePresence mode="wait" initial={false}>
                {/* OPTIONS */}
                {!activeTab && (
                  <motion.div
                    key="settings-nav"
                    initial={false}
                    animate={{ x: 0 }}
                    exit={{ x: "-100%" }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                    className="absolute inset-0"
                  >
                    <MemoSettingNav
                      activeTab={activeTab}
                      onTabChange={handleTabChange}
                    />
                  </motion.div>
                )}

                {/* CONTENT */}
                {activeTab && (
                  <motion.section
                    key="settings-content"
                    initial={false}
                    animate={activeTab ? { x: 0 } : { x: "100%" }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                    className={contentClass}
                  >
                    <MobileBackButton onBack={handleBack} label="Back" />
                    <ProfilePage activeTab={activeTab} />
                  </motion.section>
                )}
              </AnimatePresence>
            )}
          </div>
        </main>
        {isOpen && active === "language" && <MemoLanguageModal />}
        {isOpen && active === "helpsport" && <MemoContactUsModal />}
        {isOpen && active === "account-delete" && <MemoAccountDeleteSheet />}
        {isOpen && active === "account-delete-confirm" && (
          <MemoAccountDeleteConfirmSheet />
        )}
      </Suspense>
      {isMobile && !activeTab && <MemoBottomNavWrap />}
    </div>
  );
}

/* ================= MEMOIZED ================= */

const MemoSettingNav = React.memo(SettingNav);
const MemoSettingTopBar = React.memo(SettingTopBar);
const MemoBottomNavWrap = React.memo(BottomNavWrap);
const MemoLanguageModal = React.memo(LanguageModal);
const MemoContactUsModal = React.memo(ContactUsModal);
const MemoAccountDeleteSheet = React.memo(AccountDeleteSheet);
const MemoAccountDeleteConfirmSheet = React.memo(AccountDeleteConfirmSheet);
