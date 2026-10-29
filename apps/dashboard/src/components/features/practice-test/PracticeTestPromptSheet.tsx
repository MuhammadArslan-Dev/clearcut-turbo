"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Target } from "lucide-react";
import Text from "@clearcut/ui/text";
import { Button } from "@clearcut/ui/button";
import ShimmerButton from "@/components/ui/button/shimmer-button";
import { Modal } from "@/components/features/Sheets/Modal";
import { ChevronIcon } from "@/components/ui/icons";
import { useIsMobile } from "@/hooks/useIsMobile";

/**
 * Asked right after a learner's first subjects are saved (and again on the
 * Preparation page while it is still unanswered): take the short practice test,
 * or go to Preparation. Full screen on phones, the shared Modal from `md` up.
 *
 * It can only be answered with one of the two buttons. Backdrop, Esc and
 * browser back do NOT close it, so an accidental tap can never use the choice
 * up. (An unanswered prompt is remembered on the backend as `offered`, so it
 * comes back after a refresh or when the learner returns to the course.)
 *
 * Layout follows the approved onboarding design: illustration (one small webp,
 * `public/images/practice-test-prompt.webp`), two-line title with the accent
 * line in brand blue, body, the "No Pressure!" note, Take (filled) + Skip (outlined).
 */
export default function PracticeTestPromptSheet({
  isOpen,
  onTake,
  onSkip,
}: {
  isOpen: boolean;
  onTake: () => void;
  onSkip: () => void;
}) {
  const t = useTranslations("PracticeTest");
  const isMobile = useIsMobile();
  const reduceMotion = useReducedMotion();
  const rise = (delay: number) =>
    reduceMotion
      ? {}
      : { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.35, delay, ease: "easeOut" as const } };

  const content = (
    <div className={isMobile ? "flex min-h-dvh flex-col bg-white pb-[max(1.5rem,env(safe-area-inset-bottom))]" : "flex flex-col bg-white pb-6"}>
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        // Desktop: width follows the viewport height (illustration is 780x602) so the whole modal fits short screens (e.g. 1536x738) without clipping the buttons.
        style={isMobile ? undefined : { width: "min(380px, calc(28vh * 1.296))" }}
        className={isMobile ? "w-full" : "mx-auto max-w-full [mask-image:linear-gradient(to_right,transparent,black_14%,black_86%,transparent),linear-gradient(to_bottom,transparent,black_10%,black_88%,transparent)] [mask-composite:intersect]"}
      >
        <Image src="/images/practice-test-prompt.webp" alt="" width={780} height={602} priority className="h-auto w-full" />
      </motion.div>

      <div className="flex flex-col items-center gap-3 px-5 text-center">
        <motion.div {...rise(0.1)}>
          <Text as="h2" variant={isMobile ? "heading-xlarge" : "heading-large"} weight="bold" color="gray-normal">
            <span className="block">{t("prompt.titleTop")}</span>
            <span className="block text-brand">{t("prompt.titleAccent")}</span>
          </Text>
        </motion.div>
        <motion.div {...rise(0.18)}>
          <Text as="p" variant={isMobile ? "body-large" : "body-medium"} color="gray-muted" className="mx-auto max-w-[420px]">
            {t("prompt.body")}
          </Text>
        </motion.div>
      </div>

      <motion.div {...rise(0.26)} className="mx-auto mt-5 w-full max-w-[420px] px-5">
        <div className="flex items-center gap-4 rounded-2xl border border-[var(--color-border-gray-subtle)] bg-[var(--color-primary-bg-soft)]/40 p-4 text-left">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary-bg-soft)] text-brand">
            <Target size={24} />
          </span>
          <div className="min-w-0">
            <Text as="p" variant="body-large" weight="semibold" color="gray-normal">
              {t("prompt.noPressureTitle")}
            </Text>
            <Text as="p" variant="body-small" color="gray-muted">
              {t("prompt.noPressureBody")}
            </Text>
          </div>
        </div>
      </motion.div>

      {isMobile && <div className="flex-1" />}

      <div className={`mx-auto flex w-full max-w-[420px] flex-col gap-3 px-5 ${isMobile ? "pt-8" : "pt-5"}`}>
        <ShimmerButton
          size="lg"
          shimmer={!reduceMotion}
          text={t("prompt.take")}
          iconPosition="right"
          icon={<ChevronIcon size={16} variant="right" color="white" />}
          onClick={onTake}
        />
        <Button variant="outlined" color="gray" size="md" fullWidth sx={{ borderRadius: "50px" }} onClick={onSkip}>
          {t("prompt.skip")}
        </Button>
      </div>
    </div>
  );

  return (
    <AnimatePresence>
      {isOpen &&
        (isMobile ? (
          <motion.div
            key="practice-prompt-screen"
            role="dialog"
            aria-modal="true"
            aria-label={t("prompt.title")}
            className="fixed inset-0 z-[1000] overflow-y-auto bg-white"
            initial={reduceMotion ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
          >
            {content}
          </motion.div>
        ) : (
          <Modal isHeader={false} isOpen={isOpen} maxWidth="max-w-[460px]" dismissible={false} onClose={() => {}}>
            {content}
          </Modal>
        ))}
    </AnimatePresence>
  );
}
