import Text from "@clearcut/ui/text";
import React, { useState } from "react";
import { motion } from "framer-motion";
import clsx from "clsx";
import { useExamStore } from "../../store/useExamStore";

type FilterType = "all" | "notVisited" | "answered" | "notAnswered" | "review";

function QuestionFilter() {
  const [filter, setFilter] = useState<FilterType>("all");

  const { getStats } = useExamStore();

  const stats = getStats();

  const filters = [
    {
      key: "all",
      label: "All",
      count: stats.total,
    },
    {
      key: "notVisited",
      label: "Not Visited",
      count: stats.notVisited,
    },
    {
      key: "answered",
      label: "Answered",
      count: stats.answered,
    },
    {
      key: "notAnswered",
      label: "Not Answered",
      count: stats.total - stats.answered - stats.notVisited,
    },
    {
      key: "review",
      label: "Review",
      count: stats.review,
    },
  ];

  return (
    <div className="flex flex-col gap-2">
      <Text as="p" variant="body-medium" weight="semibold">
        Filter
      </Text>

      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <motion.div
            key={f.key}
            whileTap={{ scale: 0.95 }}
            onClick={() => setFilter(f.key as FilterType)}
            className={clsx(
              "cursor-pointer inline-flex items-center whitespace-nowrap",
              "border-2 rounded-full px-3 py-1 text-sm",

              filter === f.key
                ? "bg-brand text-white border-brand"
                : "bg-white text-gray-600 border-gray-200",
            )}
          >
            {f.label} ({f.count})
          </motion.div>
        ))}
      </div>
    </div>
  );
}



export default QuestionFilter
