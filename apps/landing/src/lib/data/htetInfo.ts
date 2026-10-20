import type { Locale } from "@/lib/i18n/config";

// Copy for the HTET age-limit and qualifying-marks pages. Every fact here is
// taken from BSEH's official HTET information bulletin (HTET-2024; the
// HTET-2022 bulletin agrees). Do not add figures that aren't in a bulletin —
// in particular no "expected"/"previous year" cutoffs (HTET has fixed
// qualifying marks) and no age limits (the bulletin prescribes none; age
// limits belong to recruitment notifications). Re-check against the latest
// bulletin when BSEH publishes a new one and update CHECKED_ON.

export const HTET_BULLETIN_URL = "https://bseh.org.in/uploads/files/3d7b5cf7d6d3c91133a80e9ef3fbfae9.pdf";
export const BSEH_URL = "https://bseh.org.in";
export const CHECKED_ON = "2026-10-19";

export type HtetPageKey = "age-limit" | "cutoff-marks";

export type HtetPageCopy = {
  title: string;
  description: string;
  h1: string;
  intro: string;
  /** Optional data table (qualifying marks). */
  table?: { caption: string; headers: [string, string, string]; rows: [string, string, string][] };
  facts: { label: string; value: string }[];
  factsHeading: string;
  sections: { heading: string; body: string }[];
  faqHeading: string;
  faqs: { q: string; a: string }[];
  sourceHeading: string;
  source: string;
  sourceLinkLabel: string;
  checkedLabel: string;
  relatedHeading: string;
  breadcrumb: string;
};

export const HTET_PAGE_KEYS: readonly HtetPageKey[] = ["age-limit", "cutoff-marks"];

/** Label for the related link to the HTET course page. */
export const HTET_COURSE_LINK: Record<Locale, string> = {
  en: "HTET preparation course",
  hi: "HTET तैयारी कोर्स",
  mr: "HTET तयारी कोर्स",
};

const QUALIFYING_ROWS: Record<Locale, [string, string, string][]> = {
  en: [
    ["All categories except Scheduled Castes and differently abled", "60%", "90"],
    ["Scheduled Castes and differently abled — Haryana domicile", "55%", "82"],
    ["Scheduled Castes and differently abled — other states", "60%", "90"],
  ],
  hi: [
    ["अनुसूचित जाति और दिव्यांग को छोड़कर सभी श्रेणियां", "60%", "90"],
    ["अनुसूचित जाति और दिव्यांग — हरियाणा डोमिसाइल", "55%", "82"],
    ["अनुसूचित जाति और दिव्यांग — अन्य राज्य", "60%", "90"],
  ],
  mr: [
    ["अनुसूचित जाती आणि दिव्यांग वगळता सर्व प्रवर्ग", "60%", "90"],
    ["अनुसूचित जाती आणि दिव्यांग — हरियाणा अधिवास", "55%", "82"],
    ["अनुसूचित जाती आणि दिव्यांग — इतर राज्ये", "60%", "90"],
  ],
};

export const HTET_PAGES: Record<HtetPageKey, Record<Locale, HtetPageCopy>> = {
  "age-limit": {
    en: {
      title: "HTET Age Limit: Minimum & Maximum Age for HTET | Clear Cutoff",
      description:
        "Is there an age limit for HTET? BSEH's official HTET information bulletin sets no minimum or maximum age to appear in the test. See what it does require.",
      h1: "HTET Age Limit: Is There a Minimum or Maximum Age?",
      intro:
        "No. The official HTET information bulletin published by the Board of School Education Haryana (BSEH) does not prescribe a minimum or maximum age for appearing in HTET. Whether you can apply depends on the educational qualification for each level, not on your age.",
      factsHeading: "HTET at a glance",
      facts: [
        { label: "Conducting body", value: "Board of School Education Haryana (BSEH), Bhiwani" },
        { label: "Minimum age to appear", value: "Not prescribed in the bulletin" },
        { label: "Maximum age to appear", value: "Not prescribed in the bulletin" },
        { label: "Number of attempts", value: "No restriction" },
        { label: "Certificate validity", value: "Lifetime, from the date the certificate is issued (all levels)" },
      ],
      sections: [
        {
          heading: "Age limits apply when you apply for a teaching job",
          body: "HTET is an eligibility test, not a recruitment exam. Qualifying it makes you eligible to apply for teacher posts. Age limits and age relaxations are applied at that stage, by the advertisement for the post and the relevant service rules — not by HTET. Always check the recruitment notification for the post you are applying for.",
        },
        {
          heading: "What decides your HTET eligibility",
          body: "Each level has its own minimum educational qualification: Level 1 (PRT) for classes I–V, Level 2 (TGT) for classes VI–VIII and Level 3 (PGT). Some routes also accept candidates appearing in the final year of their teacher-training course. The complete, subject-wise list is in the Eligibility section of the bulletin.",
        },
      ],
      faqHeading: "Frequently asked questions",
      faqs: [
        {
          q: "Can I appear in HTET after the age of 40?",
          a: "Yes, as far as HTET is concerned — the bulletin sets no upper age limit. Any age limit for a teaching post comes from that post's recruitment notification.",
        },
        {
          q: "Is there a minimum age for HTET?",
          a: "The bulletin does not prescribe one. You need to meet the educational qualification for the level you apply for.",
        },
        {
          q: "How many times can I take HTET?",
          a: "The bulletin places no restriction on the number of attempts, and candidates who have already qualified can appear again to improve their score.",
        },
      ],
      sourceHeading: "Source",
      source:
        "Board of School Education Haryana, HTET-2024 Information Bulletin (sections 5 and 9). The HTET-2022 bulletin also contains no age clause. Rules can change each year, so confirm them in the current bulletin on bseh.org.in before applying.",
      sourceLinkLabel: "Read the official HTET bulletin (PDF)",
      checkedLabel: "Last checked",
      relatedHeading: "Related",
      breadcrumb: "HTET Age Limit",
    },
    hi: {
      title: "HTET आयु सीमा: HTET के लिए न्यूनतम और अधिकतम आयु | Clear Cutoff",
      description:
        "क्या HTET के लिए कोई आयु सीमा है? BSEH के आधिकारिक HTET सूचना बुलेटिन में परीक्षा देने के लिए कोई न्यूनतम या अधिकतम आयु तय नहीं है। जानिए असल में क्या ज़रूरी है।",
      h1: "HTET आयु सीमा: क्या कोई न्यूनतम या अधिकतम आयु है?",
      intro:
        "नहीं। हरियाणा विद्यालय शिक्षा बोर्ड (BSEH) के आधिकारिक HTET सूचना बुलेटिन में HTET देने के लिए कोई न्यूनतम या अधिकतम आयु निर्धारित नहीं है। आप आवेदन कर सकते हैं या नहीं, यह हर लेवल की शैक्षणिक योग्यता से तय होता है, आपकी आयु से नहीं।",
      factsHeading: "HTET एक नज़र में",
      facts: [
        { label: "परीक्षा आयोजक", value: "हरियाणा विद्यालय शिक्षा बोर्ड (BSEH), भिवानी" },
        { label: "परीक्षा देने की न्यूनतम आयु", value: "बुलेटिन में निर्धारित नहीं" },
        { label: "परीक्षा देने की अधिकतम आयु", value: "बुलेटिन में निर्धारित नहीं" },
        { label: "प्रयासों की संख्या", value: "कोई सीमा नहीं" },
        { label: "प्रमाणपत्र की वैधता", value: "आजीवन, प्रमाणपत्र जारी होने की तारीख से (सभी लेवल)" },
      ],
      sections: [
        {
          heading: "आयु सीमा शिक्षक भर्ती के समय लागू होती है",
          body: "HTET एक पात्रता परीक्षा है, भर्ती परीक्षा नहीं। इसे पास करने पर आप शिक्षक पदों के लिए आवेदन करने के पात्र बनते हैं। आयु सीमा और आयु में छूट उसी चरण में, पद के विज्ञापन और संबंधित सेवा नियमों के अनुसार लागू होती है — HTET में नहीं। जिस पद के लिए आवेदन कर रहे हैं, उसकी भर्ती अधिसूचना ज़रूर देखें।",
        },
        {
          heading: "HTET की पात्रता किससे तय होती है",
          body: "हर लेवल की अपनी न्यूनतम शैक्षणिक योग्यता है: लेवल 1 (PRT) कक्षा I–V के लिए, लेवल 2 (TGT) कक्षा VI–VIII के लिए और लेवल 3 (PGT)। कुछ विकल्पों में शिक्षक-प्रशिक्षण कोर्स के अंतिम वर्ष में पढ़ रहे उम्मीदवार भी आवेदन कर सकते हैं। पूरी, विषय-वार सूची बुलेटिन के पात्रता (Eligibility) सेक्शन में है।",
        },
      ],
      faqHeading: "अक्सर पूछे जाने वाले प्रश्न",
      faqs: [
        {
          q: "क्या 40 साल की उम्र के बाद HTET दे सकते हैं?",
          a: "हाँ, जहां तक HTET की बात है — बुलेटिन में कोई अधिकतम आयु सीमा नहीं है। किसी शिक्षक पद की आयु सीमा उस पद की भर्ती अधिसूचना से तय होती है।",
        },
        {
          q: "क्या HTET के लिए कोई न्यूनतम आयु है?",
          a: "बुलेटिन में कोई न्यूनतम आयु निर्धारित नहीं है। जिस लेवल के लिए आवेदन कर रहे हैं, उसकी शैक्षणिक योग्यता पूरी होनी चाहिए।",
        },
        {
          q: "HTET कितनी बार दे सकते हैं?",
          a: "बुलेटिन में प्रयासों की संख्या पर कोई रोक नहीं है, और पहले से पास उम्मीदवार अपना स्कोर सुधारने के लिए दोबारा परीक्षा दे सकते हैं।",
        },
      ],
      sourceHeading: "स्रोत",
      source:
        "हरियाणा विद्यालय शिक्षा बोर्ड, HTET-2024 सूचना बुलेटिन (सेक्शन 5 और 9)। HTET-2022 बुलेटिन में भी आयु से जुड़ा कोई प्रावधान नहीं है। नियम हर साल बदल सकते हैं, इसलिए आवेदन से पहले bseh.org.in पर मौजूदा बुलेटिन में पुष्टि करें।",
      sourceLinkLabel: "आधिकारिक HTET बुलेटिन पढ़ें (PDF)",
      checkedLabel: "अंतिम बार जांचा गया",
      relatedHeading: "संबंधित",
      breadcrumb: "HTET आयु सीमा",
    },
    mr: {
      title: "HTET वयोमर्यादा: HTET साठी किमान आणि कमाल वय | Clear Cutoff",
      description:
        "HTET साठी वयोमर्यादा आहे का? BSEH च्या अधिकृत HTET माहिती पुस्तिकेत परीक्षा देण्यासाठी किमान किंवा कमाल वय ठरवलेले नाही. प्रत्यक्षात काय आवश्यक आहे ते पाहा.",
      h1: "HTET वयोमर्यादा: किमान किंवा कमाल वय आहे का?",
      intro:
        "नाही. हरियाणा शालेय शिक्षण मंडळाच्या (BSEH) अधिकृत HTET माहिती पुस्तिकेत HTET देण्यासाठी किमान किंवा कमाल वय ठरवलेले नाही. तुम्ही अर्ज करू शकता की नाही हे प्रत्येक लेव्हलच्या शैक्षणिक पात्रतेवर ठरते, तुमच्या वयावर नाही.",
      factsHeading: "HTET थोडक्यात",
      facts: [
        { label: "परीक्षा घेणारी संस्था", value: "हरियाणा शालेय शिक्षण मंडळ (BSEH), भिवानी" },
        { label: "परीक्षा देण्यासाठी किमान वय", value: "पुस्तिकेत ठरवलेले नाही" },
        { label: "परीक्षा देण्यासाठी कमाल वय", value: "पुस्तिकेत ठरवलेले नाही" },
        { label: "प्रयत्नांची संख्या", value: "कोणतीही मर्यादा नाही" },
        { label: "प्रमाणपत्राची वैधता", value: "आजीवन, प्रमाणपत्र दिल्याच्या तारखेपासून (सर्व लेव्हल)" },
      ],
      sections: [
        {
          heading: "वयोमर्यादा शिक्षक भरतीच्या वेळी लागू होते",
          body: "HTET ही पात्रता परीक्षा आहे, भरती परीक्षा नाही. ती उत्तीर्ण झाल्यावर तुम्ही शिक्षक पदांसाठी अर्ज करण्यास पात्र होता. वयोमर्यादा आणि वयातील सूट त्या टप्प्यावर, पदाच्या जाहिरातीनुसार आणि संबंधित सेवा नियमांनुसार लागू होते — HTET मध्ये नाही. ज्या पदासाठी अर्ज करत आहात त्याची भरती अधिसूचना नक्की पाहा.",
        },
        {
          heading: "HTET पात्रता कशावर ठरते",
          body: "प्रत्येक लेव्हलची स्वतःची किमान शैक्षणिक पात्रता आहे: लेव्हल 1 (PRT) इयत्ता I–V साठी, लेव्हल 2 (TGT) इयत्ता VI–VIII साठी आणि लेव्हल 3 (PGT). काही पर्यायांमध्ये शिक्षक-प्रशिक्षण अभ्यासक्रमाच्या अंतिम वर्षात शिकणारे उमेदवारही अर्ज करू शकतात. संपूर्ण, विषयनिहाय यादी पुस्तिकेच्या पात्रता (Eligibility) विभागात आहे.",
        },
      ],
      faqHeading: "वारंवार विचारले जाणारे प्रश्न",
      faqs: [
        {
          q: "वयाच्या 40 नंतर HTET देता येते का?",
          a: "हो, HTET पुरते — पुस्तिकेत कमाल वयोमर्यादा नाही. एखाद्या शिक्षक पदाची वयोमर्यादा त्या पदाच्या भरती अधिसूचनेवरून ठरते.",
        },
        {
          q: "HTET साठी किमान वय आहे का?",
          a: "पुस्तिकेत किमान वय ठरवलेले नाही. ज्या लेव्हलसाठी अर्ज करत आहात त्याची शैक्षणिक पात्रता पूर्ण असणे आवश्यक आहे.",
        },
        {
          q: "HTET किती वेळा देता येते?",
          a: "पुस्तिकेत प्रयत्नांच्या संख्येवर कोणतीही मर्यादा नाही, आणि आधीच उत्तीर्ण झालेले उमेदवार गुण सुधारण्यासाठी पुन्हा परीक्षा देऊ शकतात.",
        },
      ],
      sourceHeading: "स्रोत",
      source:
        "हरियाणा शालेय शिक्षण मंडळ, HTET-2024 माहिती पुस्तिका (विभाग 5 आणि 9). HTET-2022 पुस्तिकेतही वयाबद्दल कोणतीही तरतूद नाही. नियम दरवर्षी बदलू शकतात, म्हणून अर्ज करण्यापूर्वी bseh.org.in वरील सध्याच्या पुस्तिकेत खात्री करा.",
      sourceLinkLabel: "अधिकृत HTET पुस्तिका वाचा (PDF)",
      checkedLabel: "शेवटची तपासणी",
      relatedHeading: "संबंधित",
      breadcrumb: "HTET वयोमर्यादा",
    },
  },
  "cutoff-marks": {
    en: {
      title: "HTET Cutoff Marks: Qualifying Marks for PRT, TGT & PGT | Clear Cutoff",
      description:
        "HTET qualifying marks from BSEH's official bulletin: 60% (90/150) for most candidates and 55% (82/150) for Scheduled Caste and differently abled candidates of Haryana domicile.",
      h1: "HTET Cutoff Marks: Qualifying Marks for PRT, TGT and PGT",
      intro:
        "HTET has fixed qualifying marks, set in BSEH's information bulletin. They are the same for Level 1 (PRT), Level 2 (TGT) and Level 3 (PGT), and every paper has 150 one-mark questions.",
      table: {
        caption: "HTET qualifying marks (all levels)",
        headers: ["Category", "Qualifying percentage", "Marks out of 150"],
        rows: QUALIFYING_ROWS.en,
      },
      factsHeading: "Exam pattern (each level)",
      facts: [
        { label: "Questions", value: "150 multiple-choice questions, 1 mark each" },
        { label: "Duration", value: "2 hours 30 minutes" },
        { label: "Negative marking", value: "None" },
        { label: "Certificate validity", value: "Lifetime, from the date the certificate is issued" },
      ],
      sections: [
        {
          heading: "Is there an expected or previous-year HTET cutoff?",
          body: "Not for HTET itself. The qualifying marks are fixed in the bulletin, so there is no separate rank-based or year-wise HTET cutoff — reaching the qualifying marks for your category is what counts. Cutoffs announced in teacher recruitment (merit lists for PRT, TGT or PGT posts) are set by the recruiting agency, differ by post and year, and are not covered here; check that recruitment's official result notice.",
        },
      ],
      faqHeading: "Frequently asked questions",
      faqs: [
        {
          q: "How many marks do I need to pass HTET?",
          a: "90 out of 150 (60%) for most candidates, and 82 out of 150 (55%) for Scheduled Caste and differently abled candidates of Haryana domicile.",
        },
        {
          q: "Are the HTET qualifying marks different for PRT, TGT and PGT?",
          a: "No. The bulletin lists the same qualifying marks for all three levels.",
        },
        {
          q: "Is there negative marking in HTET?",
          a: "No. Each question carries one mark and there is no negative marking.",
        },
      ],
      sourceHeading: "Source",
      source:
        "Board of School Education Haryana, HTET-2024 Information Bulletin (section 6, scheme of examination, and section 9). Confirm the figures in the current bulletin on bseh.org.in.",
      sourceLinkLabel: "Read the official HTET bulletin (PDF)",
      checkedLabel: "Last checked",
      relatedHeading: "Related",
      breadcrumb: "HTET Cutoff Marks",
    },
    hi: {
      title: "HTET कटऑफ अंक: PRT, TGT और PGT के क्वालिफाइंग अंक | Clear Cutoff",
      description:
        "BSEH के आधिकारिक बुलेटिन से HTET क्वालिफाइंग अंक: ज़्यादातर उम्मीदवारों के लिए 60% (150 में 90) और हरियाणा डोमिसाइल के अनुसूचित जाति व दिव्यांग उम्मीदवारों के लिए 55% (150 में 82)।",
      h1: "HTET कटऑफ अंक: PRT, TGT और PGT के क्वालिफाइंग अंक",
      intro:
        "HTET के क्वालिफाइंग अंक तय हैं, जो BSEH के सूचना बुलेटिन में दिए गए हैं। ये लेवल 1 (PRT), लेवल 2 (TGT) और लेवल 3 (PGT) के लिए एक जैसे हैं, और हर पेपर में 1-1 अंक के 150 प्रश्न होते हैं।",
      table: {
        caption: "HTET क्वालिफाइंग अंक (सभी लेवल)",
        headers: ["श्रेणी", "क्वालिफाइंग प्रतिशत", "150 में से अंक"],
        rows: QUALIFYING_ROWS.hi,
      },
      factsHeading: "परीक्षा पैटर्न (हर लेवल)",
      facts: [
        { label: "प्रश्न", value: "150 बहुविकल्पीय प्रश्न, हर प्रश्न 1 अंक" },
        { label: "अवधि", value: "2 घंटे 30 मिनट" },
        { label: "नेगेटिव मार्किंग", value: "नहीं" },
        { label: "प्रमाणपत्र की वैधता", value: "आजीवन, प्रमाणपत्र जारी होने की तारीख से" },
      ],
      sections: [
        {
          heading: "क्या HTET का कोई एक्सपेक्टेड या पिछले साल का कटऑफ होता है?",
          body: "HTET के लिए नहीं। क्वालिफाइंग अंक बुलेटिन में तय हैं, इसलिए HTET का कोई अलग रैंक-आधारित या साल-वार कटऑफ नहीं होता — अपनी श्रेणी के क्वालिफाइंग अंक लाना ही मायने रखता है। शिक्षक भर्ती (PRT, TGT या PGT पदों की मेरिट सूची) के कटऑफ भर्ती एजेंसी तय करती है, जो पद और साल के अनुसार अलग होते हैं और यहां शामिल नहीं हैं; उस भर्ती का आधिकारिक रिज़ल्ट नोटिस देखें।",
        },
      ],
      faqHeading: "अक्सर पूछे जाने वाले प्रश्न",
      faqs: [
        {
          q: "HTET पास करने के लिए कितने अंक चाहिए?",
          a: "ज़्यादातर उम्मीदवारों के लिए 150 में से 90 (60%), और हरियाणा डोमिसाइल के अनुसूचित जाति व दिव्यांग उम्मीदवारों के लिए 150 में से 82 (55%)।",
        },
        {
          q: "क्या PRT, TGT और PGT के क्वालिफाइंग अंक अलग हैं?",
          a: "नहीं। बुलेटिन में तीनों लेवल के लिए एक जैसे क्वालिफाइंग अंक दिए गए हैं।",
        },
        {
          q: "क्या HTET में नेगेटिव मार्किंग है?",
          a: "नहीं। हर प्रश्न 1 अंक का है और कोई नेगेटिव मार्किंग नहीं है।",
        },
      ],
      sourceHeading: "स्रोत",
      source:
        "हरियाणा विद्यालय शिक्षा बोर्ड, HTET-2024 सूचना बुलेटिन (सेक्शन 6, परीक्षा की योजना, और सेक्शन 9)। bseh.org.in पर मौजूदा बुलेटिन में आंकड़ों की पुष्टि करें।",
      sourceLinkLabel: "आधिकारिक HTET बुलेटिन पढ़ें (PDF)",
      checkedLabel: "अंतिम बार जांचा गया",
      relatedHeading: "संबंधित",
      breadcrumb: "HTET कटऑफ अंक",
    },
    mr: {
      title: "HTET कटऑफ गुण: PRT, TGT आणि PGT चे उत्तीर्णतेचे गुण | Clear Cutoff",
      description:
        "BSEH च्या अधिकृत पुस्तिकेनुसार HTET उत्तीर्णतेचे गुण: बहुतेक उमेदवारांसाठी 60% (150 पैकी 90) आणि हरियाणा अधिवासाच्या अनुसूचित जाती व दिव्यांग उमेदवारांसाठी 55% (150 पैकी 82).",
      h1: "HTET कटऑफ गुण: PRT, TGT आणि PGT चे उत्तीर्णतेचे गुण",
      intro:
        "HTET चे उत्तीर्णतेचे गुण निश्चित आहेत आणि ते BSEH च्या माहिती पुस्तिकेत दिलेले आहेत. ते लेव्हल 1 (PRT), लेव्हल 2 (TGT) आणि लेव्हल 3 (PGT) साठी सारखेच आहेत, आणि प्रत्येक पेपरमध्ये प्रत्येकी 1 गुणाचे 150 प्रश्न असतात.",
      table: {
        caption: "HTET उत्तीर्णतेचे गुण (सर्व लेव्हल)",
        headers: ["प्रवर्ग", "उत्तीर्णतेची टक्केवारी", "150 पैकी गुण"],
        rows: QUALIFYING_ROWS.mr,
      },
      factsHeading: "परीक्षेचा नमुना (प्रत्येक लेव्हल)",
      facts: [
        { label: "प्रश्न", value: "150 बहुपर्यायी प्रश्न, प्रत्येकी 1 गुण" },
        { label: "कालावधी", value: "2 तास 30 मिनिटे" },
        { label: "निगेटिव्ह मार्किंग", value: "नाही" },
        { label: "प्रमाणपत्राची वैधता", value: "आजीवन, प्रमाणपत्र दिल्याच्या तारखेपासून" },
      ],
      sections: [
        {
          heading: "HTET चा अपेक्षित किंवा मागील वर्षाचा कटऑफ असतो का?",
          body: "HTET साठी नाही. उत्तीर्णतेचे गुण पुस्तिकेत निश्चित आहेत, त्यामुळे HTET चा वेगळा रँक-आधारित किंवा वर्षनिहाय कटऑफ नसतो — तुमच्या प्रवर्गाचे उत्तीर्णतेचे गुण मिळवणे हेच महत्त्वाचे आहे. शिक्षक भरतीचे (PRT, TGT किंवा PGT पदांच्या गुणवत्ता यादीचे) कटऑफ भरती संस्था ठरवते, ते पद आणि वर्षानुसार वेगळे असतात आणि येथे दिलेले नाहीत; त्या भरतीची अधिकृत निकाल सूचना पाहा.",
        },
      ],
      faqHeading: "वारंवार विचारले जाणारे प्रश्न",
      faqs: [
        {
          q: "HTET उत्तीर्ण होण्यासाठी किती गुण लागतात?",
          a: "बहुतेक उमेदवारांसाठी 150 पैकी 90 (60%), आणि हरियाणा अधिवासाच्या अनुसूचित जाती व दिव्यांग उमेदवारांसाठी 150 पैकी 82 (55%).",
        },
        {
          q: "PRT, TGT आणि PGT साठी उत्तीर्णतेचे गुण वेगळे आहेत का?",
          a: "नाही. पुस्तिकेत तिन्ही लेव्हलसाठी सारखेच उत्तीर्णतेचे गुण दिले आहेत.",
        },
        {
          q: "HTET मध्ये निगेटिव्ह मार्किंग आहे का?",
          a: "नाही. प्रत्येक प्रश्नाला 1 गुण आहे आणि निगेटिव्ह मार्किंग नाही.",
        },
      ],
      sourceHeading: "स्रोत",
      source:
        "हरियाणा शालेय शिक्षण मंडळ, HTET-2024 माहिती पुस्तिका (विभाग 6, परीक्षेची योजना, आणि विभाग 9). bseh.org.in वरील सध्याच्या पुस्तिकेत आकड्यांची खात्री करा.",
      sourceLinkLabel: "अधिकृत HTET पुस्तिका वाचा (PDF)",
      checkedLabel: "शेवटची तपासणी",
      relatedHeading: "संबंधित",
      breadcrumb: "HTET कटऑफ गुण",
    },
  },
};
