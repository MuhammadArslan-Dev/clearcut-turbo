export type ButtonProps = {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary";
};

/********** For Joy UI Button Wrapper **********/

export type MUIColor = "primary" | "danger" | "success" | "warning" | "neutral" | "gray";
export type MUIVariant = "solid" | "outlined" | "plain" | "soft";
export type MUISize = "sm" | "md" | "lg";
