import { motion } from "framer-motion";

type OverlayProps = {
  onClick: () => void;
  variants?: "normal" | "modal";
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
        className="absolute  inset-0 bg-black"
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
      className="fixed inset-0 bg-black z-[999]"
      onClick={onClick}
      variants={overlayVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      transition={{ duration: 0.2, ease: "easeInOut" }}
    />
  );
}
