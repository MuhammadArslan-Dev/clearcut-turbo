// src/themes/theme.ts
import { extendTheme } from "@mui/joy/styles";
declare module "@mui/joy/styles" {
  interface Palette {
    primaryDark: string;
  }
  interface PaletteOptions {
    primaryDark?: string;
  }
}

const palette = {
  primary: {
    solidBg: "var(--color-brand)",
    solidBorder: "var(--color-brand)",
    solidHoverBg: "#0b5ed7",
    solidHoverBorder: "#0a58ca",
    solidActiveBg: "var(--color-brand)",
    solidActiveBorder: "#0a53be",
    solidDisabledBg: "var(--color-brand)",
    solidDisabledBorder: "var(--color-brand)",
  },
};

const joytheme = extendTheme({
  colorSchemes: {
    light: { palette },
    dark: { palette },
  },

  // 👇 Joy UI Button overrides
  components: {
    JoyButton: {
      styleOverrides: {
        root: ({ ownerState }) => ({
          borderRadius: "4px",
          textTransform: "none",

          // ✅ only apply when variant = "outlined"
          ...(ownerState.variant === "outlined" && {
            color: "#006bd1", // text color
            borderWidth: "2px",
          }),
        }),
      },
    },
  },
});

export default joytheme;
