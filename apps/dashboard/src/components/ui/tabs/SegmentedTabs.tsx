"use client";

import { useState } from "react";
import clsx from "clsx";

type Tab = {
  id: string;
  title: string;
  subtitle: string;
};

type Props = {
  tabs: Tab[];
  defaultIndex?: number;
  onChange?: (tab: Tab, index: number) => void;
};

export default function SegmentedTabs({
  tabs,
  defaultIndex = 0,
  onChange,
}: Props) {
  const [activeIndex, setActiveIndex] = useState(defaultIndex);

  const handleChange = (index: number) => {
    setActiveIndex(index);
    onChange?.(tabs[index], index);
  };

  return (
    <div className="w-full max-w-xl">
      <div
        className="relative flex overflow-hidden rounded-lg bg-blue-50 p-[3px]"
        role="tablist"
      >
        {/* Sliding pill */}
        <div
          className="absolute inset-y-[3px] rounded-md bg-blue-700 transition-transform duration-300 ease-[cubic-bezier(.4,0,.2,1)]"
          style={{
            width: `${100 / tabs.length}%`,
            transform: `translateX(${activeIndex * 100}%)`,
          }}
        />

        {tabs.map((tab, index) => {
          const active = index === activeIndex;

          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={active}
              onClick={() => handleChange(index)}
              className={clsx(
                "relative z-10 flex flex-1 flex-col items-center justify-center px-4 py-2 text-center transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                active
                  ? "text-white"
                  : "text-blue-700 hover:text-blue-900"
              )}
            >
              <span className="text-sm font-semibold leading-tight">
                {tab.title}
              </span>
              <span
                className={clsx(
                  "text-[11px] leading-tight",
                  active ? "text-blue-100" : "text-blue-500"
                )}
              >
                {tab.subtitle}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
