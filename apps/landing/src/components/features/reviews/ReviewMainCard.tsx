import Text from "@clearcut/ui/text";
import ContinueFreeButton from "@/components/ui/buttons/ContinueFreeButton";
import { Card } from "@clearcut/ui/card";
import Image from "next/image";
import React from "react";

export default function ReviewMainCard() {
  return (
    <Card
      maxHeight="max-h-[258px] md:max-h-[308px]"
      height="min-h-[250px] md:min-h-[308px]"
      maxWidth="max-w-[304px] md:max-w-[364px] "
      width="min-w-[304px] md:min-w-[340px]"
      padding="p-0"
      border="border-none"
    >
      <div className="flex flex-col justify-center items-center gap-4 px-2 md:p-6 h-[308px] w-full bg-white">
        <div>
          <div className="w-15 h-15 mx-auto">
            <Image
              src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d"
              alt="Clear Cutoff student reviewer"
              width={48}
              height={48}
              className="w-full h-full object-cover"
  unoptimized
            />
          </div>
          <div className="flex items-center flex-col gap-2">
            <h5 className="text-brand  heading-medium !font-semibold">4.9</h5>
            <Text as="p" variant="body-large" weight="semibold">
              1K<span className="text-brand">+</span> रिव्यू से
            </Text>
          </div>
        </div>
        <div>
          <ContinueFreeButton
            showIcon={false}
            text="साइन अप करें और अपना स्कोर सुधारें"
          />
        </div>
      </div>
    </Card>
  );
}
