"use client";

import React from "react";
import { Card } from "@clearcut/ui/card";

// Mirrors MainContent's layout (question card with a header row, question,
// options and a pinned action row) so nothing jumps when the exam arrives.
export default function ExamSkeleton() {
  return (
    <div className="h-full animate-pulse lg:p-3 lg:pl-3">
      <Card bgcolor="white" border="border-none" padding={0} borderRadius={12} className="flex h-full flex-col">
        <div className="flex flex-1 flex-col gap-4 overflow-hidden p-4 lg:p-5">
          {/* Chip + mark for review + clock */}
          <div className="flex items-center justify-between">
            <div className="h-8 w-48 rounded-lg bg-gray-200" />
            <div className="h-5 w-40 rounded-md bg-gray-200" />
          </div>

          {/* Question title + text */}
          <div className="h-7 w-40 rounded-md bg-gray-200" />
          <div className="flex flex-col gap-3">
            <div className="h-5 w-full rounded-md bg-gray-200" />
            <div className="h-5 w-5/6 rounded-md bg-gray-200" />
          </div>

          {/* Options */}
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 rounded-xl bg-gray-200" />
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="border-t border-gray-100 px-3 py-3 lg:px-5 lg:py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="h-11 w-32 rounded-full bg-gray-200" />
            <div className="h-11 w-full max-w-[460px] rounded-full bg-gray-200" />
            <div className="h-11 w-40 rounded-full bg-gray-200" />
          </div>
        </div>
      </Card>
    </div>
  );
}
