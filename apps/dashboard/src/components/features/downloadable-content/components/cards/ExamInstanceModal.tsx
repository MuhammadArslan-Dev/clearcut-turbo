'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import clsx from 'clsx';
import ReactMarkdown from 'react-markdown';
import { getInstanceQuestions } from '@/lib/preparation/preparation';
import { ExamInstance } from './ExamInstanceCard';
import { Modal } from '@/components/features/Sheets/Modal';
import { DrawerSheet } from '@/components/features/Sheets/DrawerSheet';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useBackHandler } from '@/hooks/Global/useBackHandler';
import TabSwitch from '@/components/ui/tabs/TabSwitch';
import Text from '@clearcut/ui/text';
import { Card } from "@clearcut/ui/card";
import CounterCard from '@/components/ui/cards/CounterCard';
import QuestionText from '@/components/ui/cards/QuestionMaterial/Question/QuestionText';
import MathRender from '@/components/features/mathjax/Math';
import { ChevronIcon, LanguageIcon, NumberCountIcon, StarBadge } from '@/components/ui/icons';
import Image from 'next/image';
import { useContentDataStore } from '@/components/features/downloadable-content/store/useContentDataStore';
import { Button } from "@clearcut/ui/button";
import TextMarkDown from '@/components/ui/widgets/TextMarkDown';

interface QuestionOption {
  text: string | null;
  image: string | null;
}

interface QuestionTranslation {
  id: number;
  locale: string;
  text: string | null;
  image: string | null;
  options: QuestionOption[];
  correct_option: string | number | null;
  explanation: string | null;
}

interface InstanceQuestion {
  id: number;
  question_id: string;
  question_number: string | number | null;
  section_id: string;
  question: {
    id: number;
    exam_instance_id: string;
    section_id: string;
    translations: QuestionTranslation[];
  };
}

const PER_PAGE = 10;

// Prefer a readable locale when a question has several translations.
const LOCALE_PREFERENCE = ['en', 'hi', 'sa', 'ur'];

function pickTranslation(
  translations: QuestionTranslation[],
  preferred?: string | null,
): QuestionTranslation | null {
  if (!translations || translations.length === 0) return null;
  if (preferred) {
    const exact = translations.find((t) => t.locale === preferred);
    if (exact) return exact;
  }
  for (const loc of LOCALE_PREFERENCE) {
    const found = translations.find((t) => t.locale === loc);
    if (found) return found;
  }
  return translations[0];
}

interface ExamInstanceModalProps {
  instance: ExamInstance;
  paperId?: number | string | null;
  onClose: () => void;
}

export default function ExamInstanceModal({ instance, paperId, onClose, }: ExamInstanceModalProps) {
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [language, setLanguage] = useState('en');

  // Sections come from the exam syllabus already loaded in the store.
  // sectionsMap is keyed by paper id; each Section has a section_id string code
  // that matches question_new.section_id_b.
  const { sectionsMap } = useContentDataStore();
  const sections = paperId != null ? (sectionsMap[Number(paperId)] ?? []) : [];

  const sectionItems = sections.map((s) => ({
    id: s.section_id ?? String(s.id),
    label: s.name,
  }));

  // Reset section + page whenever the selected paper changes.
  useEffect(() => {
    setSelectedSection(null);
    setPage(1);
  }, [paperId]);

  // Default to the first section once sections are available.
  useEffect(() => {
    if (!selectedSection && sectionItems.length > 0) {
      setSelectedSection(sectionItems[0].id);
    }
  }, [sectionItems, selectedSection]);

  // Reset to first page whenever the section changes.
  useEffect(() => {
    setPage(1);
  }, [selectedSection]);

  const { data: questionsData, isLoading: questionsLoading, isFetching } = useQuery({
    queryKey: ['instance-questions', instance.instance_id, selectedSection, page],
    enabled: !!instance.instance_id && !!selectedSection,
    queryFn: async () => {
      const res = await getInstanceQuestions({
        instance_id: instance.instance_id,
        section_id: selectedSection as string,
        page,
        per_page: PER_PAGE,
      });
      return res.data;
    },
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false,
  });

  const questions = (questionsData?.questions ?? []) as InstanceQuestion[];
  const lastPage = questionsData?.last_page ?? 1;
  const total = questionsData?.total ?? 0;

  const hasMultipleTranslations = questions.some(
    (q) => (q?.question?.translations?.length ?? 0) > 1,
  );


  // Mobile → full-screen drawer sheet, desktop → centered modal (same as the report).
  const isMobile = useIsMobile();
  const Container = useMemo(() => (isMobile ? DrawerSheet : Modal), [isMobile]);

  // Close on browser/hardware back.
  useBackHandler({ isOpen: true, onClose });

  return (
    <AnimatePresence>
      <Container
        isHeader={false}
        isOpen
        maxWidth="md:max-w-[720px]"
        maxHeight="md:max-h-[97vh]"
        onClose={onClose}
      >
        <div className="bg-white flex flex-col h-full md:h-auto md:max-h-[85vh]">
          {/* Header */}
          <div className="shrink-0 flex items-start justify-between gap-3 px-4 py-3 border-b border-gray-100 bg-white">
            <div className="flex items-center gap-4">
              <div className="flex flex-col">
                <Text as="p" variant="heading-medium" weight="semibold" color="gray-normal">
                  {instance.exam_cycle ?? instance.instance_id}
                </Text>
                <p className="body-small text-surface-gray-light">
                  {instance.exam_year ? `Year ${instance.exam_year} • ` : ''}
                  {total > 0 ? `${total} questions` : 'Sections & Questions'}
                </p>
              </div>
              {hasMultipleTranslations && (
                <button
                  onClick={() => setLanguage((prev) => (prev === 'en' ? 'hi' : 'en'))}
                  className="flex items-center gap-1 px-2 py-1 rounded-full border border-[var(--color-brand-dark)] text-[var(--color-brand-dark)] hover:bg-[var(--color-brand-dark)]/10 transition-colors cursor-pointer"
                >
                  <LanguageIcon size={20} />
                  <span className="body-small font-semibold uppercase">{language}</span>
                </button>
              )}
            </div>
            <button
              onClick={onClose}
              className="flex-shrink-0 rounded-full p-1.5 hover:bg-gray-100 cursor-pointer"
              aria-label="Close"
            >
              <X size={18} className="text-gray-500" />
            </button>
          </div>

          {/* Section switcher — sections come from exam syllabus store */}
          {sectionItems.length > 0 ? (
            <div className="w-full shrink-0">
              <TabSwitch
                layoutScopeId="instance-sections"
                scrollable
                items={sectionItems}
                value={selectedSection}
                onChange={(id) => setSelectedSection(id)}
                activeTextColor="text-surface-gray-normal px-5 py-2 !min-w-[20px]"
                inactiveTextColor="text-white py-2 !min-w-[20px]"
                tabFontSize="body-medium"
                tabFontWeight="!font-normal"
                activeTabFontWeight="!font-semibold"
                containerBg="bg-[var(--color-brand-dark)]"
                containerRadius="rounded-none"
                className="!min-h-10 !max-h-12 !py-2 !px-3 w-full"
                activeTabBg="bg-white"
              />
            </div>
          ) : (
            <div className="px-4 py-3">
              <span className="body-small text-surface-gray-light">No sections found</span>
            </div>
          )}

          {/* Questions — scrollable region (explicit viewport height so it scrolls
            regardless of how the parent Modal/DrawerSheet sizes itself). */}
          <div className="flex-1 min-h-0 overflow-y-auto py-3 max-h-[70dvh] md:max-h-[68vh]">
            {questionsLoading ? (
              <div className="flex items-center justify-center py-16">
                <span className="body-medium text-surface-gray-light">Loading questions...</span>
              </div>
            ) : questions.length === 0 ? (
              <div className="flex items-center justify-center py-16">
                <span className="body-medium text-surface-gray-light">
                  {selectedSection ? 'No questions in this section' : 'Select a section'}
                </span>
              </div>
            ) : (
              <div className={clsx('flex flex-col gap-2', isFetching && 'opacity-60')}>
                {questions.map((q, index) => (
                  <QuestionItem
                    key={q.id}
                    number={(page - 1) * PER_PAGE + index + 1}
                    total={total}
                    data={q}
                    language={language}
                    defaultOpen={index === 0}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Pagination footer */}
          {questions.length > 0 && lastPage > 1 && (
            <div className="shrink-0 flex items-center justify-between gap-3 px-4 py-3 border-t border-gray-100 bg-white">
              <button
                disabled={page <= 1 || isFetching}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 body-small font-medium text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 cursor-pointer"
              >
                <ChevronLeft size={16} /> Prev
              </button>
              <span className="body-small text-surface-gray-light">
                Page {page} of {lastPage}
              </span>
              <button
                disabled={page >= lastPage || isFetching}
                onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
                className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 body-small font-medium text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 cursor-pointer"
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      </Container>
    </AnimatePresence>
  );
}

/* -------------------------------------------------------------------------- */
/*                               QUESTION ITEM                                */
/*  Same collapsible layout as the exam-report analysis tab, but WITHOUT any  */
/*  correct/wrong status, option coloring, or answer reveal.                  */
/* -------------------------------------------------------------------------- */

const QuestionItem = React.memo(function QuestionItem({
  number,
  total,
  data,
  language,
  defaultOpen,
}: {
  number: number;
  total: number;
  data: InstanceQuestion;
  language: string;
  defaultOpen: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [isExplanation, setIsExplanation] = useState(false);
  const translation = pickTranslation(data.question.translations, language);

  return (
    <div className="flex flex-col w-full justify-between gap-2">
      {/* Question header */}
      <div
        onClick={() => setIsOpen((prev) => !prev)}
        className={clsx(
          'flex justify-between items-center gap-2 px-3 py-2 bg-[#006bd1]/9 cursor-pointer',
          isOpen && 'border-l-4 border-brand',
        )}
      >
        <div className="flex flex-col gap-0.5">
          <Text as="p" variant="heading-medium" weight="semibold" color="gray-normal">
            Questions {number}/{total}
          </Text>
          <div className="flex gap-3 items-center">
            <div className="flex gap-1 items-center">
              <StarBadge size={20} />
              <Text
                as="p"
                variant="body-small"
                weight="semibold"
                color="gray-muted"
                className="!text-[#00A251]"
              >
                Easy
              </Text>
            </div>
          </div>
        </div>

        <div className="bg-[#6c849d]/12 w-9 h-9 flex items-center justify-center rounded-full">
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
          >
            <ChevronIcon size={16} variant="down" color="#192839" />
          </motion.div>
        </div>
      </div>

      {/* Toggle content */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-3 flex flex-col gap-3">
              {/* Question */}
              <div className="px-3">
                <QuestionText question={translation?.text ?? ''} image={translation?.image ?? ''} />
              </div>

              {/* Options — neutral, no correct/wrong coloring */}
              <div className="grid md:grid-cols-2 gap-3">
                {translation?.options.map((opt, i) => {
                  if (!opt.text && !opt.image) return null;
                  return <OptionCard key={i} index={i} value={opt} />;
                })}
              </div>

              {/* Explanation panel */}
              <AnimatePresence mode="wait" initial={false}>
                {isExplanation && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="flex flex-col gap-4 py-3"
                  >
                    <div className="flex justify-between items-center">
                      <Text as="p" variant="heading-medium" weight="semibold" color="gray-normal">
                        Answer & Explanation
                      </Text>
                      <div className="flex gap-1 items-center">
                        <Text as="p" variant="body-small" weight="normal" color="gray-subtle">
                          Correct Answer
                        </Text>
                        <NumberCountIcon
                          value={
                            translation?.correct_option != null
                              ? (String.fromCharCode(65 + Number(translation.correct_option) - 1) as any)
                              : '-'
                          }
                          radius={6}
                          size={24}
                          background="#006bd115"
                          color="#0083ff"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col justify-center items-start gap-4 bg-[#006bd108] p-3 rounded-lg">
                      <Text as="p" variant="heading-small" weight="semibold">
                        Explanation
                      </Text>
                      <MathRender content={translation?.explanation ?? ''}>
                        <Text as="p" variant="body-large" weight="normal" color="gray-normal">
                          <TextMarkDown>{translation?.explanation ?? ''}</TextMarkDown>
                        </Text>
                      </MathRender>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Explanation toggle button */}
              <div className="pb-2">
                <Button
                  onClick={() => setIsExplanation((prev) => !prev)}
                  sx={{ borderRadius: '50px' }}
                  fullWidth
                  variant="outlined"
                  size="md"
                >
                  <div className="flex gap-2 items-center">
                    <p>{isExplanation ? 'Hide' : 'Show'} Correct Answer and Explanation</p>
                    <motion.div
                      animate={{ rotate: isExplanation ? 180 : 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                    >
                      <ChevronIcon size={16} variant="down" color="#0083ff" />
                    </motion.div>
                  </div>
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

/* -------------------------------------------------------------------------- */
/*                                OPTION CARD                                 */
/*               Neutral styling only — no correct/wrong colors.              */
/* -------------------------------------------------------------------------- */

const OptionCard = React.memo(function OptionCard({
  index,
  value,
}: {
  index: number;
  value: QuestionOption;
}) {
  const label = String.fromCharCode(65 + index);

  return (
    <Card padding={0} borderwidth={1} className="transition">
      <div className="min-h-12 flex px-2 items-center gap-2">
        <div className="w-9 h-9 flex items-center justify-center">
          <CounterCard
            value={label}
            width="w-9"
            height="h-9"
            rounded="rounded-full"
            border="border border-2"
            borderColor="border-gray-300"
            bgColor="bg-gray-200"
          />
        </div>

        <div className="flex-1">
          <div className="flex flex-col py-2 gap-2">
            {value.text && (
              <MathRender content={value.text}>
                <Text as="p" variant="body-large" weight="normal" color="gray-normal">
                  <ReactMarkdown>{value.text}</ReactMarkdown>
                </Text>
              </MathRender>
            )}
            {value.image && (
              <div className="w-full flex justify-center">
                <div className="relative h-[160px] w-[160px] aspect-video overflow-hidden rounded-md">
                  <Image src={value.image} alt="" fill />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
});
