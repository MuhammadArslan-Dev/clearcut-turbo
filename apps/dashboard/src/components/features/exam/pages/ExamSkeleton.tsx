"use client";

import React from "react";
import MainContainer from "@/components/ui/main-container";

export default function ExamSkeleton() {
  return (
    <div className="max-h-screen mt-2 lg:mt-0 animate-pulse">
      <MainContainer maxWidth="max-w-[800px]" padding="p-0 lg:p-4">
        <div className="flex flex-col gap-3">
          {/* ===============================
              QUESTION CONTAINER
          =============================== */}

          <div
            className="
              bg-white
              lg:h-[calc(100vh-240px)]
              h-[calc(100vh-205px)]
              flex flex-col
              gap-6
              py-5
              px-4
              overflow-hidden
            "
          >
            {/* Progress skeleton */}
            <div className="flex justify-between items-center">
              <div className="h-6 w-40 bg-gray-200 rounded-md" />
              <div className="h-5 w-16 bg-gray-200 rounded-md" />
            </div>

            {/* Question skeleton */}
            <div className="flex flex-col gap-3 mt-4">
              <div className="h-5 w-full bg-gray-200 rounded-md" />
              <div className="h-5 w-5/6 bg-gray-200 rounded-md" />
              <div className="h-5 w-4/6 bg-gray-200 rounded-md" />
            </div>

            {/* Options skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-20 bg-gray-200 rounded-xl"
                />
              ))}
            </div>
          </div>

          {/* ===============================
              ACTIONS SKELETON
          =============================== */}

          <div className="fixed md:sticky bottom-0 w-full bg-white">
            <div className="max-w-[600px] mx-auto flex flex-col gap-3 py-4 px-3">
              <div className="flex justify-between gap-4">
                <div className="h-10 w-28 bg-gray-200 rounded-full" />
                <div className="h-10 flex-1 bg-gray-200 rounded-full" />
                <div className="h-10 w-28 bg-gray-200 rounded-full" />
              </div>

              <div className="flex justify-center mt-2">
                <div className="h-4 w-64 bg-gray-200 rounded-md" />
              </div>
            </div>
          </div>
        </div>
      </MainContainer>
    </div>
  );
}
