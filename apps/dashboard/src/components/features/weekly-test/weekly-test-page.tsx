'use client'
import { X, BookOpen, Languages, AlertCircle } from "lucide-react"
import { usePracticeTestQuery } from "./use-practice-test-query"
import { useWeeklyTest } from "./use-weekly-test"
import { Sidebar } from "./sidebar"
import { QuestionPanel } from "./question-panel"
import { MobileTabBar } from "./mobile-tab-bar"
import { BottomSheet } from "./bottom-sheet"
import { ProgressContent } from "./progress-content"
import { QuestionsContent } from "./questions-content"
import { TopicsContent } from "./topics-content"
import type { ApiPracticeTest, Locale } from "./weekly-test-types"
import { useEffect } from "react"
import { useRouter, usePathname } from "@/i18n/navigation"
import type { AppLocale } from "@/types/components/language"

const SHEET_TITLE = {
    progress: "Progress",
    questions: "Question Navigator",
    topics: "Topics Covered",
} as const

// ─── Outer shell: data fetching + loading / error states ────────────────────

interface WeeklyTestPageProps {
    uuid: string,
    locale: string
}

export default function WeeklyTestPage({ uuid, locale }: WeeklyTestPageProps) {
    const { data, isLoading, isError } = usePracticeTestQuery(uuid)

    if (isLoading) return <WeeklyTestSkeleton />

    if (isError || !data) return <WeeklyTestError />

    return <WeeklyTestContent data={data} locale={locale} />
}

// ─── Inner content: quiz state ───────────────────────────────────────────────

function WeeklyTestContent({ data, locale }: { data: ApiPracticeTest, locale: string }) {
    const router = useRouter()
    const pathname = usePathname()
    const test = useWeeklyTest(data, (locale as Locale) ?? "en")

    // Sync locale state when the URL locale changes (e.g. browser back/forward)
    useEffect(() => {
        test.setLocale((locale as Locale) ?? "en")
    }, [locale])

    const toggleLocale = () => {
        const next: AppLocale = locale === "en" ? "hi" : "en"
        router.replace(pathname, { locale: next })
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-50 md:p-6 pb-24 lg:pb-6">
            <div className="mx-auto max-w-7xl">

                {/* Header */}
                <div className="mb-5 flex items-center justify-between flex-wrap gap-3 px-4 pt-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-brand-dark flex items-center justify-center shadow">
                            <BookOpen size={20} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-slate-900 leading-tight">
                                {test.title}
                            </h1>
                            <p className="text-xs text-slate-500">{test.sectionName}</p>
                        </div>
                    </div>
                    <button
                        onClick={toggleLocale}
                        className="flex items-center gap-2 rounded-full border border-slate-200 bg-white shadow-sm px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                        <Languages size={15} className="text-brand" />
                        {test.locale === "en" ? "हिंदी में देखें" : "View in English"}
                    </button>
                </div>

                {/* Main grid */}
                <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-5">
                    <Sidebar
                        answeredCount={test.answeredCount}
                        totalQuestions={test.questions.length}
                        submitted={test.submitted}
                        score={test.score}
                        questions={test.questions}
                        current={test.current}
                        navigate={test.navigate}
                        getQStatus={test.getQStatus}
                        topics={test.topics}
                    />

                    <QuestionPanel
                        current={test.current}
                        direction={test.direction}
                        questions={test.questions}
                        activeQ={test.activeQ}
                        activeT={test.activeT}
                        submitted={test.submitted}
                        showResult={test.showResult}
                        showExplanation={test.showExplanation}
                        options={test.options}
                        score={test.score}
                        answeredCount={test.answeredCount}
                        navigate={test.navigate}
                        handleSelect={test.handleSelect}
                        handleSubmit={test.handleSubmit}
                        handleRetry={test.handleRetry}
                        setShowExplanation={test.setShowExplanation}
                        optionState={test.optionState}
                        optionCardClass={test.optionCardClass}
                        optionBadgeClass={test.optionBadgeClass}
                    />
                </div>
            </div>

            {/* Mobile tab bar */}
            <MobileTabBar
                sheet={test.sheet}
                setSheet={test.setSheet}
                answeredCount={test.answeredCount}
            />

            {/* Mobile bottom sheet */}
            <BottomSheet open={test.sheet !== null} onClose={() => test.setSheet(null)}>
                {test.sheet && (
                    <>
                        <div className="flex items-center justify-between pt-2 pb-4 border-b border-slate-100">
                            <h3 className="text-base font-bold text-slate-900">{SHEET_TITLE[test.sheet]}</h3>
                            <button
                                onClick={() => test.setSheet(null)}
                                className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
                            >
                                <X size={14} className="text-slate-600" />
                            </button>
                        </div>
                        {test.sheet === "progress" && (
                            <ProgressContent
                                answeredCount={test.answeredCount}
                                total={test.questions.length}
                                submitted={test.submitted}
                                score={test.score}
                            />
                        )}
                        {test.sheet === "questions" && (
                            <QuestionsContent
                                questions={test.questions}
                                current={test.current}
                                submitted={test.submitted}
                                answeredCount={test.answeredCount}
                                navigate={test.navigate}
                                getQStatus={test.getQStatus}
                            />
                        )}
                        {test.sheet === "topics" && <TopicsContent topics={test.topics} />}
                    </>
                )}
            </BottomSheet>
        </div>
    )
}

// ─── Loading skeleton ────────────────────────────────────────────────────────

function WeeklyTestSkeleton() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-50 md:p-6 pb-24 lg:pb-6 animate-pulse">
            <div className="mx-auto max-w-7xl">
                <div className="mb-5 px-4 pt-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-200" />
                    <div className="space-y-2">
                        <div className="h-4 w-48 rounded bg-slate-200" />
                        <div className="h-3 w-32 rounded bg-slate-200" />
                    </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-5">
                    <div className="hidden lg:block h-64 rounded-xl bg-slate-200" />
                    <div className="rounded-xl bg-slate-200 h-[500px]" />
                </div>
            </div>
        </div>
    )
}

// ─── Error state ─────────────────────────────────────────────────────────────

function WeeklyTestError() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-50 flex items-center justify-center p-6">
            <div className="text-center space-y-3">
                <AlertCircle size={40} className="text-red-400 mx-auto" />
                <p className="text-slate-700 font-semibold">Failed to load the test.</p>
                <p className="text-slate-500 text-sm">Please check your connection and try again.</p>
            </div>
        </div>
    )
}
