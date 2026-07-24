'use client'
import { motion } from "framer-motion"
import { Trophy, RotateCcw } from "lucide-react"

interface ScoreCardProps {
  score: number
  total: number
  onRetry: () => void
}

export function ScoreCard({ score, total, onRetry }: ScoreCardProps) {
  const pct = Math.round((score / total) * 100)
  const isGood = pct >= 60

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center gap-6 py-12 px-6 text-center"
    >
      <div className={`w-24 h-24 rounded-full flex items-center justify-center shadow-lg ${isGood ? "bg-green-100" : "bg-red-100"}`}>
        <Trophy size={44} className={isGood ? "text-green-600" : "text-red-500"} />
      </div>

      <div>
        <p className="text-slate-500 text-xs font-semibold uppercase tracking-widest mb-1">Your Score</p>
        <p className="text-6xl font-black text-slate-900">
          {score}<span className="text-3xl text-slate-400">/{total}</span>
        </p>
        <p className={`mt-2 text-lg font-semibold ${isGood ? "text-green-600" : "text-red-500"}`}>
          {pct}% &mdash; {isGood ? "Great Job!" : "Keep Practicing"}
        </p>
      </div>

      <div className="relative w-28 h-28">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="42" fill="none" stroke="#e2e8f0" strokeWidth="8" />
          <circle
            cx="50" cy="50" r="42" fill="none"
            stroke={isGood ? "#22c55e" : "#ef4444"}
            strokeWidth="8" strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 42}`}
            strokeDashoffset={`${2 * Math.PI * 42 * (1 - pct / 100)}`}
            className="transition-all duration-1000"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-black text-slate-800">{pct}%</span>
        </div>
      </div>

      <button
        onClick={onRetry}
        className="flex items-center gap-2 rounded-full bg-brand text-white px-8 py-3 font-semibold hover:bg-brand transition-colors shadow-md"
      >
        <RotateCcw size={16} />
        Retry Test
      </button>
    </motion.div>
  )
}
