import Link from "next/link";
import Text from "@clearcut/ui/text";

const TOOLS = [
  { href: "/custom", label: "Custom Size", sublabel: "Any width, height & KB target" },
  { href: "/add-name-date", label: "Add Name & Date", sublabel: "Stamp name/date on a photo" },
  { href: "/image-compressor", label: "Image Compressor", sublabel: "Hit an exact KB range" },
  { href: "/signature-compressor", label: "Signature Compressor", sublabel: "Clean up & compress ink" },
  { href: "/75-face-coverage", label: "75% Face Coverage", sublabel: "Positioning guide" },
];

/** Links to the standalone single-purpose tool pages — the hub's own tool already covers all of these via its preset tiles, but each gets its own URL/copy for search traffic, same reasoning as the per-exam spoke pages. */
export default function MoreTools() {
  return (
    <div className="max-w-[1080px] mx-auto mt-16 md:mt-20 px-2">
      <Text as="h2" variant="body-large" weight="semibold" color="gray-normal" className="mb-3 text-center">
        More tools
      </Text>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {TOOLS.map((tool) => (
          <Link
            key={tool.href}
            href={tool.href}
            className="group flex flex-col gap-1 rounded-xl border border-[var(--color-border-gray-subtle)] bg-white px-4 py-3 shadow-[0_1px_3px_rgba(0,0,0,0.03)] transition-all hover:border-brand hover:shadow-[0_4px_18px_rgba(0,0,0,0.06)] hover:-translate-y-0.5"
          >
            <Text
              as="p"
              variant="body-medium"
              weight="semibold"
              color="gray-normal"
              className="group-hover:text-brand transition-colors"
            >
              {tool.label}
            </Text>
            <Text as="p" variant="body-small" color="gray-muted">
              {tool.sublabel}
            </Text>
          </Link>
        ))}
      </div>
    </div>
  );
}
