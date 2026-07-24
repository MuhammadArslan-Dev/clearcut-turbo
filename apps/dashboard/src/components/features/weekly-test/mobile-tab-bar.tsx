'use client'
import { Target, Layers, BookOpen } from "lucide-react"
import type { SheetTab } from "./weekly-test-types"

interface MobileTabBarProps {
  sheet: SheetTab
  setSheet: (s: SheetTab) => void
  answeredCount: number
}

const TABS = [
  { key: "progress" as const, icon: Target, label: "Progress" },
  { key: "questions" as const, icon: Layers, label: "Questions" },
  { key: "topics" as const, icon: BookOpen, label: "Topics" },
]

export function MobileTabBar({ sheet, setSheet, answeredCount }: MobileTabBarProps) {
  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-slate-200 shadow-lg">
      <div className="flex">
        {TABS.map(({ key, icon: Icon, label }) => {
          const isActive = sheet === key
          return (
            <button
              key={key}
              onClick={() => setSheet(isActive ? null : key)}
              className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-semibold transition-colors ${
                isActive ? "text-brand bg-blue-50" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <Icon size={20} className={isActive ? "text-brand" : "text-slate-400"} />
              {label}
              {key === "questions" && answeredCount > 0 && !isActive && (
                <span className="absolute top-2 ml-8 w-4 h-4 rounded-full bg-brand text-white text-[9px] font-bold flex items-center justify-center">
                  {answeredCount}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
