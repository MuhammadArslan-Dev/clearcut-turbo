// src/components/layout/Sidebar.tsx

import QuestionNavigatorSheet from "@/components/features/exam/components/modals/QuestionNavigatorSheet";
import { Card } from "@clearcut/ui/card";
import React from "react";

export default React.memo(function Sidebar() {
  return (
    <aside className="hidden min-h-0 w-[350px] shrink-0 flex-col p-3 pl-0 lg:flex lg:pr-4">
      {/* Card's default inline `min-height: fit-content` would let it grow to its
          content and spill past the viewport — `!min-h-0 !h-auto` pins it to the
          available height so the panel scrolls INSIDE the card instead. */}
      <Card
        bgcolor="white"
        border="border-none"
        padding="16px"
        borderRadius={12}
        overflow="auto"
        className="flex flex-1 flex-col gap-3 !h-auto !min-h-0"
      >
        <QuestionNavigatorSheet />
      </Card>
    </aside>
  );
});
