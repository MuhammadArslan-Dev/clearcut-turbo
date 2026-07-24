import React from "react";
import Image from "next/image";
import ReactMarkdown from "react-markdown";

import MathRender from "../mathjax/Math";
import Text from "@clearcut/ui/text";
import { Card } from "@clearcut/ui/card";
import CounterCard from "@/components/ui/cards/CounterCard";

/* -------------------------------------------------------------------------- */
/*                                OPTION CARD                                 */
/* -------------------------------------------------------------------------- */

const OptionCard = React.memo(function OptionCard({
  index,
  value,
  correctOption,
  userOption,
  isQuestionAnswered,
}: {
  index: number;
  value: any;
  correctOption: number;
  userOption: number | null;
  isQuestionAnswered: boolean;
}) {
  const label = String.fromCharCode(65 + index);

  const isCorrect = isQuestionAnswered && index === correctOption;
  const isWrongSelected =
    isQuestionAnswered &&
    userOption !== null &&
    index === userOption &&
    index !== correctOption;

  // correct → light green bg + dark green border
  // wrong selected → light red bg + dark red border
  const cardBorderColor = isCorrect
    ? "#15803d"
    : isWrongSelected
      ? "#b91c1c"
      : undefined;

  const cardBgColor = isCorrect
    ? "#dcfce7"
    : isWrongSelected
      ? "#fee2e2"
      : undefined;

  const counterBorderColor = isCorrect
    ? "!border-[#15803d]"
    : isWrongSelected
      ? "!border-[#b91c1c]"
      : "border-gray-300";

  const counterBgColor = isCorrect
    ? "!bg-[#dcfce7]"
    : isWrongSelected
      ? "!bg-[#fee2e2]"
      : "bg-gray-200";

  const counterTextColor = isCorrect
    ? "!text-[#15803d]"
    : isWrongSelected
      ? "!text-[#b91c1c]"
      : "";

  return (
    <Card
      padding={0}
      borderwidth={isCorrect || isWrongSelected ? 2 : 1}
      bordercolor={cardBorderColor}
      bgcolor={cardBgColor}
      className="transition"
    >
      <div className="min-h-12 flex px-2 items-center gap-2">
        <div className="w-9 h-9 flex items-center justify-center">
          <CounterCard
            value={label}
            width="w-9"
            height="h-9"
            rounded="rounded-full"
            border="border border-2"
            borderColor={counterBorderColor}
            bgColor={counterBgColor}
            textClass={counterTextColor}
          />
        </div>

        <div className="flex-1">
          <div className="flex flex-col py-2 gap-2">
            <MathRender content={value.text}>
              <Text
                as="p"
                variant="body-large"
                weight="normal"
                color="gray-normal"
              >
                <ReactMarkdown>{value.text}</ReactMarkdown>
              </Text>
            </MathRender>
            {value?.image &&
              (() => {
                if (!value.image) return null;

                return (
                  <div className="w-full flex justify-center">
                    <div className="relative h-[160px] w-[160px] aspect-video overflow-hidden rounded-md">
                      <Image src={value.image} alt="" fill />
                    </div>
                  </div>
                );
              })()}
          </div>
        </div>
      </div>
    </Card>
  );
});

export default OptionCard;
