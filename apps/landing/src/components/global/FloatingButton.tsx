import React from "react";
import ContinueFreeButton from "../ui/buttons/ContinueFreeButton";
import clsx from "clsx";
import { useTranslations } from "next-intl";

const FloatingButton: React.FC<{ course?: string }> = ({ course }) => {
  // Was hard-coded English on the hi/mr pages too (CC-67).
  const t = useTranslations("common");
  return (
  <div className={clsx("sticky bottom-0 z-50 right-0 left-0")}>
    <div className="md:hidden z-[var(--z-floating-cta)] bg-white w-full py-3 px-3 shadow-[var(--shadow-floating-bar)] transition-shadow duration-300">
      <ContinueFreeButton fullWidth showShimmer text={t("startTrial")} course={course} />
    </div>
  </div>
  );
};

export default FloatingButton;
