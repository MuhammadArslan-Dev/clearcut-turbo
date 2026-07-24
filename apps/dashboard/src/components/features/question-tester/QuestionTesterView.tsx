"use client";

import { useEffect, useMemo, useState } from "react";

import ReactMarkdown from "react-markdown";

import Text from "@clearcut/ui/text";
import MathRender from "@/components/features/mathjax/Math";
import QuestionText from "@/components/ui/cards/QuestionMaterial/Question/QuestionText";
import OptionCard from "@/components/features/exam-report/OptionCard";
import { NumberCountIcon } from "@/components/ui/icons";

import { useQuestionTester } from "./hooks/useQuestionTester";

export default function QuestionTesterView() {
  // Raw text in the input box
  const [inputId, setInputId] = useState("");
  // The id actually submitted to the API (drives the query)
  const [submittedId, setSubmittedId] = useState("");
  // Which locale is currently shown
  const [activeLocale, setActiveLocale] = useState<string | null>(null);
  // Raw JSON toggle
  const [showRaw, setShowRaw] = useState(false);

  const { question, loading, isError, errorMessage } =
    useQuestionTester(submittedId);

  // When a new question loads, default to its first available locale.
  useEffect(() => {
    if (question?.translations?.length) {
      setActiveLocale((prev) => {
        const stillValid = question.translations.some(
          (t) => t.locale === prev,
        );
        return stillValid ? prev : question.translations[0].locale;
      });
    }
  }, [question]);

  const activeTranslation = useMemo(() => {
    if (!question?.translations?.length) return null;
    return (
      question.translations.find((t) => t.locale === activeLocale) ??
      question.translations[0]
    );
  }, [question, activeLocale]);

  const submit = (id: string) => {
    const trimmed = id.trim();
    if (!trimmed) return;
    setInputId(trimmed);
    setSubmittedId(trimmed);
    setShowRaw(false);
  };

  const goToNeighbor = (id: number | null) => {
    if (id == null) return;
    submit(String(id));
  };

  const hasMultipleLocales = (question?.translations?.length ?? 0) > 1;
  const correctOption = activeTranslation?.answer.correct_option ?? null;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8">
      {/* ============================= HEADER ============================= */}
      <div className="flex flex-col gap-1">
        <Text as="h1" variant="heading-large" weight="semibold" color="gray-normal">
          Question Tester
        </Text>
        <Text as="p" variant="body-small" color="gray-muted">
          Enter a question <code>id</code> or <code>question_id</code> to preview
          how it renders in the real exam.
        </Text>
      </div>

      {/* ============================= INPUT ROW ============================= */}
      <form
        className="flex flex-wrap items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          submit(inputId);
        }}
      >
        <input
          value={inputId}
          onChange={(e) => setInputId(e.target.value)}
          placeholder="e.g. 1234 or CTET-2023-Q17"
          className="flex-1 rounded-md border border-[var(--border-gray-muted)] px-3 py-2 text-sm outline-none focus:border-brand"
        />
        <button
          type="submit"
          disabled={!inputId.trim() || loading}
          className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {loading ? "Fetching…" : "Fetch"}
        </button>
      </form>

      {/* ============================= STATES ============================= */}
      {loading && (
        <div className="animate-pulse rounded-md border border-[var(--border-gray-muted)] p-6">
          <div className="mb-3 h-4 w-3/4 rounded bg-[var(--background-gray-subtle)]" />
          <div className="h-4 w-1/2 rounded bg-[var(--background-gray-subtle)]" />
        </div>
      )}

      {!loading && isError && (
        <div className="rounded-md border border-[var(--icon-negative-normal)] bg-red-50 p-4">
          <Text as="p" variant="body-medium" weight="medium" color="gray-normal">
            {errorMessage}
          </Text>
        </div>
      )}

      {/* Question exists but has no translations */}
      {!loading &&
        !isError &&
        question &&
        !question.has_translations && (
          <div className="rounded-md border border-[var(--icon-notice-subtle)] bg-yellow-50 p-4">
            <Text as="p" variant="body-medium" color="gray-normal">
              Question <b>#{question.id}</b> exists but has no content
              (translations) yet.
            </Text>
          </div>
        )}

      {/* ============================= QUESTION ============================= */}
      {!loading && !isError && question && activeTranslation && (
        <div className="flex flex-col gap-5">
          {/* META BAR + NEIGHBOR NAV */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-md bg-[var(--background-gray-subtle)] px-3 py-2">
            <Text as="span" variant="body-small" color="gray-muted">
              id: <b>{question.id}</b>
              {question.question_id && <> · question_id: <b>{question.question_id}</b></>}
              {question.question_number && <> · Q#{question.question_number}</>}
            </Text>

            <div className="flex items-center gap-2">
              <button
                onClick={() => goToNeighbor(question.neighbors.prev_id)}
                disabled={question.neighbors.prev_id == null}
                className="rounded border border-[var(--border-gray-muted)] px-3 py-1 text-sm disabled:opacity-40"
              >
                ← Prev
              </button>
              <button
                onClick={() => goToNeighbor(question.neighbors.next_id)}
                disabled={question.neighbors.next_id == null}
                className="rounded border border-[var(--border-gray-muted)] px-3 py-1 text-sm disabled:opacity-40"
              >
                Next →
              </button>
            </div>
          </div>

          {/* LANGUAGE TOGGLE — only when >= 2 translations */}
          {hasMultipleLocales && (
            <div className="flex items-center gap-2">
              <Text as="span" variant="body-small" color="gray-muted">
                Language:
              </Text>
              {question.translations.map((t) => {
                const active = t.locale === activeTranslation.locale;
                return (
                  <button
                    key={t.locale}
                    onClick={() => setActiveLocale(t.locale)}
                    className={`rounded-full border px-3 py-1 text-sm uppercase ${
                      active
                        ? "border-brand bg-brand text-white"
                        : "border-[var(--border-gray-muted)]"
                    }`}
                  >
                    {t.locale}
                  </button>
                );
              })}
            </div>
          )}

          {/* Question — same as ExamReportSheet */}
          <div className="px-3">
            <QuestionText
              question={activeTranslation.content.question!}
              image={activeTranslation.content.question_image!}
            />
          </div>

          {/* Options — same as ExamReportSheet */}
          <div className="grid md:grid-cols-2 gap-3">
            {activeTranslation.options.map((opt, i: number) => (
              <OptionCard
                key={i}
                index={i}
                value={opt}
                correctOption={
                  correctOption != null ? Number(correctOption) - 1 : -1
                }
                userOption={null}
                isQuestionAnswered={true}
              />
            ))}
          </div>

          {/* Explanation — same as ExamReportSheet */}
          <div className="flex flex-col gap-4 py-3">
            <div className="flex justify-between items-center ">
              <Text
                as="p"
                variant="heading-medium"
                weight="semibold"
                color="gray-normal"
              >
                Answer & Explanation
              </Text>

              <div className="flex gap-1 items-center">
                <Text
                  as="p"
                  variant="body-small"
                  weight="normal"
                  color="gray-subtle"
                >
                  Correct Answer
                </Text>
                <NumberCountIcon
                  value={
                    correctOption != null
                      ? (String.fromCharCode(65 + Number(correctOption) - 1) as any)
                      : "-"
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
              <MathRender content={activeTranslation.answer.explanation ?? ""}>
                <Text
                  as="p"
                  variant="body-large"
                  weight="normal"
                  color="gray-normal"
                >
                  <ReactMarkdown>
                    {activeTranslation.answer.explanation}
                  </ReactMarkdown>
                </Text>
              </MathRender>
            </div>
          </div>

          {/* RAW JSON TOGGLE */}
          <div>
            <button
              onClick={() => setShowRaw((s) => !s)}
              className="text-sm text-brand underline"
            >
              {showRaw ? "Hide raw JSON" : "View raw JSON"}
            </button>
            {showRaw && (
              <pre className="mt-2 max-h-96 overflow-auto rounded-md bg-[var(--background-gray-subtle)] p-3 text-xs">
                {JSON.stringify(question, null, 2)}
              </pre>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
