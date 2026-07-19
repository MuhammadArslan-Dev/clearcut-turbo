import React from "react";
import ContinueFreeButton from "../ui/buttons/ContinueFreeButton";
import clsx from "clsx";

const FloatingButton: React.FC = () => (
  <div className={clsx("sticky bottom-0 z-50 right-0 left-0")}>
    <div className="md:hidden z-[var(--z-floating-cta)] bg-white w-full py-3 px-3 shadow-[var(--shadow-floating-bar)] transition-shadow duration-300">
      <ContinueFreeButton fullWidth showShimmer text="Start 3-day FREE trial" />
    </div>
  </div>
);

export default FloatingButton;
