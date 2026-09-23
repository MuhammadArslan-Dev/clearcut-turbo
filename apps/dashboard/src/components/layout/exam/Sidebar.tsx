// src/components/layout/Sidebar.tsx

import QuestionNavigatorSheet from "@/components/features/exam/components/modals/QuestionNavigatorSheet";
import React from "react";

export default React.memo(function Sidebar() {
    
  
  return (
    <aside className="hidden lg:flex max-h-[calc(100%-5px)] w-[420px] flex-col p-2 pl-8">
      <div className="max-h-full flex flex-col gap-3 overflow-y-auto rounded-md bg-white px-3 py-4 shadow-sm">
        <QuestionNavigatorSheet />
      </div>
    </aside>
  );
});

