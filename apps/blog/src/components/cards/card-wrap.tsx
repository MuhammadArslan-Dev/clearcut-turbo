"use client";
import React from "react";
import Card, { CardProps } from "@mui/joy/Card";

export type CardWrapProps = {
  onClick?: () => void;
  children: React.ReactNode;
  width?: string | number;
  maxWidth?: string | number;
  minWidth?: string | number;
  height?: string | number;
  borderwidth?: string | number;
  bordercolor?: string;
  bgcolor?: string;
  padding?: string | number;
  cursor?: string;
  borderRadius?: string | number;
} & CardProps;

export default function CardWrap({
  onClick = () => {},
  children,
  minWidth,
  width = "100%",
  maxWidth = "100%",
  height = "100%",
  borderwidth = 1,
  bordercolor = "#CBD5E2", // Tailwind amber-300
  bgcolor = "transparent",
  padding = 1,
  cursor = "",
  borderRadius = 6,
  ...props
}: CardWrapProps) {
  return (
    <Card
      variant='plain'
      onClick={onClick}
      sx={{
        padding: padding,
        maxWidth,
        minWidth,
        width,
        height,
        border: `${borderwidth}px solid ${bordercolor}`,
        backgroundColor: bgcolor,
        borderRadius: borderRadius,
        cursor: cursor,
      }}
      {...props}
    >
      {children}
    </Card>
  );
}
