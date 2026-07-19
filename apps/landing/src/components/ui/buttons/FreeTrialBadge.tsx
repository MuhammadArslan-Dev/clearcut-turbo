'use client';
import React from "react";
import Button from "@clearcut/ui/button";
import Text from "@clearcut/ui/text";
export default function FreeTrialBadge({
  text = "3-day FREE Trial",
}: {
  text?: string;
}) {
  return (
    <Button
      size="sm"
      rounded="50px"
      variant="outlined"
      color="primary"
      
      onClick={() => {}}
    >
      <Text variant="body-large" weight="semibold" color="primary-normal">
        {text}
      </Text>
    </Button>
  );
}
