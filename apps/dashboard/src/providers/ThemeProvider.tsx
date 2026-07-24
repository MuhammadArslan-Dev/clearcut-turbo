"use client";

import * as React from "react";
import { CssVarsProvider } from "@mui/joy/styles";
import theme from "@/themes/theme";

export default function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {

  return (
    <CssVarsProvider theme={theme}>
      {children}
    </CssVarsProvider>
  );
}
