import React from "react";

export type TextVariant = {
  text: string | React.ReactNode;
  highlight?: string | string[];
  highlightClass?: string;
};