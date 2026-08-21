import Math from "@/components/features/mathjax/Math";
import Text from "@clearcut/ui/text";
import TextMarkDown from "@/components/ui/widgets/TextMarkDown";
import Image from "next/image";
import React from "react";

type QuestionTextProps = {
  question: string;
  image?: string;
  ClassName?: string;
};

export default function QuestionText({
  question,
  image,
  ClassName,
}: QuestionTextProps) {
  return (
    <>
      <Math content={question}>
        <Text
          as="div"
          variant="body-large"
          weight="normal"
          color="gray-normal"
          className={ClassName}
        >
          <TextMarkDown>{question?.replace(/^\s{4,}/gm, "")}</TextMarkDown>
        </Text>
      </Math>
      {image &&
        (() => {
          if (!image) return null;
          return (
            <div className="w-full  flex justify-center">
              <div className="relative h-[160px] w-[160px] aspect-video overflow-hidden  rounded-md">
                <Image src={image} alt="" fill />
              </div>
            </div>
          );
        })()}
    </>
  );
}
