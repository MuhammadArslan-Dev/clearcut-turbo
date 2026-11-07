"use client";

/**
 * Dev/QA only. Motion-preview "Enrollment": the real exam-enrollment sheet (mirrored from
 * modals/course/buy-sigle-course/buy-sigle-course-modal.tsx: StepIndicatorCard, "Select Paper" cards, "Select Subjects"
 * groups, ShimmerButton, the same copy keys; bottom sheet on phones, modal from md) with sample papers and local state,
 * followed by the library's `EnrollSuccess` playing INSIDE the sheet, which then hands over to the Preparation page the real
 * flow opens (`/preparation/{group_code}?subject_selected=1`). The optional practice-test sheet (Amplitude flag) is not
 * part of this animation. Nothing here touches the real modal, store, API or analytics.
 */
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ChevronDoubleRightIcon } from "@heroicons/react/24/outline";
import { useTranslations } from "next-intl";
import { EnrollSuccess } from "@clearcut/motion/enrollment";
import OptionSelectionCard from "@/components/ui/cards/option-selection-card";
import ShimmerButton from "@/components/ui/button/shimmer-button";
import StepIndicatorCard from "@/components/features/onboarding/indicator/StepIndicatorCard";
import useButtonArrowAnimation from "@/hooks/useButtonArrowAnimation";
import type { OnboardingStep } from "@/types/onboarding/onboarding";
import { useMotionLang } from "@/components/features/test-motion/TestStartIntro";
import { MockDashboard, MockPreparation } from "./MockScreens";

type L = { en: string; hi: string };
type Node = { id: string; name: L; detail?: L; group?: L; children?: Node[] };

// Sample HTET-style papers (the real ones come from the backend: Paper -> one option per group).
const SUBJECT_GROUP: Node[] = [
  { id: "ms", name: { en: "Maths & Science", hi: "गणित और विज्ञान" } },
  { id: "ss", name: { en: "Social Studies", hi: "सामाजिक विज्ञान" } },
];
const withGroups = (lang1: L): Node[] => [
  { id: "hi", name: { en: "Hindi", hi: "हिंदी" }, group: lang1, children: SUBJECT_GROUP },
  { id: "en", name: { en: "English", hi: "अंग्रेज़ी" }, group: lang1, children: SUBJECT_GROUP },
].map((n) => ({ ...n, children: SUBJECT_GROUP.map((c) => ({ ...c, id: `${n.id}-${c.id}`, group: { en: "Select Subject", hi: "विषय चुनें" } })) }));

const PAPERS: Node[] = [
  { id: "l1", name: { en: "Level 1 (PRT)", hi: "लेवल 1 (PRT)" }, detail: { en: "Classes 1 to 5", hi: "कक्षा 1 से 5" } },
  {
    id: "l2",
    name: { en: "Level 2 (TGT)", hi: "लेवल 2 (TGT)" },
    detail: { en: "Classes 6 to 8", hi: "कक्षा 6 से 8" },
    children: withGroups({ en: "Select Language", hi: "भाषा चुनें" }),
  },
  { id: "l3", name: { en: "Level 3 (PGT)", hi: "लेवल 3 (PGT)" }, detail: { en: "Classes 9 to 12", hi: "कक्षा 9 से 12" } },
];

type Stage = "form" | "saving" | "enroll" | "prep";

const arrow = (phase: string) => (
  <motion.span
    animate={phase === "icon" ? { x: 6 } : { x: 0 }}
    transition={{ duration: 0.8, repeat: Infinity, repeatType: "reverse" }}
  >
    <ChevronDoubleRightIcon strokeWidth={3} width={16} />
  </motion.span>
);

export default function EnrollmentDemo({ slowData }: { slowData: boolean }) {
  const lang = useMotionLang();
  const modalT = useTranslations("modals.buySingleCourseModal");
  const examName = "HTET Exam";

  const [stage, setStage] = useState<Stage>("form");
  const [step, setStep] = useState(0);
  const [path, setPath] = useState<Node[]>([]);
  const [ready, setReady] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const paper = path[0] ?? null;
  const last = path[path.length - 1];
  const nextChildren = last?.children ?? [];

  const steps: OnboardingStep[] = useMemo(
    () => [
      { id: "exam", title: modalT("paperSelection.title"), highlightText: modalT("paperSelection.highlight_text"), description: examName },
      { id: "level", title: modalT("subjectSelection.title"), highlightText: modalT("subjectSelection.highlight_text"), description: `${examName} ${paper ? paper.name[lang] : ""}` },
    ],
    [modalT, paper, lang],
  );

  const pickPaper = (p: Node) => {
    setPath([p]);
    setShowHint(false);
  };
  const pickOption = (replaceAt: number, n: Node) => {
    setPath((prev) => [...prev.slice(0, replaceAt), n]);
    setShowHint(false);
  };

  const canStart = !!paper && nextChildren.length === 0;
  const { buttonPhase: nextPhase } = useButtonArrowAnimation({ data: paper !== null });
  const { buttonPhase: startPhase } = useButtonArrowAnimation({ data: canStart });

  const startLearning = () => {
    setStage("saving");
    setTimeout(() => {
      setReady(false);
      setStage("enroll");
    }, 700);
  };
  useEffect(() => {
    if (stage !== "enroll") return;
    const id = setTimeout(() => setReady(true), slowData ? 6500 : 2600);
    return () => clearTimeout(id);
  }, [stage, slowData]);

  const header = (
    <div className="sticky top-0 z-50 bg-white">
      {/* The real header fires an Amplitude event on Back; in the preview Back only steps back inside the sheet. */}
      <div
        onClickCapture={(e) => {
          if ((e.target as HTMLElement).closest("button")) {
            e.stopPropagation();
            if (step > 0) {
              setStep(0);
              setShowHint(false);
            }
          }
        }}
      >
        <StepIndicatorCard
          data={steps}
          currentStep={step}
          title={steps[step].title}
          titleHeightLight={steps[step].highlightText}
          description={steps[step].description}
          goBack={() => {}}
        />
      </div>
    </div>
  );

  const paperStep = (
    <div className="md:px-4">
      <div className="flex-1 overflow-y-auto p-4 bg-white space-y-4 md:rounded-md">
        <div>
          <p className="heading-medium !font-semibold">{modalT("paperSelection.selectPaperTitle", { exam: examName })}</p>
          <p className="body-xsmall !font-normal text-surface-gray-muted">{modalT("paperSelection.selectPaperSubtitle")}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {PAPERS.map((p) => (
            <OptionSelectionCard
              key={p.id}
              padding="12px 20px"
              borderRadius={8}
              selected={paper?.id === p.id}
              showIcon
              onClick={() => pickPaper(p)}
              content={
                <span className="flex flex-col items-start">
                  <h6 className="heading-small !font-semibold text-surface-gray-normal">{p.name[lang]}</h6>
                  <p className="body-small !font-normal text-surface-gray-muted">{p.detail?.[lang]}</p>
                </span>
              }
            />
          ))}
        </div>
      </div>
    </div>
  );

  // One card per group already answered (with its pick shown selected), then the group still to answer.
  const groups: { owner: Node; index: number }[] = [];
  path.forEach((n, i) => {
    if (n.children?.length) groups.push({ owner: n, index: i });
  });
  const subjectStep = (
    <div className="md:px-4 pb-[92px] md:pb-0">
      {groups.map(({ owner, index }) => (
        <div key={owner.id} className="flex-1 p-4 mb-3 bg-white space-y-4 md:rounded-md">
          <div>
            <p className="heading-medium !font-semibold">{owner.children?.[0]?.group?.[lang]}</p>
            <p className="body-medium !font-normal text-surface-gray-muted">{modalT("paperSelection.selectAnyOneOption")}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {owner.children?.map((c) => (
              <OptionSelectionCard key={c.id} borderRadius={8} showIcon selected={path[index + 1]?.id === c.id} onClick={() => pickOption(index + 1, c)} content={<p>{c.name[lang]}</p>} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  const form = (
    <div className="flex flex-col gap-3 min-h-full bg-gray-100">
      {header}
      {step === 0 ? paperStep : subjectStep}
      <div className="p-4 fixed md:sticky bottom-0 w-full right-0 bg-white flex flex-col items-center gap-2">
        {showHint && (
          <p role="status" className="body-small !font-semibold text-center text-brand w-full max-w-[400px]">
            {modalT("paperSelection.selectAnyOneOption")}
          </p>
        )}
        <div className="relative w-full max-w-[400px]">
          {step === 0 ? (
            <>
              <ShimmerButton
                text={nextChildren.length > 0 ? modalT("paperSelection.continue") : modalT("subjectSelection.startLearning")}
                disabled={!paper}
                loading={stage === "saving"}
                shimmer={nextPhase === "shimmer"}
                onClick={() => (nextChildren.length > 0 ? setStep(1) : startLearning())}
                icon={arrow(nextPhase)}
                iconPosition="right"
              />
              {!paper && <button type="button" aria-label={modalT("paperSelection.selectAnyOneOption")} onClick={() => setShowHint(true)} className="absolute inset-0 cursor-pointer rounded-full" />}
            </>
          ) : (
            <>
              <ShimmerButton
                text={modalT("subjectSelection.startLearning")}
                disabled={!canStart}
                shimmer={startPhase === "shimmer"}
                loading={stage === "saving"}
                onClick={startLearning}
                icon={arrow(startPhase)}
                iconPosition="right"
              />
              {!canStart && <button type="button" aria-label={modalT("paperSelection.selectAnyOneOption")} onClick={() => setShowHint(true)} className="absolute inset-0 cursor-pointer rounded-full" />}
            </>
          )}
        </div>
      </div>
    </div>
  );

  const picksAfterPaper = path.slice(1).map((n) => n.name[lang]);

  if (stage === "prep") {
    return <MockPreparation examName={examName} paper={paper?.name[lang] ?? ""} picks={picksAfterPaper.length ? picksAfterPaper : [paper?.name[lang] ?? ""]} />;
  }

  return (
    <div className="relative w-full">
      <MockDashboard examName={examName} subjectsPicked={false} />
      {/* bottom sheet on phones (full height, like DrawerSheet), centred modal from md (like Modal) */}
      <div className="fixed inset-0 z-[2000] flex items-end justify-center bg-black/50 md:items-center md:p-6">
        <div className="relative h-dvh w-full overflow-hidden bg-gray-100 md:h-[min(640px,90dvh)] md:max-w-[720px] md:rounded-md">
          <div className="h-full overflow-y-auto">{form}</div>
          {stage === "enroll" && (
            <EnrollSuccess
              fit="parent"
              lang={lang}
              exam={examName}
              progress={{ current: 2, total: 2 }}
              selection={path.map((n) => ({ title: n.name[lang], subtitle: n.detail?.[lang] }))}
              ready={ready}
              onDone={() => setStage("prep")}
            />
          )}
        </div>
      </div>
    </div>
  );
}
