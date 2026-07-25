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

// `solid*Bg` uses --color-brand-accessible, not --color-brand: Joy's solid
// primary buttons put white text on this background, and white on #0083ff is
// 3.69:1 — below WCAG AA. This was the last `color-contrast` failure on the
// year page (the mobile "Years List" button). Borders keep --color-brand, which
// is fine: non-text UI only needs 3:1. See packages/design-tokens/tokens.css.
const palette = {
  primary: {
    solidBg: "var(--color-brand-accessible)",
    solidBorder: "var(--color-brand)",
    solidHoverBg: "#0b5ed7",
    solidHoverBorder: "#0a58ca",
    solidActiveBg: "var(--color-brand-accessible)",
    solidActiveBorder: "#0a53be",
    solidDisabledBg: "var(--color-brand-accessible)",
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
