"use client";
import Text from "@clearcut/ui/text";
import { getMessage } from "@/lib/scoring";
import MainAppLogo from "@/components/icons/main-app-logo";
import ScoreCircle from "./score-circle";

import { motion } from "framer-motion";

import { InlineAuthFlow } from "@/lib/auth";
import ContinueFreeButton from "@/components/ui/buttons/ContinueFreeButton";

export default function ResultStep({
  score,
  color,
  course_name,
}: {
  score: number;
  color: "red" | "yellow" | "green";
  course_name?: string;
  // Accepted for interface compatibility with the caller — the original
  // untyped (`any` props) component never actually used this either.
  onContinue?: () => void;
}) {
  const message = getMessage(color);

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.3 }}
      className="w-full h-screen flex pt-12 ms:pt-0 justify-center sm:items-center bg-white"
    >
      <div className="sm:max-w-[400px] w-full flex flex-col gap-6">
        <div className="flex justify-center">
          <div className="sm:hidden block"><MainAppLogo width={290} height={58} /></div>
          <div className="sm:block hidden"><MainAppLogo width={290} height={78} /></div>
        </div>

        <div className="flex items-center gap-4 py-4 px-3 rounded-xl">
          <ScoreCircle score={score} color={color} size={70} />
          <div>
            <Text as="h5" variant="heading-medium" weight="semibold">{message.title}</Text>
            <Text as="p" variant="body-small" color="gray-muted">{message.description}</Text>
          </div>
        </div>

        <InlineAuthFlow courseName={course_name} SubmitButton={ContinueFreeButton} />
      </div>
    </motion.div>
  );
}
