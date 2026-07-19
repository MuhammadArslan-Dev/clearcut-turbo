// src/lib/utils/schema.ts
export function getMcqListFaqSchema(items: any[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": items.map((item) => {
      const correctOption = `option_${item.correct_option}_text`;
      const correctAnswer = item[correctOption];

      return {
        "@type": "Question",
        "name": item.question_text,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `सही उत्तर: ${correctAnswer}<br><br>${item.explanation ?? ""}`
        }
      };
    })
  };
}
