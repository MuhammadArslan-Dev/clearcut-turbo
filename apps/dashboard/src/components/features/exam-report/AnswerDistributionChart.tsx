"use client";

import Text from "@clearcut/ui/text";
import { useTranslations } from "next-intl";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";

export default function AnswerDistributionChart({ data }: { data: any }) {
  const t = useTranslations("modals.performanceReport");

  const result = data?.result;
  if (!result) return null;

  const dataList = [
    {
      name: t("legend.correct"),
      value: result.correct,
      color: "var(--icon-positive-subtle)",
    },
    {
      name: t("legend.incorrect"),
      value: result.wrong,
      color: "var(--icon-negative-normal)",
    },
    {
      name: t("legend.skipped"),
      value: result.unanswered,
      color: "var(--icon-gray-disabled)",
    },
  ];

  return (
    <div className="w-full">
      <div className="flex items-center flex-col gap-1 mb-2">
        <Text
          as="h6"
          variant="heading-small"
          weight="normal"
          color="gray-subtle"
        >
          {t("distribution.title")}
        </Text>
        <Text as="p" variant="body-medium" weight="normal" color="gray-muted">
          {t("distribution.subtitle")}
        </Text>
      </div>

      <div className="w-full h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={dataList}
              cx="50%"
              cy="50%"
              outerRadius="65%"
              dataKey="value"
              labelLine={false}
              isAnimationActive={true}
            >
              {dataList.map((entry: any, index: number) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip formatter={(value: any, name: any) => [value, name]} />
            <Legend
              verticalAlign="bottom"
              iconType="circle"
              wrapperStyle={{ paddingTop: "12px" }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
