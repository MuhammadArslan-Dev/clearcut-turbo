"use client";

// Social share buttons + copy-link for an article. `orientation` switches
// between the vertical sticky desktop rail and the horizontal mobile row.
import { useState } from "react";
import Text from "@clearcut/ui/text";
const iconClass =
  "flex h-9 w-9 items-center justify-center rounded-full border border-border-gray-subtle text-text-gray-muted transition-colors hover:border-brand hover:bg-primary-subtle hover:text-brand";

export default function ArticleShare({
  url,
  title,
  orientation = "horizontal",
}: {
  url: string;
  title: string;
  orientation?: "horizontal" | "vertical";
}) {
  const [copied, setCopied] = useState(false);
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(title);

  const links = [
    {
      name: "Share on X",
      href: `https://twitter.com/intent/tweet?url=${u}&text=${t}`,
      icon: (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
    },
    {
      name: "Share on LinkedIn",
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${u}`,
      icon: (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
      ),
    },
    {
      name: "Share on WhatsApp",
      href: `https://wa.me/?text=${t}%20${u}`,
      icon: (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.945C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 018.413 3.488 11.824 11.824 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 001.599 5.393l-.999 3.648 3.9-1.024zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.71.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
        </svg>
      ),
    },
  ];

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable
    }
  };

  const vertical = orientation === "vertical";

  return (
    <div className={vertical ? "flex flex-col items-center gap-2" : "flex flex-wrap items-center gap-2"}>
      {!vertical && (
        <Text as="span" variant="body-small" weight="semibold" color="gray-muted" className="mr-1">
          Share
        </Text>
      )}
      {links.map((l) => (
        <a key={l.name} href={l.href} target="_blank" rel="noopener noreferrer" aria-label={l.name} title={l.name} className={iconClass}>
          {l.icon}
        </a>
      ))}
      <button type="button" onClick={copy} aria-label="Copy link" title={copied ? "Copied!" : "Copy link"} className={iconClass}>
        {copied ? (
          <svg className="h-4 w-4 text-success" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M16.704 5.29a1 1 0 010 1.42l-7.5 7.5a1 1 0 01-1.42 0l-3.5-3.5a1 1 0 011.42-1.42l2.79 2.79 6.79-6.79a1 1 0 011.42 0z" clipRule="evenodd" />
          </svg>
        ) : (
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path d="M8.75 4.75a3.5 3.5 0 000 4.95l.7.7a.75.75 0 001.06-1.06l-.7-.7a2 2 0 012.83-2.83l2.12 2.12a2 2 0 010 2.83l-.7.7a.75.75 0 101.06 1.06l.7-.7a3.5 3.5 0 000-4.95l-2.12-2.12a3.5 3.5 0 00-4.95 0z" />
            <path d="M11.25 15.25a3.5 3.5 0 000-4.95l-.7-.7a.75.75 0 10-1.06 1.06l.7.7a2 2 0 01-2.83 2.83L5.24 12.07a2 2 0 010-2.83l.7-.7a.75.75 0 00-1.06-1.06l-.7.7a3.5 3.5 0 000 4.95l2.12 2.12a3.5 3.5 0 004.95 0z" />
          </svg>
        )}
      </button>
    </div>
  );
}
