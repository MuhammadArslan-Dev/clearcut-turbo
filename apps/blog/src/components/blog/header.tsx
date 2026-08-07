// components/Header.tsx
"use client";

import LanguageSwitcher from "../LanguageSwitcher";
import LoginButton from "../buttons/login-button";
import RegisterButton from "../buttons/register-button";
import Image from "next/image";
import HeaderWrapper from "../ui/header-wrapper";
import { useScrollToSection } from "@/hooks/useScrollToSection";
import { useState } from "react";
import { Button } from "@clearcut/ui/button";

import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/lib/auth";
import dynamic from "next/dynamic";

/**
 * Code-split, client-only. The header is rendered by the blog layout on EVERY
 * page, so anything it imports statically lands in the critical path of the
 * whole site. This modal was doing exactly that while being invisible until a
 * user clicks the language switcher.
 *
 * It is a genuinely free win because the modal renders NOTHING when closed:
 * `modals-bottom-sheet` wraps its body in `<AnimatePresence>{isOpen && …}`,
 * so with `isOpen={false}` the server already emitted no markup for it.
 * `ssr: false` therefore produces byte-identical HTML — no hydration
 * mismatch, no layout shift, no SEO change — while moving the modal and its
 * dependency tree (modals-bottom-sheet, the language store, next-intl routing
 * helpers, Card, Button) out of the initial bundle.
 *
 * Note this does NOT remove framer-motion from the critical path: the header's
 * own mobile menu uses `motion.div` / `AnimatePresence` directly (below), so
 * the library is still required eagerly. That is intentional and correct —
 * framer-motion stays.
 */
const LanguageModal = dynamic(() => import("../feature/language-modal"), {
  ssr: false,
});

type SectionId =
  | "features"
  | "reviews"
  | "faqs"
  | "hero"
  | "pricing"
  | "howitworks"
  | "comparison"
  | "carousel";

const links: { id: SectionId; label: string }[] = [
  // { id: "pricing", label: "Pricing" },
  { id: "features", label: "Features" },
  { id: "reviews", label: "Reviews" },
  { id: "faqs", label: "FAQs" },
];

const Overlay = ({ onClick }: { onClick: () => void }) => (
  <motion.div
    className="fixed inset-0 bg-black z-40" // z-index should be below header's 50
    onClick={onClick}
    initial={{ opacity: 0 }}
    animate={{ opacity: 0.5 }}
    exit={{ opacity: 0 }}
  />
);
export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState(false);

  const scrollToSection = useScrollToSection(50); // offset = navbar height
  const { goToLogin } = useAuthStore();

  return (
    <>
      {isMenuOpen && <Overlay onClick={() => setIsMenuOpen(false)} />}
      <HeaderWrapper>
        
        <nav className=" mx-auto px-4 sm:px-6 md:px-8 lg:px-24 py-2 h-16 flex items-center justify-between">
          <div className="flex items-center">
            <Image
              src={"/logo/clear_cutoff_logo.png"}
              alt="Logo"
              width={160}
              height={42}
            />
            {/* <div className="text-brand heading-large">Academy</div> */}
          </div>

          <ul className="hidden md:flex items-center space-x-2 gap-4">
            {/* {links.map((link, index) => (
              <button
                key={`${link.id}-${index}`}
                onClick={() => scrollToSection(link.id)}
                className="hover:text-blue-600 transition"
              >
                {link.label}
              </button>
            ))} */}

          </ul>
          <div className="flex items-center space-x-4">
            <div className=" gap-2 hidden md:flex">
              {/* <LoginButton /> */}
              <RegisterButton isFull={true}/>
            </div>

            <LanguageSwitcher onClick={() => setIsLanguageModalOpen(true)} />
            <div className=" flex md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="inline-flex items-center bg-[#0083ff] w-[48px] h-[32px] justify-center rounded-[20px] p-2 text-white"
                aria-expanded={isMenuOpen}
                aria-label={isMenuOpen ? "Close menu" : "Open menu"}
              >
                {isMenuOpen ? (
                  <Image
                    src="/images/cross.svg"
                    alt="ClearCutoff Logo"
                    width={12}
                    height={12}
                    className="h-[12px] w-[12px] object-contain"
                    priority
                  />
                ) : (
                  <Image
                    src="/images/hamburger.svg"
                    alt="ClearCutoff Logo"
                    width={16}
                    height={10}
                    className="h-[10px] w-[16px] object-contain"
                    priority
                  />
                )}
              </button>
            </div>
          </div>
        </nav>
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              className="md:hidden border-t border-gray-200 z-50"
              initial={{ y: -30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -30, opacity: 0 }}
              transition={{ duration: 0.1, ease: "easeInOut" }}
            >
              <div className="space-y-1 px-2 pt-2 pb-3 sm:px-3">
                {/* {navLinks
              .filter((link) => link.isActive)
              .map((link) => (
                <div
                  key={link.text}
                  onClick={() => handleNavClick(link.href)}
                  className="block rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                >
                  {link.text}
                </div>
              ))} */}
              </div>
              <div className="border-t border-gray-200 pt-4 pb-3">
                <div className="flex flex-col gap-2 px-4">
                  <Button
                    variant="outlined"
                    size="lg"
                    fullWidth
                    onClick={() => {
                      goToLogin();
                      setIsMenuOpen(false);
                    }}
                  >
                    Log In
                  </Button>
                  <Button
                    size="lg"
                    fullWidth
                    onClick={() => {
                      goToLogin();
                      setIsMenuOpen(false);
                    }}
                  >
                    Start for FREE
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </HeaderWrapper>
      <LanguageModal isOpen={isLanguageModalOpen} onClose={() => setIsLanguageModalOpen(false)} />
    </>
  );
}
