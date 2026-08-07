// utils/imageService.ts
export const getImageUrl = (path?: string | null) => {
  if (!path) return "/images/fallback.svg";
  const base = process.env.NEXT_PUBLIC_CMS_URL || "http://localhost:3001";
  return `${base}${path}`;
};
