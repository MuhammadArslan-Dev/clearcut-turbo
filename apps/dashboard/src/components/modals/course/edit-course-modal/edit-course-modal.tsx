"use client";

import { useIsMobile } from "@/hooks/useIsMobile";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { DrawerSheet } from "@/components/features/Sheets/DrawerSheet";
import { Modal } from "@/components/features/Sheets/Modal";
import { useCourseStore } from "@/store/course/useCourseStore";
import {
  ArrowIcon,
  HindiLangCircleIcon,
  WarningCircleIcon,
} from "@/components/ui/icons";
import EnLangCirlcIcon from "@/components/ui/icons/en-lang-circle-icon";
import OptionSelectionCard from "@/components/ui/cards/option-selection-card";
import { useLevels } from "@/hooks/onboarding/useLevels";
import { LevelTranslation, purchaseLevels } from "@/lib/api/onboarding";
import { useEditEnrollmentGetData } from "@/hooks/course/useEditEnrollmentGetData";
import { AnimatePresence, motion } from "framer-motion";
import ShimmerButton from "@/components/ui/button/shimmer-button";
import { ChevronDoubleRightIcon } from "@heroicons/react/24/outline";
import useButtonArrowAnimation from "@/hooks/useButtonArrowAnimation";
import { useTranslations } from "next-intl";
import { useInvalidateQuery } from "@/hooks/useInvalidateQuery";
import {
  MY_COURSES_KEY,
  useMyActiveCourses,
} from "@/hooks/course/useMyActiveCourses";
import { parseTranslation } from "@/utils/text/translation";
import useLanguageSwitch from "@/hooks/useLanguageSwitch";
import { useDrawerBackHandler } from "@/hooks/Global/useDrawerBackHandler";
import { useRouter } from "@/i18n/navigation";
import TabSwitch from "@/components/ui/tabs/TabSwitch";
import Button from "@clearcut/ui/button";
import Text from "@clearcut/ui/text";

type Level = {
  id: number;
  name: string;
  parent_id: number | null;
  group?: string;
};

type SelectionState = {
  path: Level[];
  finalSelection: Level | null;
};

const LANGUAGES = [
  { id: "english", title: "English", code: "en", icon: <EnLangCirlcIcon /> },
  { id: "hindi", title: "हिंदी", code: "hi", icon: <HindiLangCircleIcon /> },
];

export default function EditCourseModal() {
  const { isOpen, data, close, mode, onSuccess } = useCourseStore();
  const isMobile = useIsMobile();
  const modalT = useTranslations("modals.editCourseModal");
  const invalidateMyCourses = useInvalidateQuery(MY_COURSES_KEY);
  const { locale } = useLanguageSwitch();
  useDrawerBackHandler();
  const router = useRouter();
  const { courses, clearCache: clearMyActiveCourses } = useMyActiveCourses();
  const [saveChangesLoading, setSaveChangesLoading] = useState(false);
  const [continueLearningLoading, setContinueLearningLoading] = useState(false);

  const course = useMemo(() => {
    return courses?.courses.find((c) => c.exam_id === data?.id);
  }, [data?.id, courses?.courses]);
  const courseLanguage = course?.language ?? "english";

  const [contentLang, setContentLang] = useState<string>("english");

  const { levels: levelsRaw = [], loading } = useLevels(data?.id);
  const { data: selectedData2, clearCache } = useEditEnrollmentGetData(
    data?.id,
  );

  const [selectionState, setSelectionState] = useState<
    Record<number, SelectionState>
  >({});

  const [activeRootId, setActiveRootId] = useState<number | null>(null);

  /* --------------------------------------------
   * Derived maps
   * ------------------------------------------ */

  useEffect(() => {
    if (courseLanguage) {
      setContentLang(courseLanguage ?? "english");
    }
  }, [courseLanguage]);

  const transCache = useMemo(
    () =>
      new Map(
        levelsRaw.map((c) => [
          c.id,
          parseTranslation<LevelTranslation>(c.translation),
        ]),
      ),
    [levelsRaw],
  );

  const resetModalState = useCallback(() => {
    setContentLang("english");
    setSelectionState({});
    setActiveRootId(null);
    setPillStyle({
      width: 0,
      transform: "translateX(0px)",
    });
  }, []);

  useEffect(() => {
    if (!isOpen) {
      resetModalState();
    }
  }, [isOpen, resetModalState]);

  const levelsByParent = useMemo(() => {
    const map = new Map<number | null, Level[]>();
    levelsRaw.forEach((lvl) => {
      if (!map.has(lvl.parent_id)) map.set(lvl.parent_id, []);
      map.get(lvl.parent_id)!.push(lvl);
    });
    return map;
  }, [levelsRaw]);

  const parentLevels = useMemo(
    () => levelsByParent.get(null) ?? [],
    [levelsByParent],
  );

  /* --------------------------------------------
   * Init selection from API
   * ------------------------------------------ */
  useEffect(() => {
    if (selectedData2) setSelectionState(selectedData2);
  }, [selectedData2]);

  /* --------------------------------------------
   * Initialize first root once
   * ------------------------------------------ */
  useEffect(() => {
    if (!parentLevels.length || activeRootId !== null) return;

    // 🔎 Find first root that has children
    const selectedRoot =
      parentLevels.find(
        (root) => (levelsByParent.get(root.id) ?? []).length > 0,
      ) || parentLevels[0];

    setActiveRootId(selectedRoot.id);

    setSelectionState((prev) => {
      if (prev[selectedRoot.id]) return prev;

      const children = levelsByParent.get(selectedRoot.id) ?? [];

      return {
        ...prev,
        [selectedRoot.id]: {
          path: [selectedRoot],
          finalSelection: children.length === 0 ? selectedRoot : null,
        },
      };
    });
  }, [parentLevels, levelsByParent, activeRootId]);

  /* --------------------------------------------
   * Handlers
   * ------------------------------------------ */
  const handleRootClick = useCallback(
    (root: Level) => {
      setActiveRootId(root.id);
      setSelectionState((prev) => {
        if (prev[root.id]) return prev;
        const children = levelsByParent.get(root.id) ?? [];
        return {
          ...prev,
          [root.id]: {
            path: [root],
            finalSelection: children.length === 0 ? root : null,
          },
        };
      });
    },
    [levelsByParent],
  );

  const handleSelect = useCallback(
    (item: Level) => {
      if (!activeRootId) return;
      const children = levelsByParent.get(item.id) ?? [];

      setSelectionState((prev) => {
        const existing = prev[activeRootId];
        if (!existing || existing.path.some((p) => p.id === item.id))
          return prev;

        return {
          ...prev,
          [activeRootId]: {
            path: [...existing.path, item],
            finalSelection: children.length === 0 ? item : null,
          },
        };
      });
    },
    [activeRootId, levelsByParent],
  );

  const handleEdit = useCallback(
    (replaceAtId: number, newItem: Level) => {
      if (!activeRootId) return;
      const children = levelsByParent.get(newItem.id) ?? [];

      setSelectionState((prev) => {
        const existing = prev[activeRootId];
        if (!existing) return prev;

        const index = existing.path.findIndex((i) => i.id === replaceAtId);
        if (index === -1) return prev;

        return {
          ...prev,
          [activeRootId]: {
            path: [...existing.path.slice(0, index), newItem],
            finalSelection: children.length === 0 ? newItem : null,
          },
        };
      });
    },
    [activeRootId, levelsByParent],
  );

  /* --------------------------------------------
   * Derived UI state
   * ------------------------------------------ */
  const activeState = activeRootId ? selectionState[activeRootId] : undefined;
  const selectedPath = activeState?.path ?? [];
  const currentParentId =
    selectedPath[selectedPath.length - 1]?.id ?? activeRootId;

  const currentChildren =
    currentParentId != null ? (levelsByParent.get(currentParentId) ?? []) : [];

  const isAllSelected = useMemo(() => {
    if (!parentLevels.length) return false;

    return parentLevels.every((root) => {
      const hasChildren = (levelsByParent.get(root.id)?.length ?? 0) > 0;
      if (!hasChildren) return true;
      return !!selectionState[root.id]?.finalSelection;
    });
  }, [parentLevels, levelsByParent, selectionState]);

  const { buttonPhase } = useButtonArrowAnimation({
    data: isAllSelected,
  });

  /* --------------------------------------------
   * Tabs pill animation
   * ------------------------------------------ */
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const [pillStyle, setPillStyle] = useState({
    width: 0,
    transform: "translateX(0px)",
  });

  const activeIndex = useMemo(() => {
    if (!parentLevels.length || activeRootId == null) return null;
    const i = parentLevels.findIndex((p) => p.id === activeRootId);
    return i >= 0 ? i : null;
  }, [parentLevels, activeRootId]);

  useLayoutEffect(() => {
    if (activeIndex == null) return;
    const el = tabRefs.current[activeIndex];
    if (!el) return;

    setPillStyle({
      width: el.offsetWidth,
      transform: `translateX(${el.offsetLeft}px)`,
    });
  }, [activeIndex]);

  /* --------------------------------------------
   * Purchase
   * ------------------------------------------ */
  const handlePurchase = async ({
    continueLearning = false,
  }: { continueLearning?: boolean } = {}) => {
    if (!data?.id) return;

    continueLearning
      ? setContinueLearningLoading(true)
      : setSaveChangesLoading(true);

    // `selections` is a full re-sync, not a delta: POST /v1/exam/selectedexam
    // DELETEs every enrollment row for this exam and recreates them from what
    // is sent (and UExamEnrollment has no SoftDeletes trait, so that delete is
    // permanent). Any already-enrolled paper missing from this payload is
    // therefore destroyed, not left alone.
    //
    // Papers the user is already enrolled in arrive via `selectedData2` and are
    // preloaded into `selectionState`. They are kept unconditionally — a
    // preloaded root whose `finalSelection` is null is an incomplete path, not
    // an intent to unenrol, and dropping it would silently delete a paper the
    // user never touched.
    const selections = Object.fromEntries(
      Object.entries(selectionState)
        .filter(([id, s]) => s.finalSelection || selectedData2?.[Number(id)])
        .map(([id, s]) => [Number(id), s.path.map((l) => l.id)]),
    );

    try {

      const res = await purchaseLevels({
        language: contentLang,
        exam_id: data.id,
        selections,
        course_lang: contentLang,
      });

      if (res?.status === "success") {
        setContinueLearningLoading(false);
        setSaveChangesLoading(false);

        clearCache(); // clear cache.

        invalidateMyCourses(); // refresh courses list

        // Screen-specific refresh (e.g. preparation's paper tabs). See the
        // `onSuccess` docs in useCourseStore.
        onSuccess?.();

        if (continueLearning) {
          router.push(`/preparation/${res?.data?.group_code}`);
        }

        close();
      }
    } catch (error) {
      setContinueLearningLoading(false);
      setSaveChangesLoading(false);
    }
  };

  const tabItems = parentLevels.map((tab) => {
    const data = transCache.get(tab.id)?.[locale];

    return {
      id: tab.id.toString(),
      label: (
        <div className="flex flex-col">
          <span className="heading-small ">{data?.name}</span>
          <span className="body-xsmall !font-normal">{data?.detail}</span>
        </div>
      ),
      subLabel: data?.detail,
    };
  });

  const Container = useMemo(() => (isMobile ? DrawerSheet : Modal), [isMobile]);

  if (!isOpen || mode !== "edit") return null;

  return (
    <AnimatePresence>
      <Container
        isOpen={isOpen}
        onClose={close}
        maxWidth="max-w-[800px]"
        maxHeight="md:max-h-[95vh]"
      >
        {/* ROOT WRAPPER */}
        <div
          className="!bg-gray-100 min-h-[50vh] max-h-[95vh] flex flex-col overflow-hidden"
        >
          {/* <div className="flex flex-col !bg-gray-100 h-full md:max-h-[95vh] overflow-hidden"> */}
          {/* HEADER */}
          <div className="sticky top-0 z-10 flex items-center gap-4 px-4 py-4 bg-white">
            <div className="cursor-pointer" onClick={close}>
              <ArrowIcon />
            </div>
            <div className="heading-medium !font-semibold text-surface-gray-normal">
              {modalT("title", {
                exam: data?.short_name + " Exam",
              })}
            </div>
          </div>

          {/* CONTENT LANGUAGE */}
          <div className="flex-1 space-y-4 py-4 overflow-y-auto">
            <div className="md:px-4">
              <div className="flex flex-col gap-4 px-3 py-3 bg-white md:rounded-lg">
                <div>
                  <p className="heading-medium !font-semibold">
                    {modalT("contentLanguage.title")}
                  </p>
                  <p className="body-small !font-normal text-surface-gray-muted">
                    {modalT("contentLanguage.subtitle")}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {LANGUAGES.map((lang) => (
                    <OptionSelectionCard
                      key={lang.id}
                      padding="11.5px 20px"
                      borderRadius={8}
                      content={
                        <span className="flex items-center gap-2">
                          {lang.icon}
                          <p>{lang.title}</p>
                        </span>
                      }
                      onClick={() => setContentLang(lang.id)}
                      selected={lang.id === contentLang}
                      showIcon={true}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* SCROLLABLE MIDDLE */}
            <div className="md:px-4">
              <div className="bg-white pt-2 md:rounded-lg">
                {parentLevels.length > 1 && (
                  <div className="flex flex-col">
                    <div className="flex px-3  md:px-3">
                      {loading ? (
                        <TabsSkeleton />
                      ) : (
                        <>
                          <TabSwitch
                            layoutScopeId="paper-change"
                            scrollable
                            items={tabItems}
                            value={
                              parentLevels[activeIndex ?? 0]?.id?.toString() ??
                              null
                            }
                            onChange={(id) => {
                              const tab = parentLevels.find(
                                (t) => t.id.toString() === id,
                              );
                              if (tab) handleRootClick(tab);
                            }}
                            activeTextColor="text-white !py-1 px-8 !min-w-[100px]"
                            inactiveTextColor="text-surface-gray-normal !py-1 px-6 !min-w-[100px] "
                            tabFontWeight=""
                            activeTabFontWeight="!font-semibold"
                            containerBg="bg-white"
                            containerRadius="rounded-t-lg"
                            className="!min-h-10 !w-auto  !py-0 !px-3 mt-1 gap-2 -mx-3 md:w-fit"
                            activeTabBg="bg-[var(--color-brand-dark)]"
                            tabRadius="rounded-t-lg"
                            tabBg="bg-[var(--color-brand-dark)]/12 rounded-t-lg"
                          />
                        </>
                      )}
                    </div>

                    {/* Bottom border */}
                    <div className="h-0.5 bg-[var(--color-brand-dark)] w-full" />
                  </div>
                )}

                {loading ? (
                  <LevelSkeleton />
                ) : (
                  <div className="flex flex-col gap-3 px-3 py-3">
                    <div className="flex items-center gap-2 ">
                      <WarningCircleIcon
                        variant="triangle_error"
                        color="var(--icon-notice-normal"
                      />
                      <Text
                        variant="body-small"
                        className="!text-[var(--icon-notice-normal)]"
                      >
                        {modalT("warning", {
                          count: 3,
                          remaining: (course?.edit_count ?? 0) + " / 3",
                        })}
                      </Text>
                    </div>
                    <AnimatePresence mode="wait">
                    <motion.div
                      key={activeRootId ?? "none"}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.2 }}
                      className="flex flex-col gap-3"
                    >
                    {selectedPath.map((item, index) => {
                      const levels = levelsRaw.filter(
                        (l) => l.parent_id === item.id,
                      );
                      const nextSelected = selectedPath[index + 1];

                      if (!nextSelected || !levels.length) return null;
                      const data = transCache.get(levels[0].id)?.[locale];

                      return (
                        <div
                          key={item.id}
                          className="flex-1 bg-white space-y-4"
                        >
                          <p className="heading-medium !font-semibold">
                            {data?.group}
                          </p>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {levels.map((level) => {
                              const data = transCache.get(level?.id)?.[locale];

                              return (
                                <OptionSelectionCard
                                  key={level.id}
                                  borderRadius={8}
                                  padding="11.5px 20px"
                                  selected={level.id === nextSelected.id}
                                  showIcon
                                  onClick={() =>
                                    course?.edit_count! < 3 &&
                                    handleEdit(nextSelected.id, level)
                                  }
                                  cursor={
                                    course?.edit_count! < 3
                                      ? "pointer"
                                      : "not-allowed"
                                  }
                                  content={<p>{data?.name}</p>}
                                />
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}

                    {currentChildren.length > 0 && (
                      <div className="flex-1 bg-white space-y-4">
                        <p className="heading-medium !font-semibold">
                          {
                            transCache.get(currentChildren[0]?.id)?.[locale]
                              ?.group
                          }
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {currentChildren.map((level) => {
                            const data = transCache.get(level?.id)?.[locale];

                            return (
                              <OptionSelectionCard
                                key={level.id}
                                borderRadius={8}
                                padding="11.5px 20px"
                                showIcon
                                onClick={() =>
                                  course?.edit_count! < 3 && handleSelect(level)
                                }
                                content={<p>{data?.name}</p>}
                                cursor={
                                  course?.edit_count! < 3
                                    ? "pointer"
                                    : "not-allowed"
                                }
                              />
                            );
                          })}
                        </div>
                      </div>
                    )}
                    </motion.div>
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* FOOTER */}
          <div className="p-4 sticky bottom-0 w-full bg-white flex justify-center">
            <div className="w-full max-w-[600px] space-y-1">
              <div className="flex md:flex-row flex-col gap-3 items-center w-full justify-center">
                <div className="w-full md:w-[300px]">
                  <ShimmerButton
                    loading={continueLearningLoading}
                    text={modalT("saveContinue")}
                    disabled={currentChildren.length > 0 || saveChangesLoading}
                    shimmer={buttonPhase === "shimmer"}
                    onClick={() => {
                      handlePurchase({ continueLearning: true });
                    }}
                    icon={
                      <motion.span
                        animate={buttonPhase === "icon" ? { x: 6 } : { x: 0 }}
                        transition={{
                          duration: 0.8,
                          repeat: Infinity,
                          repeatType: "reverse",
                        }}
                      >
                        <ChevronDoubleRightIcon strokeWidth={3} width={16} />
                      </motion.span>
                    }
                    iconPosition="right"
                  />
                </div>
              </div>
              <p className="body-small text-center text-surface-gray-muted mt-1">
                {modalT("helperText")}
              </p>
              <div className="flex md:flex-row flex-col gap-3 items-center w-full justify-center">
                <div className="w-full md:w-[300px]">
                  <Button
                    fullWidth
                    size="sm"
                    sx={{ borderRadius: "50px" }}
                    color="gray"
                    variant="soft"
                    loading={saveChangesLoading}
                    disabled={
                      currentChildren.length > 0 || continueLearningLoading
                    }
                    onClick={() => handlePurchase()}
                  >
                    {modalT("saveChanges")}{" "}
                  </Button>
                </div>
              </div>
            </div>
          </div>
          {/* </div> */}
        </div>
      </Container>
    </AnimatePresence>
  );
}

const TabsSkeleton = () => (
  <div className="flex flex-col px-3 animate-pulse ">
    <div className="grid grid-cols-2">
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="h-12 rounded-t-lg bg-gray-200" />
      ))}
    </div>
  </div>
);
const LevelSkeleton = () => (
  <div className="flex flex-col gap-2 px-3 py-2 animate-pulse">
    <div className="h-6 w-[150px] rounded-lg bg-gray-200" />
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="h-12 rounded-lg bg-gray-200" />
      ))}
    </div>
  </div>
);
