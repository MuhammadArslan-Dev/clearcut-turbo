import React from "react";
import NextLink from "next/link";

type Alignment = {
  direction?: "row" | "column";
  gap?: string; // e.g., "4px", "8px"
};

type LinkComponentProps = {
  href: string;
  onClick?: () => void;
  target?: string;
  className?: string;
  style?: React.CSSProperties;
  "aria-label"?: string;
  children?: React.ReactNode;
};

type LinksListProps = {
  alignment?: Alignment;
  icon?: React.ReactNode;
  href?: string;
  label?: string | null;
  onClick?: () => void;
  target?: string;
  cursor?: string;
  className?: string;
  font?: string;
  fontColor?: string;
  /** Accessible name for icon-only links (no visible `label`). */
  ariaLabel?: string;
  /**
   * Link component to render with. Defaults to `next/link`. Pass an app's
   * locale-aware Link (e.g. `@clearcut/i18n/navigation`'s `Link`) to get
   * locale-prefixed internal routing.
   */
  LinkComponent?: React.ComponentType<LinkComponentProps>;
  /**
   * "separate" (default): icon sits outside the link — only the label is
   * clickable. "combined": icon and label are both inside one link — the
   * whole item is clickable. This mirrors a real difference between apps'
   * current footers, not arbitrary drift, so it's explicit rather than
   * defaulted the same way everywhere.
   */
  variant?: "separate" | "combined";
};

export const LinksList = ({
  alignment = { direction: "row", gap: "4px" },
  icon,
  href,
  label,
  onClick,
  target,
  cursor = "pointer",
  font = "body-large",
  className = "",
  fontColor = "text-white",
  ariaLabel,
  LinkComponent = NextLink as unknown as React.ComponentType<LinkComponentProps>,
  variant = "separate",
}: LinksListProps) => {
  // Render nothing if neither icon nor label is provided
  if (!icon && !label) return null;

  const directionClass = alignment.direction === "column" ? "flex-col" : "flex-row";

  if (variant === "combined") {
    return (
      <LinkComponent
        href={href || "#"}
        onClick={onClick}
        target={target}
        aria-label={!label ? ariaLabel : undefined}
        className={`flex items-center ${directionClass} cursor-${cursor} ${className} ${fontColor} ${font}`}
        style={{ gap: alignment.gap }}
      >
        {icon}
        {label}
      </LinkComponent>
    );
  }

  return (
    <div
      className={`flex items-center ${directionClass} cursor-${cursor} ${className}`}
      style={{ gap: alignment.gap }}
    >
      {icon}
      <LinkComponent
        href={href || "#"}
        className={`${fontColor} ${font}`}
        onClick={onClick}
        target={target}
      >
        {label}
      </LinkComponent>
    </div>
  );
};
