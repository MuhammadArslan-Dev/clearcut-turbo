// src/lib/utils/schema.ts
// export function getBreadcrumbSchema(items: { name: string; url: string }[]) {
//   return {
//     "@context": "https://schema.org",
//     "@type": "BreadcrumbList",
//     "itemListElement": items.map((item, index) => ({
//       "@type": "ListItem",
//       "position": index + 1,
//       "name": item.name,
//       "item": item.url,
//     })),
//   };
// }


export function getBreadcrumbSchema(items: { name: string; url?: string }[]) {

  // If there are no items, don't output schema
  if (!items.length) return null;

  // Work on a copy so the caller's array is not mutated
  const workingItems = [...items];

  let lastItem: { name: string; url?: string } | undefined;

  if (workingItems.length > 1) {
    // More than one: pop the last from the *copy*
    lastItem = workingItems.pop();
  } else {
    // Only one: just read it, don't remove it
    lastItem = workingItems[0];
  }

  return {
    "@context": "https://schema.org",
    "@id": lastItem?.url,
    "@type": "BreadcrumbList",
    "name": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      ...(item.url && { "item": item.url })
    })),
  };
}
