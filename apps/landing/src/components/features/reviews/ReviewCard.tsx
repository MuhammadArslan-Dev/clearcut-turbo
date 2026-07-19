import DoubleQuotesIcon from "@/components/icons/double-quotes-icon";
import Paragraph from "@/components/shared/text-render/Paragraph";
import Text from "@clearcut/ui/text";
import { Card } from "@clearcut/ui/card";
import React from "react";
export interface ReviewsItem {
  profile: React.ReactNode;
  name: string;
  role?: string;
  review?: string;
  reviewHighLight?: string | string[];
}
export default function ReviewCard({
  profile,
  name,
  role,
  review,
  reviewHighLight,
}: ReviewsItem) {
  return (
    <Card
      maxWidth="max-w-[350px]"
      width="min-w-[350px]"
      padding="p-6"
      border="border-none"
      className="flex flex-col gap-4"
    >
      <div className="flex gap-4 justify-between items-center w-full">
        <div className="w-12 h-12 rounded-full overflow-hidden object-fill">
          {" "}
          {profile}
        </div>
        <div className=" flex-1">
          <Text as="p" variant="body-large">
            {name}
          </Text>
          <Text as="p" variant="body-medium">
            {role}
          </Text>
        </div>
        <DoubleQuotesIcon />
      </div>
      <div>
        <Paragraph
          text={{
            text: review ?? "",
            highlight: reviewHighLight ?? "",
          }}
        />
      </div>
    </Card>
  );
}
