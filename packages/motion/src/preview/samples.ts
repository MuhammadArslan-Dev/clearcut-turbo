// Example content for the gallery only (not real student data).
import type { Question } from "../test/mini-test";

export const QUESTIONS: Record<"en" | "hi", Question[]> = {
  en: [
    {
      id: "q1",
      text: "According to Piaget, a child in the concrete operational stage can:",
      options: ["Think abstractly", "Understand conservation", "Use only symbolic play", "None of these"],
      answer: 1,
      explanation: "Conservation develops at about 7–11 years, in the concrete operational stage.",
    },
    {
      id: "q2",
      text: "Which of these is a feature of formative assessment?",
      options: ["Grading at the end of term", "Continuous feedback during learning", "Board examinations", "Ranking students"],
      answer: 1,
      explanation: "Formative assessment happens during learning and guides teaching.",
    },
    {
      id: "q3",
      text: "The 'Zone of Proximal Development' was proposed by:",
      options: ["Jean Piaget", "Lev Vygotsky", "Lawrence Kohlberg", "B. F. Skinner"],
      answer: 1,
    },
    {
      id: "q4",
      text: "A learning disability related to writing is called:",
      options: ["Dyslexia", "Dyscalculia", "Dysgraphia", "Dyspraxia"],
      answer: 2,
      explanation: "Dyslexia is reading, dyscalculia is maths, dyspraxia is motor coordination.",
    },
    {
      id: "q5",
      text: "The RTE Act 2009 gives free and compulsory education to children aged:",
      options: ["3–10 years", "6–14 years", "5–15 years", "6–18 years"],
      answer: 1,
    },
  ],
  hi: [
    {
      id: "q1",
      text: "पियाजे के अनुसार, मूर्त संक्रियात्मक अवस्था में बच्चा:",
      options: ["अमूर्त चिंतन कर सकता है", "संरक्षण की समझ रखता है", "केवल प्रतीकात्मक खेल करता है", "इनमें से कोई नहीं"],
      answer: 1,
      explanation: "संरक्षण की समझ लगभग 7–11 वर्ष में, मूर्त संक्रियात्मक अवस्था में विकसित होती है।",
    },
    {
      id: "q2",
      text: "रचनात्मक आकलन की विशेषता कौन-सी है?",
      options: ["सत्र के अंत में ग्रेड देना", "सीखने के दौरान लगातार फीडबैक", "बोर्ड परीक्षा", "छात्रों की रैंकिंग"],
      answer: 1,
      explanation: "रचनात्मक आकलन सीखने के दौरान होता है और शिक्षण को दिशा देता है।",
    },
    {
      id: "q3",
      text: "'समीपस्थ विकास का क्षेत्र' (ZPD) किसने दिया?",
      options: ["जीन पियाजे", "लेव वाइगोत्स्की", "लॉरेंस कोहलबर्ग", "बी. एफ. स्किनर"],
      answer: 1,
    },
    {
      id: "q4",
      text: "लिखने से जुड़ी अधिगम अक्षमता को क्या कहते हैं?",
      options: ["डिस्लेक्सिया", "डिस्कैलकुलिया", "डिसग्राफिया", "डिस्प्रैक्सिया"],
      answer: 2,
      explanation: "डिस्लेक्सिया पढ़ने से, डिस्कैलकुलिया गणित से और डिस्प्रैक्सिया गति-समन्वय से जुड़ी है।",
    },
    {
      id: "q5",
      text: "RTE अधिनियम 2009 किस आयु के बच्चों को निःशुल्क और अनिवार्य शिक्षा देता है?",
      options: ["3–10 वर्ष", "6–14 वर्ष", "5–15 वर्ष", "6–18 वर्ष"],
      answer: 1,
    },
  ],
};

export const SUBJECTS: Record<"en" | "hi", string[]> = {
  en: ["Child Development", "Hindi", "English", "Mathematics", "EVS", "Sanskrit"],
  hi: ["बाल विकास", "हिंदी", "अंग्रेज़ी", "गणित", "पर्यावरण", "संस्कृत"],
};

export const PDFS: Record<"en" | "hi", { title: string; meta: string; size: number }[]> = {
  en: [
    { title: "HTET 2025 Level 2 — Question paper", meta: "36 pages · 2.4 MB", size: 2.4 },
    { title: "Child Development — Revision notes", meta: "18 pages · 1.1 MB", size: 1.1 },
    { title: "Mock 3 — Your answer sheet & solutions", meta: "42 pages · 3.8 MB", size: 3.8 },
  ],
  hi: [
    { title: "HTET 2025 लेवल 2 — प्रश्न पत्र", meta: "36 पेज · 2.4 MB", size: 2.4 },
    { title: "बाल विकास — रिवीज़न नोट्स", meta: "18 पेज · 1.1 MB", size: 1.1 },
    { title: "मॉक 3 — आपकी उत्तर पुस्तिका और हल", meta: "42 पेज · 3.8 MB", size: 3.8 },
  ],
};
