'use client'
import { useMemo, useState, useCallback } from 'react'
import type { ApiPracticeTest, Locale, SelectedAnswers, SheetTab, Question } from './weekly-test-types'

export const Q_BTN_CLASS: Record<string, string> = {
  active: 'bg-brand text-white border-brand shadow-md scale-105',
  correct: 'bg-green-100 text-green-700 border-green-400',
  wrong: 'bg-red-100 text-red-600 border-red-400',
  answered: 'bg-blue-50 text-brand border-blue-300',
  unanswered: 'bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:bg-blue-50',
}

// Correct answers keyed by question.id (0-indexed option index).
// In production these come from the test submission result endpoint.
const CORRECT_ANSWERS: Record<number, number> = {
  2846: 3,
  2830: 0,
  11010: 1,
  2719: 3,
  2756: 1,
  11107: 2,
  2795: 2,
  2875: 3,
  2844: 3,
  2808: 0,
}

// Extracts a readable label from the question_id string, e.g. "CTET 2021"
function parseExamSource(questionId: string): string {
  const parts = questionId.split('_')
  return parts.length >= 2 ? `${parts[0]} ${parts[1]}` : questionId
}

export function useWeeklyTest(data: ApiPracticeTest, initialLocale: Locale = 'en') {
  const [current, setCurrent] = useState(0)
  const [direction, setDirection] = useState(1)
  const [locale, setLocale] = useState<Locale>(initialLocale)
  const [selected, setSelected] = useState<SelectedAnswers>({})
  const [submitted, setSubmitted] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const [showExplanation, setShowExplanation] = useState(false)
  const [sheet, setSheet] = useState<SheetTab>(null)

  const questions = useMemo<Question[]>(
    () =>
      data.questions.map((item) => {
        const q = item.question
        const en = q.translations.find((t) => t.locale === 'en')
        const hi = q.translations.find((t) => t.locale === 'hi')
        return {
          id: q.id,
          examSource: parseExamSource(q.question_id),
          topicId: q.topic_id,
          marks: item.marks,
          en,
          hi,
          correctOption: CORRECT_ANSWERS[q.id] ?? 0,
        }
      }),
    [data.questions],
  )

  const topics = useMemo(
    () => data.meta_json.topics.map((t) => t.name),
    [data.meta_json.topics],
  )

  const activeQ = questions[current]
  const activeT = (locale === 'en' ? activeQ.en : activeQ.hi) ?? activeQ.en ?? activeQ.hi

  const answeredCount = Object.keys(selected).length

  const score = useMemo(
    () => questions.reduce((acc, q, i) => acc + (selected[i] === q.correctOption ? 1 : 0), 0),
    [questions, selected],
  )

  const navigate = useCallback(
    (index: number) => {
      setDirection(index > current ? 1 : -1)
      setCurrent(index)
      setShowExplanation(false)
      setSheet(null)
    },
    [current],
  )

  const handleSelect = (optIdx: number) => {
    if (submitted) return
    setSelected((prev) => ({ ...prev, [current]: optIdx }))
  }

  const handleSubmit = () => {
    setSubmitted(true)
    setShowResult(true)
  }

  const handleRetry = () => {
    setSelected({})
    setSubmitted(false)
    setShowResult(false)
    setShowExplanation(false)
    setCurrent(0)
  }

  const getQStatus = (index: number) => {
    if (index === current) return 'active'
    if (submitted && selected[index] === questions[index].correctOption) return 'correct'
    if (submitted && selected[index] !== undefined) return 'wrong'
    if (selected[index] !== undefined) return 'answered'
    return 'unanswered'
  }

  const optionState = (idx: number) => ({
    isSelected: selected[current] === idx,
    isCorrect: submitted && idx === activeQ.correctOption,
    isWrong: submitted && selected[current] === idx && idx !== activeQ.correctOption,
  })

  const optionCardClass = (idx: number) => {
    const { isCorrect, isWrong, isSelected } = optionState(idx)
    if (isCorrect) return 'border-green-500 bg-green-50 text-green-900'
    if (isWrong) return 'border-red-500 bg-red-50 text-red-900'
    if (isSelected) return 'border-blue-500 bg-blue-50 text-blue-900'
    return 'border-slate-200 bg-white text-slate-800 hover:border-blue-300 hover:bg-blue-50/50'
  }

  const optionBadgeClass = (idx: number) => {
    const { isCorrect, isWrong, isSelected } = optionState(idx)
    if (isCorrect) return 'bg-green-500 text-white border-green-500'
    if (isWrong) return 'bg-red-500 text-white border-red-500'
    if (isSelected) return 'bg-blue-500 text-white border-blue-500'
    return 'bg-slate-100 text-slate-500 border-slate-200'
  }

  const options = activeT
    ? [
        { text: activeT.option_1_text, image: activeT.option_1_image },
        { text: activeT.option_2_text, image: activeT.option_2_image },
        { text: activeT.option_3_text, image: activeT.option_3_image },
        { text: activeT.option_4_text, image: activeT.option_4_image },
      ]
    : []

  return {
    current,
    direction,
    locale,
    submitted,
    showResult,
    showExplanation,
    sheet,
    setLocale,
    setSheet,
    setShowExplanation,
    questions,
    topics,
    activeQ,
    activeT,
    answeredCount,
    score,
    options,
    navigate,
    handleSelect,
    handleSubmit,
    handleRetry,
    getQStatus,
    optionState,
    optionCardClass,
    optionBadgeClass,
    title: data.title,
    sectionName: data.meta_json.section_name,
    courseId: data.meta_json.course_id,
    duration: data.meta_json.duration,
  }
}
