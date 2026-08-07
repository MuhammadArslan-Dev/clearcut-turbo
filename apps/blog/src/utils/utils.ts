import { ClassValue, clsx } from "clsx";

// Capitalize only the first letter of the first word
export const capitalizeFirstWord = (str: string): string => {
  if (!str) return "";
  const firstWord = str.split(" ")[0];
  return firstWord.charAt(0).toUpperCase() + firstWord.slice(1).toLowerCase();
};

export function replacePlaceholders(
  text: string | null | undefined,
  values: Record<string, string | undefined>
): string {
  let result = text ?? "";

  for (const key in values) {
    const regex = new RegExp(`{${key}}`, "g");
    result = result.replace(regex, values[key] ?? "");
  }
  return result;
}

// helpers/getBgColorClass.ts
export function getSectionColor(color?: string): string {
  // If backend doesn't send color, fallback to default
  const finalColor = color || "#f1f5fa";

  // Convert to lowercase to avoid issues
  const normalizedColor = finalColor.toLowerCase();

  // If it's a Tailwind-supported color (like "red-500"), return directly
  if (/^[a-z]+-\d{3}$/.test(normalizedColor)) {
    return `bg-${normalizedColor}`;
  }

  // If it's a hex color (#fff or #ffffff) -> use arbitrary value
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/.test(normalizedColor)) {
    return `bg-[${normalizedColor}]`;
  }

  // Default fallback if invalid
  return "bg-[#f1f5fa]";
}

// export function getSectionColor(color?: string) {
//   if (!color) return "bg-[#FFFFFF]"; // fallback
//   return `bg-[${color}]`;
// }
// utils/buttonStyles.ts
export const disabledButtonStyle = (
  bgColor = "#006BD117",
  textColor = "#006BD12E"
) => ({
  "&.Mui-disabled": {
    backgroundColor: bgColor,
    color: textColor,
  },
});
