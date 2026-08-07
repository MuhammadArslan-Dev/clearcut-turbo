import clsx from "clsx";

interface CustomizableHeaderProps {
  // Content props
  eyebrow?: string | null;
  showEyebrow?: boolean; // Add this new prop
  heading: string | null;
  subheading?: string | null;
  highlightText?: string | { [key: string]: string }[] | null; // Text to highlight in the heading

  // Styling props
  eyebrowColor?: string;
  headingColor?: string;
  subheadingColor?: string;
  highlightColor?: string;

  // classes
  headingClasses?: string;
  subheadingClasses?: string;
  eyebrowClasses?: string;

  // Typography props
  eyebrowSize?: "xs" | "sm" | "base" | "lg";
  headingSize?: string;
  subheadingSize?: string;

  // Font weight props
  eyebrowWeight?: "normal" | "medium" | "semibold" | "bold";
  headingWeight?: "normal" | "medium" | "semibold" | "bold" | "extrabold";
  subheadingWeight?: "normal" | "medium" | "semibold" | "bold";

  // Alignment props
  alignment?: string;
  mobileAlignment?: "left" | "center" | "right";

  // Spacing props
  spacing?: "1" | "tight" | "normal" | "loose";

  // Container props
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "full";
  className?: string;
}

export default function CustomizableHeader({
  eyebrow,
  showEyebrow = true, // Add this with default true
  heading,
  subheading,
  highlightText,
  eyebrowColor = "text-[#0083ff]",
  headingColor = "text-gray-900",
  subheadingColor = "text-gray-600",
  highlightColor = "text-blue-600",
  headingSize = "display-large",
  subheadingSize = "body-medium !font-normal",
  eyebrowWeight = "semibold",
  headingWeight = "semibold",
  subheadingWeight = "normal",
  alignment = "text-left",
  spacing = "1",
  maxWidth = "4xl",
  headingClasses = "",
  subheadingClasses = "",
  eyebrowClasses = "heading-small",
  className,
}: CustomizableHeaderProps) {
  // Weight mappings
  const weightClasses = {
    normal: "!font-normal",
    medium: "!font-medium",
    semibold: "!font-semibold",
    bold: "!font-bold",
    extrabold: "!font-extrabold",
  };

  // Spacing mappings
  const spacingClasses = {
    "1": "space-y-1",
    tight: "space-y-2",
    normal: "space-y-4",
    loose: "space-y-6",
  };

  // Max width mappings
  const maxWidthClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    full: "max-w-full",
  };

  // Function to highlight text in heading
  const renderHeading = () => {
    if (!highlightText) return heading;

    const highlights: string[] = Array.isArray(highlightText)
      ? highlightText.map((item) =>
          typeof item === "string" ? item : Object.values(item).join(" ")
        )
      : [highlightText as string];

    const regex = new RegExp(`(${highlights.join("|")})`, "gi");
    const parts = (heading ?? "").split(regex);

    return parts.map((part, index) =>
      highlights.includes(part) ? (
        <span key={index} className={highlightColor}>
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  return (
    <div className={clsx("w-full", className)}>
      <div
        className={clsx(
          "mx-auto",
          maxWidthClasses[maxWidth as keyof typeof maxWidthClasses],
          `${alignment}`
        )}
      >
        {eyebrow && showEyebrow && (
          <div
            className={clsx(
              weightClasses[eyebrowWeight],
              eyebrowColor,
              eyebrowClasses,
              "tracking-wide mb-2 font-semibold"
            )}
          >
            {eyebrow}
          </div>
        )}

        <h1
          className={clsx(
            weightClasses[headingWeight],
            headingColor,
            headingClasses,
            `${headingSize}`,
            spacingClasses[spacing]
          )}
        >
          {renderHeading()}
        </h1>

        {subheading && (
          <p
            className={clsx(
              weightClasses[subheadingWeight],
              subheadingSize,
              subheadingColor,
              subheadingClasses,
              "leading-relaxed"
            )}
          >
            {subheading}
          </p>
        )}
      </div>
    </div>
  );
}
