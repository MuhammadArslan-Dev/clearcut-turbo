// Which image tool a page is, from its route (locale prefix ignored): the three
// dedicated pages are named, everything else under /resizer is the exam resizer.
const DEDICATED = new Set(["image-compressor", "signature-compressor", "add-name-date"]);

export function toolIdFromPath(pathname: string): string {
  const parts = pathname.toLowerCase().split("/").filter(Boolean);
  if (parts[0] === "hi" || parts[0] === "mr") parts.shift();
  if (parts[0] === "resizer" && parts[1] && DEDICATED.has(parts[1])) return parts[1];
  return "resizer";
}
