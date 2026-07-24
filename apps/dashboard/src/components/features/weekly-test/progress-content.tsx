'use client'
import { motion } from "framer-motion"

interface ProgressContentProps {
  answeredCount: number
  total: number
  submitted: boolean
  score: number
}

export function ProgressContent({ answeredCount, total, submitted, score }: ProgressContentProps) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-2 mt-4">
        <span className="text-slate-500">Answered</span>
        <span className="font-bold text-slate-800">{answeredCount}/{total}</span>
      </div>
      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
        <motion.div
          className="h-full bg-brand rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${(answeredCount / total) * 100}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
      {submitted && (
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-green-50 border border-green-200 p-1 text-center">
            <p className="text-3xl font-black text-green-600">{score}</p>
            <p className="text-xs text-green-700 font-semibold">Correct</p>
          </div>
          <div className="rounded-xl bg-red-50 border border-red-200 p-1 text-center">
            <p className="text-3xl font-black text-red-500">{answeredCount - score}</p>
            <p className="text-xs text-red-600 font-semibold">Wrong</p>
          </div>
        </div>
      )}
    </div>
  )
}
