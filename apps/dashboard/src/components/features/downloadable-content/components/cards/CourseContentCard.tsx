import Button from "@clearcut/ui/button";
import CounterCard, {
  CounterCardProps,
} from "@/components/ui/cards/CounterCard";
import { LockIcon, NoteIcon, StarBadge } from "@/components/ui/icons";
import Text from "@clearcut/ui/text";
import clsx from "clsx";
import { EyeIcon } from "lucide-react";
import React, { memo } from "react";

type CardClass = {
  className?: string;
  border?: string;
  padding?: string;
  rounded?: string;
  shadow?: string;
  bg?: string;
  maxWidth?: string;
  width?: string;
};

interface CardProps {
  cardClass?: CardClass;
  counter?: CounterCardProps;
  header: {
    title: string;
    subtitle?: string;
    icon?: React.ReactNode;
    color?: string;
    showIcon?: boolean;
  };
  notes?: React.ReactNode;
  onClick?: (id: string) => void;
  mainButton?: {
    isShow: boolean;
    text: string;
    onClick: () => void;
  };
}

export default function CourseContentCard({
  cardClass,
  counter,
  header,
  onClick,
  notes = [],
  mainButton = { isShow: true, text: "Study this topic in course", onClick: () => { } },
}: CardProps) {
  return (
    <div
      className={clsx(
        "flex flex-col gap-2",
        cardClass?.bg || "bg-white",
        cardClass?.border,
        cardClass?.padding ?? "px-3 py-2",
        cardClass?.rounded ?? "rounded-lg",
        cardClass?.shadow,
        cardClass?.className,
        cardClass?.maxWidth ?? "max-w-[360px]",
        cardClass?.width ?? "w-full",
      )}
    >
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <CounterCard {...counter} />
        </div>
        <div className="w-full flex items-center justify-between">
          <Text
            as="p"
            variant="body-medium"
            weight="semibold"
            color="gray-subtle"
          >
            {header?.title}
          </Text>
          {header?.showIcon && (
            <div className="flex items-center gap-1">
              <StarBadge size={20} />
              <Text
                as="p"
                variant="body-small"
                weight="bold"
                className="whitespace-nowrap !text-[#00a251]"
              >
                Easy
              </Text>
            </div>
          )}
        </div>
      </div>
      <div className="flex flex-col gap-2">
        {notes}
      </div>
      {mainButton?.isShow && (
        <div>
          <Button variant="outlined" rounded="50px" fullWidth onClick={mainButton.onClick}>
            {mainButton.text}
          </Button>
        </div>
      )}
    </div>
  );
}

interface PDFFeature {
  icon?: React.ReactNode;
  type: string | number | null;
  value: string | number | null;
}

type PDFCardProps = {
  id: string;
  title?: string;
  features?: PDFFeature;

  onClick?: (id: string) => void;

  isLock?: boolean;
};
export const PDFCard = memo(
  ({ id, title = "Detailed Notes", features, onClick, isLock }: PDFCardProps) => {
    return (
      <div className="flex items-center justify-between rounded-lg border-2 border-gray-300 p-2">
        <div className="flex items-center gap-2">
          <NoteIcon variant="pdf" size={44} />
          <div className="space-y-1">
            <Text as="h6" variant="body-medium" weight="semibold">
              {title}
            </Text>
            <Text as="p" variant="body-small" color="gray-muted">
              {features?.type}:{" "}
              <Text variant="body-medium">{features?.value}</Text>
            </Text>
          </div>
        </div>

        {isLock ? (
          <CounterCard
            width="w-[100px]"
            height="h-8"
            onClick={() => onClick?.(id)}
            borderColor="border-[#0083ff] border-2 cursor-pointer"
            value={
              <div className="flex items-center  gap-2">
                {" "}
                <Text
                  as="p"
                  variant="body-medium"
                  weight="normal"
                  color="primary-normal"
                >
                  Unlock
                </Text>
                <LockIcon size={20} color="#0083ff" />
              </div>
            }
          />

        ) : (
          <Button
            size="sm"
            variant="outlined"
            rounded="50px"
            onClick={() => onClick?.(id)} // ✅ send id upward
            rightIcon={<EyeIcon color="#0083ff" />}
          >
            View PDF
          </Button>
        )}

      </div>
    );
  },
);
