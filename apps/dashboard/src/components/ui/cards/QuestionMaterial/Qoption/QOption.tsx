import React from "react";
import { Card } from "@clearcut/ui/card";
import clsx from "clsx";
import CounterCard from "../../CounterCard";
import Math from "@/components/features/mathjax/Math";
import TextMarkDown from "../../../widgets/TextMarkDown";
import Text, { TextVariant } from "@clearcut/ui/text";
import Image from "next/image";

interface valueProps {
  text: string;
  image?: string;
  index: number;
}

interface CounterProps {
  fontSize?: string;
  fontFamily?: TextVariant;
  width?: string;
  height?: string;
  color?: string;
  borderRadius?: string;
  backgroundColor?: string;
  borderColor?: string;
  showCounting?: boolean;
}
interface MainContainerProps {
  borderwidth?: number;
  borderRadius?: number;
  padding?: number | string;
  bgcolor?: string;
  bordercolor?: string;
  className?: string;
}

type QOptionProps = {
  value: valueProps;
  counter?: CounterProps;
  mainContainer?: MainContainerProps;
  quesClass?: string;

  onClick?: () => void;
};

// React.memo is safe to add regardless of whether callers pass stable
// props: it only ever SKIPS a re-render when props are shallow-equal to
// the last render, never causes a stale one. Effectiveness (not
// correctness) depends on callers not recreating value/counter/onClick
// inline on every render — see mainContent.tsx's callers.
function QOption({
  value,
  quesClass,
  mainContainer = {
    borderwidth: 2,
    borderRadius: 8,
    padding: "8px",
    bgcolor: "",
    bordercolor: "!border-[var(--border-gray-muted)]",
  },
  counter,
  onClick,
}: QOptionProps) {
  return (
    <Card
      onClick={onClick}
      padding={mainContainer?.padding}
      borderwidth={mainContainer?.borderwidth}
      borderRadius={mainContainer?.borderRadius}
      className={clsx(
        "cursor-pointer transition border",
        mainContainer?.bgcolor,
        mainContainer?.bordercolor,
      )}
    >
      <div className="flex items-center gap-2">
        <div className="w-9 h-9 flex items-center justify-center">
          <CounterCard
            border={clsx("border border-2 border-gray-300")}
            bgColor={counter?.backgroundColor ?? "bg-gray-200"}
            width={counter?.width ?? "w-9"}
            height={counter?.height ?? "h-9"}
            value={
              counter?.showCounting
                ? value.index.toString()
                : String.fromCharCode(65 + value.index)
            }
            textClass={clsx(counter?.fontSize, counter?.color)}
            fontFamily={counter?.fontFamily}
            rounded={counter?.borderRadius ?? "rounded-full"}
            borderColor={counter?.borderColor}
          />
        </div>

        <div>
          <Math content={value.text}>
            <Text
              as="div"
              variant="body-large"
              weight="normal"
              color="gray-normal"
              className={quesClass}
            >
              <TextMarkDown>{value.text}</TextMarkDown>
            </Text>
          </Math>
          {value?.image &&
            (() => {
              const imgSrc = value.image;
              if (!imgSrc) return null;
              return (
                <div className="w-full  flex justify-center">
                  <div className="relative h-[160px] w-[160px] aspect-video overflow-hidden  rounded-md">
                    <Image src={imgSrc} alt="" fill />
                  </div>
                </div>
              );
            })()}
        </div>
      </div>
    </Card>
  );
}

export default React.memo(QOption);
