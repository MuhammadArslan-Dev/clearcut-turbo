import { Q_BTN_CLASS } from "./use-weekly-test"
import type { Question } from "./weekly-test-types"

interface QuestionsContentProps {
  questions: Question[]
  current: number
  submitted: boolean
  answeredCount: number
  navigate: (index: number) => void
  getQStatus: (index: number) => string
}

export function QuestionsContent({
  questions, current, submitted, answeredCount, navigate, getQStatus,
}: QuestionsContentProps) {
  return (
    <div>
      <div className="grid grid-cols-5 gap-2 mt-4">
        {questions.map((q, index) => (
          <button
            key={q.id}
            onClick={() => navigate(index)}
            className={`h-11 w-11 rounded-xl border-2 text-sm font-bold transition-all duration-200 ${Q_BTN_CLASS[getQStatus(index)]}`}
          >
            {index + 1}
          </button>
        ))}
      </div>
      {/* <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-y-2 gap-x-2 text-xs text-slate-500">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-brand inline-block" />Current</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-blue-50 border border-blue-300 inline-block" />Answered</span>
        {submitted ? (
          <>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-green-100 border border-green-400 inline-block" />Correct</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-100 border border-red-400 inline-block" />Wrong</span>
          </>
        ) : (
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-white border border-slate-300 inline-block" />Unanswered</span>
        )}
      </div> */}
    </div>
  )
}
