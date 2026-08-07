'use client'
import React from "react"
import { AnimatePresence, motion } from "framer-motion"
import Image from "next/image"
import {
  ChevronLeft, ChevronRight, Check,
  Trophy
} from "lucide-react"
import { ScoreCard } from "./score-card"
import type { Question, OptionItem, Translation } from "./weekly-test-types"
import QOption from "@/components/ui/cards/QuestionMaterial/Qoption/QOption"
import MainButton from "@/components/ui/button/main-button"

interface QuestionPanelProps {
  current: number
  direction: number
  questions: Question[]
  activeQ: Question
  activeT: Translation | undefined
  submitted: boolean
  showResult: boolean
  showExplanation: boolean
  options: OptionItem[]
  score: number
  answeredCount: number
  navigate: (index: number) => void
  handleSelect: (optIdx: number) => void
  handleSubmit: () => void
  handleRetry: () => void
  setShowExplanation: React.Dispatch<React.SetStateAction<boolean>>
  optionState: (idx: number) => { isSelected: boolean; isCorrect: boolean; isWrong: boolean }
  optionCardClass: (idx: number) => string
  optionBadgeClass: (idx: number) => string
}

export function QuestionPanel({
  current, direction, questions, activeQ, activeT,
  submitted, showResult, showExplanation, options,
  score, answeredCount, navigate, handleSelect,
  handleSubmit, handleRetry, setShowExplanation,
  optionState, optionCardClass, optionBadgeClass,
}: QuestionPanelProps) {
  return (
    <div className="flex flex-col lg:rounded-xl bg-white border border-slate-200 shadow-sm overflow-hidden">

      {/* Gradient header */}
      <div className="px-5 py-4 bg-brand-dark flex items-center justify-between gap-4">
        <div>
          <p className="text-blue-200 text-[10px] font-bold uppercase tracking-widest">Question</p>
          <p className="text-white text-2xl font-black leading-none mt-0.5">
            {current + 1}
            <span className="text-blue-200 text-base font-medium"> / {questions.length}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white/80">
            {activeQ.examSource.replace(/_/g, " ")}
          </span>
          {submitted ? (
            <div className="flex items-center gap-1.5 bg-white/15 rounded-full px-4 py-1.5">
              <Trophy size={14} className="text-yellow-300" />
              <span className="text-white font-bold text-sm">{score}/{questions.length}</span>
            </div>
          ) : (
            <div className="text-right">
              <p className="text-blue-200 text-[10px] font-semibold">Answered</p>
              <p className="text-white font-bold text-sm">{answeredCount}/{questions.length}</p>
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        {showResult ? (
          <ScoreCard score={score} total={questions.length} onRetry={handleRetry} />
        ) : (
          <div className="p-5 md:p-7 min-h-[400px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={current}
                initial={{ opacity: 0, x: direction > 0 ? 60 : -60 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: direction > 0 ? -60 : 60 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
              >
                {/* Question text */}
                <div className="mb-6">
                  <span className="inline-flex items-center rounded-full bg-blue-50 border border-blue-200 px-3 py-1 text-xs font-bold text-brand mb-3">
                    Q{current + 1}
                  </span>
                  {activeT?.question_image && (
                    <div className="mb-3 rounded-xl overflow-hidden border border-slate-200">
                      <Image src={activeT.question_image} alt="Question" width={600} height={300} className="w-full object-contain" />
                    </div>
                  )}
                  <p className="text-lg md:text-xl font-semibold text-slate-900 leading-relaxed">
                    {activeT?.question}
                  </p>
                </div>

                {/* Options */}
                {/* Options */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {options.map((opt, idx) => {
                    const { isSelected, isCorrect, isWrong } = optionState(idx)

                    return (
                      <div key={idx} className="relative">
                        <QOption
                          value={{
                            index: idx,
                            text: opt.text,
                            image: opt.image ?? "",
                          }}
                          onClick={() => !submitted && handleSelect(idx)}
                          mainContainer={{
                            borderwidth: 2,
                            className: submitted ? "pointer-events-none" : "",
                            bgcolor: isCorrect
                              ? "!bg-green-50"
                              : isWrong
                                ? "!bg-red-50"
                                : isSelected
                                  ? "!bg-brand/10"
                                  : "",

                            bordercolor: isCorrect
                              ? "!border-green-500"
                              : isWrong
                                ? "!border-red-500"
                                : isSelected
                                  ? "!border-brand"
                                  : "!border-[var(--border-gray-muted)]",
                          }}
                          counter={{
                            borderColor: isCorrect
                              ? "!border-green-500"
                              : isWrong
                                ? "!border-red-500"
                                : isSelected
                                  ? "!border-brand"
                                  : "",

                            backgroundColor: isCorrect
                              ? "!bg-green-100"
                              : isWrong
                                ? "!bg-red-100"
                                : isSelected
                                  ? "!bg-brand/10"
                                  : "bg-gray-200",

                            color: isCorrect
                              ? "!text-green-600"
                              : isWrong
                                ? "!text-red-600"
                                : isSelected
                                  ? "!text-brand"
                                  : "",

                            showCounting: false,
                          }}
                        />

                        {/* correct badge */}
                        {isCorrect && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="absolute top-2 right-2 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center shadow"
                          >
                            <Check
                              size={11}
                              className="text-white"
                              strokeWidth={3}
                            />
                          </motion.div>
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* Explanation */}
                {/* {submitted && activeT?.explanation && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-5">
                    <button
                      onClick={() => setShowExplanation((v) => !v)}
                      className="w-full flex items-center justify-between rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-800 hover:bg-blue-100 transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <BookOpen size={15} className="text-brand" />
                        View Explanation
                      </span>
                      {showExplanation ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                    </button>
                    <AnimatePresence>
                      {showExplanation && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="rounded-b-xl border border-t-0 border-blue-200 bg-white px-4 py-4">
                            <div className="mb-2.5 flex items-center flex-wrap gap-2">
                              <div className="h-5 w-1 rounded-full bg-blue-500" />
                              <span className="text-xs font-bold text-brand uppercase tracking-wider">Correct Answer</span>
                              <span className="rounded-full bg-green-100 border border-green-300 px-2.5 py-0.5 text-xs font-bold text-green-700">
                                {String.fromCharCode(65 + activeQ.correctOption)}: {options[activeQ.correctOption]?.text}
                              </span>
                            </div>
                            <ExplanationBlock text={activeT.explanation} />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )} */}
              </motion.div>
            </AnimatePresence>
          </div>
        )}
      </div>
     

      {/* Footer nav */}
      {!showResult && (
        <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-4 flex items-center justify-between gap-3">

          <MainButton
            onClick={() => navigate(current - 1)}
            disabled={current === 0}
            text={
              'Previous'
            }
            variant="outlined"
            color='neutral'
            size="md"
            showIcon={false}
            leftIcon={<ChevronLeft size={20} />}
          />

          <div className="flex items-center gap-1.5">
            {questions.slice(0, 5).map((_, i) => (
              <button
                key={i}
                onClick={() => navigate(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${i === current ? "w-6 bg-brand" : "w-1.5 bg-slate-300 hover:bg-blue-300"}`}
              />

            ))}
          </div>

          {current === questions.length - 1 ? (
            <MainButton
              onClick={() => {
                handleSubmit();
              }}
              text={
                'Submit Test'
              }
              size="md"
              rightIcon={<Trophy size={16} />}
            />
          ) : (
            <MainButton
              onClick={() => navigate(current + 1)}

              text={
                'Next'
              }
              size="md"
              rightIcon={<ChevronRight size={20} />}
            />

          )}
        </div>
      )}
    </div>
  )
}
