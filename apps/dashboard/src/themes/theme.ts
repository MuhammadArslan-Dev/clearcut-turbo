// src/themes/theme.ts
import { extendTheme } from "@mui/joy/styles";

/* ------------------------------------------------------------------
   1️⃣  Module augmentation (CORRECT)
   ------------------------------------------------------------------ */
declare module "@mui/joy/Button" {
  interface ButtonPropsSizeOverrides {
    xs: true;
    xl: true;
  }

  interface ButtonPropsColorOverrides {
    gray: true;
  }
}
declare module "@mui/joy/styles" {
  interface Palette {
    primaryDark: {
      500: string;
      solidBg?: string;
      solidHoverBg?: string;
      solidActiveBg?: string;
    };
    gray?: {
      solidBg?: string;
      solidHoverBg?: string;
      solidActiveBg?: string;
      solidColor?: string;
      solidDisabledBg?: string;
      solidDisabledColor?: string;

      softBg?: string;
      softHoverBg?: string;
      softActiveBg?: string;
      softColor?: string;
      softDisabledBg?: string;
      softDisabledColor?: string;

      outlinedBorder?: string;
      outlinedHoverBg?: string;
      outlinedActiveBg?: string;
      outlinedColor?: string;
      outlinedDisabledBg?: string;
      outlinedDisabledColor?: string;

      plainColor?: string;
      plainHoverBg?: string;
      plainActiveBg?: string;
      plainDisabledBg?: string;
      plainDisabledColor?: string;
    };
  }

  interface PaletteOptions {
    primaryDark?: {
      500: string;
      solidBg?: string;
      solidHoverBg?: string;
      solidActiveBg?: string;
    };
    gray?: {
      solidBg?: string;
      solidHoverBg?: string;
      solidActiveBg?: string;
      solidColor?: string;
      solidDisabledBg?: string;
      solidDisabledColor?: string;

      softBg?: string;
      softHoverBg?: string;
      softActiveBg?: string;
      softColor?: string;
      softDisabledBg?: string;
      softDisabledColor?: string;

      outlinedBorder?: string;
      outlinedHoverBg?: string;
      outlinedActiveBg?: string;
      outlinedColor?: string;
      outlinedDisabledBg?: string;
      outlinedDisabledColor?: string;

      plainColor?: string;
      plainHoverBg?: string;
      plainActiveBg?: string;
      plainDisabledBg?: string;
      plainDisabledColor?: string;
    };
  }
}

/* ------------------------------------------------------------------
   2️⃣  Theme
   ------------------------------------------------------------------ */
const theme = extendTheme({
  colorSchemes: {
    /* ======================= LIGHT MODE ======================= */
    light: {
      palette: {
        /* -------- PRIMARY -------- */
        primary: {
          50: "#E6F2FF",
          100: "#CCE6FF",
          200: "#99CCFF",
          300: "#66B3FF",
          400: "#3399FF",
          500: "#0083FF", // main
          600: "#006FDB",
          700: "#005CB8",
          800: "#004C99",
          900: "#003366",

          /* SOLID */
          solidBg: "var(--joy-palette-primary-500)",
          solidHoverBg: "var(--joy-palette-primary-600)",
          solidActiveBg: "var(--joy-palette-primary-700)",
          solidDisabledBg: "rgb(var(--joy-palette-primary-mainChannel) / 9%)",
          solidDisabledColor:
            "rgb(var(--joy-palette-primary-mainChannel) / 18%)",

          /* OUTLINED */
          outlinedBorder: "var(--joy-palette-primary-500)",
          outlinedColor: "var(--joy-palette-primary-700)",
          outlinedHoverBg: "rgb(var(--joy-palette-primary-mainChannel) / 9%)",

          /* SOFT */
          softBg: "rgb(var(--joy-palette-primary-mainChannel) / 12%)",
          softHoverBg: "rgb(var(--joy-palette-primary-mainChannel) / 20%)",
          softActiveBg: "rgb(var(--joy-palette-primary-mainChannel) / 28%)",
          softColor: "var(--joy-palette-primary-800)",

          /* PLAIN */
          plainColor: "var(--joy-palette-primary-700)",
          plainHoverBg: "rgb(var(--joy-palette-primary-mainChannel) / 8%)",
        },

        /* -------- PRIMARY DARK (CUSTOM SEMANTIC COLOR) -------- */
        primaryDark: {
          500: "#006BD1",
          solidBg: "#006BD1",
          solidHoverBg: "#005BB3",
          solidActiveBg: "#004A91",
        },

        /* -------- SECONDARY -------- */
        success: {
          50: "#E6F9F0",
          100: "#CCF2E1",
          200: "#99E6C3",
          300: "#66D9A5",
          400: "#33CC87",
          500: "#00a251", // ✅ main success
          600: "#008743",
          700: "#00753A",
          800: "#005C2E",
          900: "#004423",

          /* SOLID */
          solidBg: "var(--joy-palette-success-500)",
          solidHoverBg: "var(--joy-palette-success-600)",
          solidActiveBg: "var(--joy-palette-success-700)",
          solidDisabledBg: "rgb(var(--joy-palette-success-mainChannel) / 9%)",

          /* OUTLINED */
          outlinedBorder: "var(--joy-palette-success-500)",
          outlinedColor: "var(--joy-palette-success-700)",
          outlinedHoverBg: "rgb(var(--joy-palette-success-mainChannel) / 9%)",

          /* SOFT */
          softBg: "rgb(var(--joy-palette-success-mainChannel) / 12%)",
          softHoverBg: "rgb(var(--joy-palette-success-mainChannel) / 20%)",
          softActiveBg: "rgb(var(--joy-palette-success-mainChannel) / 28%)",
          softColor: "var(--joy-palette-success-800)",

          /* PLAIN */
          plainColor: "var(--joy-palette-success-700)",
          plainHoverBg: "rgb(var(--joy-palette-success-mainChannel) / 8%)",
        },
        /* -------- DANGER -------- */
        danger: {
          50: "#FEECEC",
          100: "#FDDCDC",
          200: "#FBB9B9",
          300: "#F79999",
          400: "#F26A6A",
          500: "#D92D20", // main danger
          600: "#B42318",
          700: "#912018",
          800: "#731C14",
          900: "#5A1410",

          /* SOLID */
          solidBg: "var(--joy-palette-danger-500)",
          solidHoverBg: "var(--joy-palette-danger-600)",
          solidActiveBg: "var(--joy-palette-danger-700)",
          solidDisabledBg: "rgb(var(--joy-palette-danger-mainChannel) / 9%)",
          solidDisabledColor: "var(--joy-palette-neutral-400)",

          /* OUTLINED */
          outlinedBorder: "var(--joy-palette-danger-500)",
          outlinedColor: "var(--joy-palette-danger-700)",
          outlinedHoverBg: "rgb(var(--joy-palette-danger-mainChannel) / 9%)",
          outlinedDisabledBorder: "var(--joy-palette-neutral-200)",
          outlinedDisabledColor: "var(--joy-palette-neutral-400)",

          /* SOFT */
          softBg: "rgb(var(--joy-palette-danger-mainChannel) / 12%)",
          softHoverBg: "rgb(var(--joy-palette-danger-mainChannel) / 20%)",
          softActiveBg: "rgb(var(--joy-palette-danger-mainChannel) / 28%)",
          softDisabledBg: "rgb(var(--joy-palette-danger-mainChannel) / 6%)",
          softDisabledColor: "var(--joy-palette-neutral-500)",

          /* PLAIN */
          plainColor: "var(--joy-palette-danger-700)",
          plainHoverBg: "rgb(var(--joy-palette-danger-mainChannel) / 8%)",
          plainDisabledColor: "var(--joy-palette-neutral-400)",
        },
        gray: {
          solidBg: "#6B7280",
          solidHoverBg: "#4B5563",
          solidActiveBg: "#374151",
          solidColor: "#FFFFFF",

          softBg: "var(--background-gray)",
          softHoverBg: "#D1D5DB90",
          softActiveBg: "#9CA3AF",
          softColor: "#111827",
          softDisabledBg: "rgb(107 114 128 / 5%)",
          softDisabledColor: "rgb(107 114 128 / 50%)",

          outlinedBorder: "#9CA3AF",
          outlinedHoverBg: "#F3F4F6",
          outlinedActiveBg: "#E5E7EB",
          outlinedColor: "#374151",

          plainColor: "#374151",
          plainHoverBg: "#F3F4F6",
          plainActiveBg: "#E5E7EB",
        },
      },
    },

    /* ======================= DARK MODE ======================= */
    dark: {
      palette: {
        primary: {
          100: "#1E2D3F",
          300: "#4FA8FF",
          500: "#339DFF",
          700: "#0062C4",

          solidBg: "#339DFF",
          solidHoverBg: "#4FA8FF",
          softBg: "rgb(51 157 255 / 20%)",
          softColor: "#D6EBFF",
        },

        primaryDark: {
          500: "#4FA8FF",
          solidBg: "#4FA8FF",
        },
      },
    },
  },

  /* ------------------------------------------------------------------
     3️⃣  Global Component Overrides
     ------------------------------------------------------------------ */
  components: {
    JoyButton: {
      styleOverrides: {
        root: ({ ownerState, theme }) => ({
          ...(ownerState.size === "xs" && {
            "--Icon-fontSize": "1rem",
            "--Button-gap": "0.25rem",
            minHeight: "var(--Button-minHeight, 1.75rem)",
            fontSize: theme.vars.fontSize.xs,
            paddingBlock: "2px",
            paddingInline: "0.5rem",
          }),
          ...(ownerState.size === "xl" && {
            "--Icon-fontSize": "2rem",
            "--Button-gap": "1rem",
            minHeight: "var(--Button-minHeight, 1rem)",
            fontSize: theme.vars.fontSize.xl,
            paddingBlock: "0.5rem",
            paddingInline: "2rem",
          }),
          borderWidth: "1px",
        }),
      },
    },
  },

  fontFamily: {
    body: "var(--font-noto-sans)",
    display: "var(--font-noto-sans)",
    code: "ui-monospace, SFMono-Regular, Menlo, monospace",
  },
});

export default theme;
