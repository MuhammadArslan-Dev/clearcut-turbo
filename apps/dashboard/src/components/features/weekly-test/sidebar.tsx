import { Target, Layers, BookOpen } from "lucide-react"
import { ProgressContent } from "./progress-content"
import { QuestionsContent } from "./questions-content"
import { TopicsContent } from "./topics-content"
import type { Question } from "./weekly-test-types"

interface SidebarProps {
  answeredCount: number
  totalQuestions: number
  submitted: boolean
  score: number
  questions: Question[]
  current: number
  navigate: (index: number) => void
  getQStatus: (index: number) => string
  topics: string[]
}

export function Sidebar({
  answeredCount, totalQuestions, submitted, score,
  questions, current, navigate, getQStatus, topics,
}: SidebarProps) {
  return (
    <div className="hidden lg:flex flex-col gap-4">
      <div className="rounded-xl bg-white border border-slate-200 shadow-sm p-4">
        <div className="flex items-center gap-2 mb-3">
          <Target size={15} className="text-brand" />
          <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">Progress</span>
        </div>
        <ProgressContent answeredCount={answeredCount} total={totalQuestions} submitted={submitted} score={score} />
      </div>

      <div className="rounded-xl bg-white border border-slate-200 shadow-sm p-4">
        <div className="flex items-center gap-2 mb-1">
          <Layers size={15} className="text-brand" />
          <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">Questions</span>
        </div>
        <QuestionsContent
          questions={questions} current={current} submitted={submitted}
          answeredCount={answeredCount} navigate={navigate} getQStatus={getQStatus}
        />
      </div>

      <div className="rounded-xl bg-white border border-slate-200 shadow-sm p-4">
        <div className="flex items-center gap-2 mb-1">
          <BookOpen size={15} className="text-brand" />
          <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">Topics Covered</span>
        </div>
        <TopicsContent topics={topics} />
      </div>
    </div>
  )
}
