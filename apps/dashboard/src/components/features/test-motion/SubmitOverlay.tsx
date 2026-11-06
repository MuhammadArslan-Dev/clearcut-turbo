"use client";

import { AnimatePresence, motion } from "framer-motion";
import { TestSubmit, type TestSubmitProps } from "@clearcut/motion/test/flow";

/**
 * The "checking your answers" animation as an overlay ON TOP of the test screen (the page stays mounted underneath,
 * so there is no blank flash), which fades out as the result renders behind it. The host keeps this element at the
 * same keyed position in every branch it returns so the fade-out can play across the test -> result swap.
 */
export function SubmitOverlay({ open, ...props }: { open: boolean } & TestSubmitProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="submit-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          <TestSubmit size="large" presentation="sheet" {...props} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
