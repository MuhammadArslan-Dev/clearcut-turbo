// src/lib/utils/schema.ts
export function getFaqsSchema(items: { name: string; answer: string }[]) {
    return {
        "@context": "https://schema.org",
        "@type": "QAPage",
        "name": "FAQ",
        "mainEntity": items.map((item) => ({
            "@type": "Question",
            "name": item.name,
            "acceptedAnswer": {
                "@type": "Answer",
                "text": item.answer,
            },
        })),
    };
}


export function getFaqSchema(
  faqs: {
    question: string;
    answer: string;
    answerAuthor?: string;
    questionAuthor?: string;
    dateCreated?: string;       // ISO format recommended
    dateModified?: string;      // ISO format recommended
    url?: string;               // optional
  }[]
) {
  return {
    "@context": "https://schema.org",
    "@type":  "FAQPage",
    "name": "FAQ",
    "headline": "FAQ",
    "mainEntity": faqs.map((f, index) => ({
      "@type": "Question",
      "name": f.question,
      "text": f.question,  // optional but resolved warning
      "author": f.questionAuthor || "Admin",
      "dateCreated": f.dateCreated || undefined,
      "dateModified": f.dateModified || undefined,

      "acceptedAnswer": {
        "@type": "Answer",
        "text": f.answer,
        "author": f.answerAuthor || "Admin",
        "dateCreated": f.dateCreated || undefined,
        "dateModified": f.dateModified || undefined,
        "url": f.url || undefined
      }
    }))
  };
}
