// Data source for the resizer tool's spoke pages (public URL:
// clearcutoff.in/tools/resizer/{slug}) — ONE dynamic page template
// (src/app/resizer/[slug]/page.tsx) reads from this module via
// generateStaticParams, so adding an exam is "add a row in the backend's
// Google Sheet / clearcut-tools-backend DB", never "add a new page file".
// This app is statically exported (see next.config.ts), so the exam set
// returned at BUILD TIME here is the FULL set of spoke pages that ever get
// built — dynamicParams is false, an unlisted slug 404s.
//
// Exam/category data itself is fetched from the clearcut-tools-backend API
// (see src/lib/api/toolsApi.ts) at build time — every function below is
// async and backed by that single cached fetch, not a hardcoded array
// anymore. See toolsApi.ts's own header comment for why there's no
// fallback to stale local data when the API is unreachable.

import { getResizerData } from "./api/toolsApi";

export interface ResizerExamSpec {
  slug: string;
  shortName: string;
  fullName: string;
  /** Groups exams for the hub page's browse list — purely presentational. */
  category: string;
  photoSpec: { widthPx: number; heightPx: number; minKB: number; maxKB: number };
  signatureSpec: { widthPx: number; heightPx: number; minKB: number; maxKB: number };
}

type Spec = { widthPx: number; heightPx: number; minKB: number; maxKB: number };

/**
 * FAQ copy (and the FAQPage JSON-LD built from it in
 * src/app/resizer/[slug]/page.tsx) is derived from an exam's own
 * photoSpec/signatureSpec at render time instead of being stored per-entry,
 * so the FAQ set only has to change in one place, and it's guaranteed to
 * always match the specs shown on the page.
 *
 * Marks/cutoff questions deliberately don't state a number: qualifying
 * marks vary by exam and category and change every cycle — inventing a
 * specific cutoff here would risk misleading a real candidate the same way
 * a wrong photo spec would.
 */
export function getExamFaqs(
  examShortName: string,
  photoSpec: Spec,
  signatureSpec: Spec,
  locale: "en" | "hi" = "en",
) {
  if (locale === "hi") {
    return [
      {
        q: `${examShortName} के लिए आवश्यक फ़ोटो साइज़ क्या है?`,
        a: `यह टूल ${examShortName} के लिए ${photoSpec.widthPx}×${photoSpec.heightPx}px, ${photoSpec.minKB}–${photoSpec.maxKB}KB पर पहले से कॉन्फ़िगर है। सबमिट करने से पहले हमेशा नवीनतम आधिकारिक ${examShortName} नोटिफिकेशन से जांच लें, क्योंकि परीक्षा प्राधिकरण कभी-कभी ये आवश्यकताएं बदल देते हैं।`,
      },
      {
        q: `क्या मैं इस टूल का उपयोग अपने ${examShortName} हस्ताक्षर के लिए भी कर सकता हूं?`,
        a: "हां, हस्ताक्षर प्रीसेट चुनें (या सीधे एक बनाएं) और यह फ़ोटो टूल की तरह ही रिसाइज़/कंप्रेस करता है।",
      },
      {
        q: "क्या मेरी फ़ोटो कहीं अपलोड होती है?",
        a: "नहीं। रिसाइज़िंग और कंप्रेशन पूरी तरह आपके ब्राउज़र में Canvas API का उपयोग करके होता है। फ़ाइल आपकी डिवाइस से कभी बाहर नहीं जाती।",
      },
      {
        q: `${examShortName} परीक्षा के लिए नोट्स कहां मिलेंगे?`,
        a: `यह टूल केवल आपके आवेदन फॉर्म के लिए फ़ोटो और हस्ताक्षर रिसाइज़िंग संभालता है। ${examShortName} स्टडी नोट्स, प्रैक्टिस टेस्ट और पिछले वर्षों के प्रश्नों के लिए, clearcutoff.in पर Clear Cutoff ऐप देखें।`,
      },
      {
        q: `${examShortName} फॉर्म के लिए आवश्यक इमेज साइज़ क्या है?`,
        a: `${examShortName} आवेदन फॉर्म में आमतौर पर दो इमेज चाहिए होती हैं: एक फ़ोटो (${photoSpec.widthPx}×${photoSpec.heightPx}px, ${photoSpec.minKB}–${photoSpec.maxKB}KB) और एक हस्ताक्षर (${signatureSpec.widthPx}×${signatureSpec.heightPx}px, ${signatureSpec.minKB}–${signatureSpec.maxKB}KB)। दोनों को अपने आप रिसाइज़ और कंप्रेस करने के लिए ऊपर दिए प्रीसेट उपयोग करें।`,
      },
      {
        q: `${examShortName} के लिए हस्ताक्षर इमेज साइज़ क्या है?`,
        a: `इस टूल में ${examShortName} हस्ताक्षर प्रीसेट ${signatureSpec.widthPx}×${signatureSpec.heightPx}px, ${signatureSpec.minKB}–${signatureSpec.maxKB}KB है। सबमिट करने से पहले हमेशा नवीनतम आधिकारिक ${examShortName} नोटिफिकेशन से पुष्टि करें।`,
      },
      {
        q: `${examShortName} के लिए न्यूनतम क्वालिफाइंग अंक क्या हैं?`,
        a: `क्वालिफाइंग अंक श्रेणी (General/OBC/EWS/SC/ST) के अनुसार अलग-अलग होते हैं और हर चक्र में आधिकारिक संचालन निकाय द्वारा तय किए जाते हैं। किसी निश्चित संख्या पर भरोसा करने के बजाय हमेशा नवीनतम आधिकारिक ${examShortName} नोटिफिकेशन या परिणाम में सटीक कटऑफ देखें।`,
      },
      {
        q: `${examShortName} के लिए फ़ोटो रिसाइज़ करने का सबसे अच्छा ऐप या टूल कौन सा है?`,
        a: `Clear Cutoff का मुफ़्त फ़ोटो और हस्ताक्षर रिसाइज़र (यह टूल) खासतौर पर परीक्षा आवेदन फॉर्म के लिए बनाया गया है। यह सटीक ${examShortName} आयाम और फ़ाइल-साइज़ सीमाएं अपने आप लागू करता है, पूरी तरह आपके ब्राउज़र में काम करता है, और किसी साइनअप या डाउनलोड की ज़रूरत नहीं।`,
      },
    ];
  }

  return [
    {
      q: `What is the required photo size for ${examShortName}?`,
      a: `This tool is pre-configured to ${photoSpec.widthPx}×${photoSpec.heightPx}px, ${photoSpec.minKB}–${photoSpec.maxKB}KB for ${examShortName}. Always cross-check against the latest official ${examShortName} notification before submitting, since exam authorities occasionally revise these requirements.`,
    },
    {
      q: `Can I use this tool for my ${examShortName} signature too?`,
      a: "Yes, pick the Signature preset (or draw one directly) and it resizes/compresses the same way as the photo tool.",
    },
    {
      q: "Is my photo uploaded anywhere?",
      a: "No. Resizing and compression happen entirely in your browser using the Canvas API. The file never leaves your device.",
    },
    {
      q: `Where can I find notes for the ${examShortName} exam?`,
      a: `This tool only handles photo and signature resizing for your application form. For ${examShortName} study notes, practice tests and previous year questions, visit the Clear Cutoff app at clearcutoff.in.`,
    },
    {
      q: `What is the required image size for the ${examShortName} form?`,
      a: `The ${examShortName} application form typically needs two images: a photo (${photoSpec.widthPx}×${photoSpec.heightPx}px, ${photoSpec.minKB}–${photoSpec.maxKB}KB) and a signature (${signatureSpec.widthPx}×${signatureSpec.heightPx}px, ${signatureSpec.minKB}–${signatureSpec.maxKB}KB). Use the presets above to resize and compress both automatically.`,
    },
    {
      q: `What is the signature image size for ${examShortName}?`,
      a: `The ${examShortName} signature preset in this tool is ${signatureSpec.widthPx}×${signatureSpec.heightPx}px, ${signatureSpec.minKB}–${signatureSpec.maxKB}KB. Always confirm against the latest official ${examShortName} notification before submitting.`,
    },
    {
      q: `Is there a minimum qualifying mark for ${examShortName}?`,
      a: `Qualifying marks vary by category (General/OBC/EWS/SC/ST) and are set by the official conducting body each cycle. Always check the latest official ${examShortName} notification or result for the exact cutoff rather than relying on a fixed number.`,
    },
    {
      q: `Which app or tool is best for resizing photos for ${examShortName}?`,
      a: `Clear Cutoff's free Photo & Signature Resizer (this tool) is purpose-built for exam application forms. It applies the exact ${examShortName} dimensions and file-size limits automatically, works entirely in your browser, and needs no signup or download.`,
    },
  ];
}

export async function getResizerExams(): Promise<ResizerExamSpec[]> {
  return (await getResizerData()).exams;
}

export async function getResizerExamBySlug(slug: string): Promise<ResizerExamSpec | undefined> {
  const exams = await getResizerExams();
  return exams.find((e) => e.slug.toLowerCase() === slug.toLowerCase());
}

export interface ResizerCategory {
  slug: string;
  label: string;
  exams: ResizerExamSpec[];
}

export function slugifyCategory(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function getResizerCategories(): Promise<ResizerCategory[]> {
  return (await getResizerData()).categories;
}

export async function getResizerCategoryBySlug(slug: string): Promise<ResizerCategory | undefined> {
  const categories = await getResizerCategories();
  return categories.find((c) => c.slug === slug.toLowerCase());
}
