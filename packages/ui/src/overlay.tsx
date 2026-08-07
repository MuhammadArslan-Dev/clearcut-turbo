import { motion } from "framer-motion";
import { cn } from "./utils";

type OverlayProps = {
  onClick: () => void;
  variants?: "normal" | "modal" | "tinted";
};

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 0.5 },
  exit: { opacity: 0 },
};

export function Overlay({ onClick, variants = "normal" }: OverlayProps) {
  if (variants === "modal") {
    return (
      <motion.div
        className="absolute inset-0 bg-black"
        variants={overlayVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        transition={{ duration: 0.2, ease: "easeInOut" }}
        onClick={onClick}
      />
    );
  }

  return (
    <motion.div
      className={cn(
        "fixed inset-0 z-[var(--z-modal-backdrop)]",
        variants === "tinted" ? "bg-black/60" : "bg-black",
      )}
      onClick={onClick}
      variants={overlayVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      transition={{ duration: 0.2, ease: "easeInOut" }}
    />
  );
}
