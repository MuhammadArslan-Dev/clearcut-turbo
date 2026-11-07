"use client";

/**
 * Dev/QA only. Motion-preview "Onboarding": the real onboarding screens (mirrored from
 * features/onboarding/steps/LanguageStep + ExamStep: same components, copy keys and layout) with sample exams and local
 * state, followed by the library's `OnboardingComplete`, which then reveals the Learn dashboard the real flow lands on
 * (`/dashboard?user_type=new`). Nothing here touches the real onboarding route, store, API or analytics.
 */
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Card } from "@clearcut/ui/card";
import { OnboardingComplete } from "@clearcut/motion/onboarding";
import CheckIcon from "@/components/ui/icons/check-icon";
import EnLangCirlcIcon from "@/components/ui/icons/en-lang-circle-icon";
import HindiLangCirclIcon from "@/components/ui/icons/hindi-lang-circle-icon";
import MarathiLangCircleIcon from "@/components/ui/icons/marathi-lang-circle-icon";
import MainContainer from "@/components/ui/main-container";
import OptionSelectionCard from "@/components/ui/cards/option-selection-card";
import MainButton from "@/components/ui/button/main-button";
import Filters from "@/components/ui/widgets/filter/Filters";
import { RotatingBadge } from "@/components/ui/animation/RotatingBadge";
import StepIndicatorCard from "@/components/features/onboarding/indicator/StepIndicatorCard";
import useButtonArrowAnimation from "@/hooks/useButtonArrowAnimation";
import { highlightTextUtil } from "@/utils/text/highlightTextUtil";
import type { OnboardingStep } from "@/types/onboarding/onboarding";
import { useMotionLang } from "@/components/features/test-motion/TestStartIntro";
import { MockDashboard } from "./MockScreens";

const LANGUAGES = [
  { code: "hi", title: "हिंदी", icon: <HindiLangCirclIcon /> },
  { code: "en", title: "English", icon: <EnLangCirlcIcon /> },
  { code: "mr", title: "मराठी", icon: <MarathiLangCircleIcon /> },
];

// Sample exams (the real list comes from the backend). `type` is what the real card prints in brackets.
const EXAMS = [
  { id: "htet", short: "HTET", state: "Haryana", type: "State" },
  { id: "reet", short: "REET", state: "Rajasthan", type: "State" },
  { id: "uptet", short: "UPTET", state: "Uttar Pradesh", type: "State" },
  { id: "ctet", short: "CTET", state: "All India", type: "Central" },
  { id: "mptet", short: "MPTET", state: "Madhya Pradesh", type: "State" },
  { id: "pstet", short: "PSTET", state: "Punjab", type: "State" },
];

type Stage = "language" | "exam" | "complete" | "dashboard";

export default function OnboardingDemo({ slowData }: { slowData: boolean }) {
  const t = useTranslations("");
  const motionLang = useMotionLang();
  const [stage, setStage] = useState<Stage>("language");
  const [langCode, setLangCode] = useState<string>("");
  const [examId, setExamId] = useState<string>("");
  const [stateFilter, setStateFilter] = useState("all");
  const [saving, setSaving] = useState(false);
  const [ready, setReady] = useState(false);

  const lang = LANGUAGES.find((l) => l.code === langCode);
  const exam = EXAMS.find((e) => e.id === examId);

  const steps: OnboardingStep[] = useMemo(
    () => [
      { id: "language", title: t("Onboarding.language.choose_language"), highlightText: t("Onboarding.language.highlight_text"), description: t("Onboarding.language.description") },
      { id: "exam", title: t("Onboarding.exam.select_exam"), highlightText: t("Onboarding.exam.highlight_text"), description: t("Onboarding.exam.description") },
    ],
    [t],
  );

  const stateTabs = useMemo(() => {
    const all = motionLang === "hi" ? "सभी" : "All";
    const seen = new Map<string, string>();
    EXAMS.forEach((e) => seen.set(e.state.toLowerCase(), e.state));
    return [{ label: all, value: "all" }, ...Array.from(seen, ([value, label]) => ({ label, value }))];
  }, [motionLang]);
  const shownExams = stateFilter === "all" ? EXAMS : EXAMS.filter((e) => e.state.toLowerCase() === stateFilter);

  const { buttonPhase: langPhase } = useButtonArrowAnimation({ data: !!langCode || null });
  const { buttonPhase: examPhase } = useButtonArrowAnimation({ data: !!examId || null });

  // The real Continue on the exam step enrolls (POST), then routes to the dashboard. Here: a short "saving" beat,
  // then the animation takes over; the dashboard "loads" in the background for 2.6 s (or 6.5 s on a slow network).
  const finish = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setReady(false);
      setStage("complete");
    }, 700);
  };
  useEffect(() => {
    if (stage !== "complete") return;
    const id = setTimeout(() => setReady(true), slowData ? 6500 : 2600);
    return () => clearTimeout(id);
  }, [stage, slowData]);

  return (
    <div className="relative w-full">
      {stage === "language" && (
        <div className="w-full h-dvh bg-white">
          <MainContainer maxWidth="max-w-[850px]" padding="md:pt-14">
            <div className="px-3 py-4 space-y-3">
              <div className="flex flex-col gap-8 items-center">
                <div className="px-4 pt-6 mb-2 flex flex-col items-center justify-between">
                  <div className="heading-xlarge !font-semibold text-surface-gray-normal text-center">{t("Onboarding.language.welcome_to")}</div>
                  <div>
                    <Image src="/logos/clear_cutoff_logo.png" width={239} height={48} alt="Main Logo" className="w-[239px] h-[48px]" priority unoptimized />
                  </div>
                </div>
                <div className="px-4 py-3">
                  <div className="heading-xlarge !font-semibold text-surface-gray-normal text-center">
                    {highlightTextUtil(t("Onboarding.language.choose_language"), t("Onboarding.language.highlight_text"))}
                  </div>
                  <div className="body-medium !font-normal text-surface-gray-muted text-center">{t("Onboarding.language.description")}</div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 py-4">
                {LANGUAGES.map((l) => (
                  <OptionSelectionCard
                    key={l.code}
                    content={
                      <span className="flex items-center gap-2">
                        {l.icon}
                        <p>{l.title}</p>
                      </span>
                    }
                    selected={langCode === l.code}
                    showIcon
                    borderRadius={8}
                    onClick={() => setLangCode(l.code)}
                  />
                ))}
              </div>
            </div>
            <div className="py-2 px-4 bg-white fixed bottom-0 left-0 right-0 md:static md:bottom-auto md:left-auto md:right-auto">
              <MainButton
                text={t("actions.continue")}
                fullWidth
                showShimmer={langPhase === "shimmer" || langPhase === "icon"}
                disabled={!langCode}
                onClick={() => setStage("exam")}
              />
            </div>
          </MainContainer>
        </div>
      )}

      {stage === "exam" && (
        <MainContainer maxWidth="max-w-[850px]" padding="md:pt-20">
          <div className="flex flex-col gap-2 pb-[60px] md:pb-0">
            {/* The real header fires an Amplitude event on Back; in the preview Back only returns to the language step. */}
            <div
              onClickCapture={(e) => {
                if ((e.target as HTMLElement).closest("button")) {
                  e.stopPropagation();
                  setStage("language");
                }
              }}
            >
              <StepIndicatorCard
                data={steps}
                currentStep={1}
                title={t("Onboarding.exam.select_exam")}
                titleHeightLight={t("Onboarding.exam.highlight_text")}
                description={t("Onboarding.exam.description")}
                goBack={() => {}}
              />
            </div>
            <div className="bg-white p-3 flex flex-col gap-2">
              <div className="flex gap-2 overflow-x-auto pb-2 -mx-3 px-4">
                <Filters
                  titleFont="body-small !font-semibold text-surface-gray-subtle"
                  badgeFont="body-medium"
                  paddingX="px-4"
                  title={t("examType.selectState")}
                  borderRadius="full"
                  marginX="-mx-3 px-3"
                  FilterItem={stateTabs}
                  onClick={setStateFilter}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 px-3 py-4 bg-white mb-3.5 md:mb-0">
              {shownExams.map((e, index) => {
                const selected = examId === e.id;
                return (
                  <Card
                    key={e.id}
                    padding="8px 20px"
                    borderRadius={8}
                    cursor="pointer"
                    bgcolor={selected ? "var(--color-primary-subtle)" : "white"}
                    bordercolor={selected ? "var(--color-brand)" : "#ccc"}
                    className={`exam-card transition-all duration-200 ease-out ${selected ? "scale-[1.005]" : "hover:-translate-y-0.5 hover:shadow-sm"}`}
                    style={{ animationDelay: `${index * 70}ms` }}
                    onClick={() => setExamId(e.id)}
                  >
                    <div className="flex justify-between items-center w-full">
                      <div>
                        <p className="heading-medium !font-semibold text-surface-gray-normal">{e.short} Exam</p>
                        <p className="body-small text-surface-gray-muted">
                          {e.state} ({e.type})
                        </p>
                      </div>
                      {selected ? <CheckIcon size={16} /> : <div className="border border-gray-400 w-4 h-4 rounded-full" />}
                    </div>
                  </Card>
                );
              })}
            </div>
            <div className="py-2 px-4 bg-white fixed bottom-0 left-0 right-0 md:static">
              <div className="flex flex-col gap-2 items-center">
                <MainButton
                  text={t("actions.continue")}
                  fullWidth
                  showShimmer={examPhase === "shimmer" || (examPhase === "icon" && !saving)}
                  disabled={!examId || saving}
                  onClick={finish}
                  loading={saving}
                />
                <RotatingBadge animationDuration={0.45} direction="up" items={["Videos", "Notes", "PDFs", "Tests"]} />
              </div>
            </div>
          </div>
        </MainContainer>
      )}

      {(stage === "complete" || stage === "dashboard") && <MockDashboard examName={`${exam?.short ?? "HTET"} Exam`} />}

      {stage === "complete" && lang && exam && (
        <OnboardingComplete
          lang={motionLang}
          ready={ready}
          onDone={() => setStage("dashboard")}
          logo={<Image src="/logos/clear_cutoff_logo.png" width={239} height={48} alt="Clear Cutoff" className="h-[34px] w-auto" unoptimized />}
          summary={[
            { title: lang.title, icon: lang.icon },
            { title: `${exam.short} Exam`, subtitle: `${exam.state} (${exam.type})` },
          ]}
        />
      )}
    </div>
  );
}
