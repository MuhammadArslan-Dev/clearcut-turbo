import Text from "@clearcut/ui/text";
import { IMAGES } from "@/constants/images";
import { TextVariant } from "@/types/heading-block";
import Image from "next/image";
import React from "react";

type Props = {
  icon?: React.ReactNode;
  heading?: TextVariant;
  description?: TextVariant;
};

export default function OverViewFeatureCard({
  icon,
  heading,
  description,
}: Props) {
  return (
    <div className="">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 border px-3 py-6 rounded-md border-gray-200 bg-brand/3">
          <Image
            src={IMAGES?.badge?.course?.green?.dark}
            alt="course badge"
            width={20}
            height={20}
  unoptimized
          />
          <Text
            as="p"
            variant="heading-small"
            weight="semibold"
            color="gray-normal"
          >
            {heading?.text ?? ""}
          </Text>
        </div>
        <div>
          <Text as="p" variant="body-large" color="gray-subtle">
            {description?.text ?? ""}
          </Text>
        </div>
      </div>
    </div>
  );
}
