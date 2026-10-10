"use client";

import React, { useRef } from "react";
import { motion } from "framer-motion";
import Section from "@/components/global/Section";
import HeaderBlock from "@/components/shared/text-render/HeaderBlock";
import FAQAccordion, { AccordionItem } from "@/components/shared/FAQAccordion";
import { useScrollOnUserAction } from "@/hooks/useScrollOnUserAction";
import { Locale, defaultLocale } from "@/lib/i18n/config";
import type { AppPlatform } from "./AppDownloadHero";

type FAQKey = "gettingStarted" | "login" | "content" | "payments" | "support";
type FAQ = { q: string; a: string };

type AppFaqContent = {
  eyebrow: string;
  heading: string;
  description: string;
  filters: { label: string; key: FAQKey }[];
  faqs: Record<FAQKey, FAQ[]>;
};

// Real Android content (apps/landing/src/components/sections/app-download/AppDownloadFaqSection.tsx,
// supplied content). The iOS page reuses this exact same content — every
// "Android" / "Google Play Store" mention is swapped to "iOS" / "App Store"
// mechanically below, so the two pages can never drift apart except on that
// one word, as requested.
const ANDROID_CONTENT: Record<Locale, AppFaqContent> = {
  en: {
    eyebrow: "Frequently asked questions",
    heading: "Have Questions?",
    description: "A few things to know before downloading the app.",
    filters: [
      { label: "Getting started", key: "gettingStarted" },
      { label: "Login and account", key: "login" },
      { label: "Content and features", key: "content" },
      { label: "Plans and payments", key: "payments" },
      { label: "Notifications and support", key: "support" },
    ],
    faqs: {
      gettingStarted: [
        {
          q: "What is the Clear Cutoff app?",
          a: "Clear Cutoff is a preparation app for teaching exams. You get video lectures, PYQs, revision notes and full-length test series in one place on your Android phone.",
        },
        {
          q: "Which TET exams does the app support?",
          a: "The app supports CTET, REET, HTET, UPTET and other state-level TET exams, with more being added over time.",
        },
        {
          q: "Where can I download the app?",
          a: 'Search for "Clear Cutoff" on the Google Play Store and tap Install.',
        },
        {
          q: "Which Android phones does the app support?",
          a: "The app works on most Android phones. You can check the minimum Android version on the Play Store listing. Keep the app updated for the best experience.",
        },
      ],
      login: [
        {
          q: "How do I log in?",
          a: "Enter your mobile number and verify it with the OTP sent to you. On supported phones, the app can suggest your number and fill in the OTP automatically.",
        },
        {
          q: "I did not receive my OTP. What should I do?",
          a: "Check that your mobile number is correct, then tap Resend once the timer ends. If the OTP still does not arrive, contact our support team.",
        },
        {
          q: "The phone number pop-up does not appear on my phone. Why?",
          a: "The pop-up only appears when your SIM and carrier share the number with Android. If it does not appear, type your number manually. Login works the same way.",
        },
        {
          q: "Can I use the same account on the app and the website?",
          a: "Yes. Log in with the same mobile number and your purchases and progress will be available on both.",
        },
      ],
      content: [
        {
          q: "Does Clear Cutoff cover both Paper 1 and Paper 2?",
          a: "Yes, Clear Cutoff covers both Paper 1 and Paper 2 with PYQs, notes and video lectures for every subject.",
        },
        {
          q: "What kind of tests are available?",
          a: "You can practise exam-level questions, sectional tests and full-length papers, all built around previous year questions.",
        },
        {
          q: "Can I use the app in Hindi?",
          a: "Yes. The app works in both Hindi and English, so you can prepare in whichever language you're comfortable with.",
        },
        {
          q: "Does the app work offline?",
          a: "Some downloaded content can be accessed offline, but features like live tests and syncing your progress need an internet connection.",
        },
        {
          q: "Does Clear Cutoff have tools for filling exam forms?",
          a: "Yes. A free photo and signature resizer and an age eligibility calculator are available at clearcutoff.in/tools.",
        },
      ],
      payments: [
        {
          q: "Is Clear Cutoff free?",
          a: "Downloading the Android app is free. Free video lectures and other free learning resources are available. Some content or features may have separate access requirements.",
        },
        {
          q: "How do I cancel my subscription?",
          a: "You can cancel at any time. After cancelling, you keep access until the end of your current subscription cycle.",
        },
        {
          q: "What is the refund policy?",
          a: "You are eligible for a refund if you are not receiving the services. Email your request to hi@clearcutoff.in. Approved refunds are processed within 7 days to the original payment mode and may take 3–5 business days to reflect in your bank account.",
        },
        {
          q: "My payment was deducted but my plan is not active. What should I do?",
          a: "Close and reopen the app, and check that you are logged in with the number you paid from. If the plan is still not active, send your payment screenshot and mobile number to our support team.",
        },
      ],
      support: [
        {
          q: "Why am I not getting notifications?",
          a: "Go to your phone's Settings > Apps > Clear Cutoff > Notifications and turn them on. On Android 13 and above, also tap Allow when the app asks for notification permission.",
        },
        {
          q: "How do I contact support?",
          a: "Call or WhatsApp us on 7210708599, or email hi@clearcutoff.in.",
        },
      ],
    },
  },
  hi: {
    eyebrow: "अक्सर पूछे जाने वाले प्रश्न",
    heading: "कोई प्रश्न हैं?",
    description: "ऐप डाउनलोड करने से पहले जानने योग्य कुछ बातें।",
    filters: [
      { label: "शुरुआत करें", key: "gettingStarted" },
      { label: "लॉगिन और अकाउंट", key: "login" },
      { label: "कंटेंट और फीचर्स", key: "content" },
      { label: "प्लान और पेमेंट", key: "payments" },
      { label: "नोटिफिकेशन और सहायता", key: "support" },
    ],
    faqs: {
      gettingStarted: [
        {
          q: "Clear Cutoff ऐप क्या है?",
          a: "Clear Cutoff शिक्षक भर्ती और पात्रता परीक्षाओं की तैयारी का ऐप है। इसमें वीडियो लेक्चर, PYQs, रिवीजन नोट्स और फुल-लेंथ टेस्ट सीरीज़ एक ही जगह आपके एंड्रॉइड फोन पर मिलती हैं।",
        },
        {
          q: "ऐप किन TET परीक्षाओं को सपोर्ट करता है?",
          a: "ऐप CTET, REET, HTET, UPTET और अन्य राज्य-स्तरीय TET परीक्षाओं को सपोर्ट करता है, और समय के साथ और परीक्षाएं जोड़ी जा रही हैं।",
        },
        {
          q: "ऐप कहां से डाउनलोड करें?",
          a: 'Google Play Store पर "Clear Cutoff" सर्च करें और Install पर टैप करें।',
        },
        {
          q: "ऐप किन एंड्रॉइड फोन पर चलता है?",
          a: "ऐप ज़्यादातर एंड्रॉइड फोन पर चलता है। न्यूनतम एंड्रॉइड वर्ज़न आप Play Store लिस्टिंग पर देख सकते हैं। बेहतर अनुभव के लिए ऐप को अपडेट रखें।",
        },
      ],
      login: [
        {
          q: "लॉग इन कैसे करें?",
          a: "अपना मोबाइल नंबर डालें और भेजे गए OTP से वेरिफाई करें। सपोर्टेड फोन पर ऐप आपका नंबर सुझा सकता है और OTP अपने आप भर सकता है।",
        },
        {
          q: "मुझे OTP नहीं मिला। क्या करूं?",
          a: "जांचें कि आपका मोबाइल नंबर सही है, फिर टाइमर खत्म होने पर Resend पर टैप करें। अगर फिर भी OTP न आए, तो हमारी सपोर्ट टीम से संपर्क करें।",
        },
        {
          q: "मेरे फोन पर फोन नंबर वाला पॉप-अप नहीं आ रहा। क्यों?",
          a: "पॉप-अप तभी आता है जब आपका SIM और नेटवर्क ऑपरेटर नंबर को एंड्रॉइड के साथ शेयर करते हैं। अगर यह न आए, तो अपना नंबर खुद टाइप करें। लॉगिन उसी तरह काम करता है।",
        },
        {
          q: "क्या मैं ऐप और वेबसाइट पर एक ही अकाउंट इस्तेमाल कर सकता हूं?",
          a: "हां। उसी मोबाइल नंबर से लॉग इन करें और आपकी खरीदारी और प्रोग्रेस दोनों जगह उपलब्ध रहेगी।",
        },
      ],
      content: [
        {
          q: "क्या Clear Cutoff पेपर 1 और पेपर 2 दोनों को कवर करता है?",
          a: "हां, Clear Cutoff हर विषय के लिए PYQs, नोट्स और वीडियो लेक्चर के साथ पेपर 1 और पेपर 2 दोनों को कवर करता है।",
        },
        {
          q: "किस तरह के टेस्ट उपलब्ध हैं?",
          a: "आप परीक्षा-स्तर के प्रश्न, सेक्शनल टेस्ट और फुल-लेंथ पेपर की प्रैक्टिस कर सकते हैं, जो पिछले वर्षों के प्रश्नों पर आधारित हैं।",
        },
        {
          q: "क्या मैं ऐप को हिंदी में उपयोग कर सकता हूं?",
          a: "हां। ऐप हिंदी और अंग्रेज़ी दोनों में काम करता है, ताकि आप अपनी पसंदीदा भाषा में तैयारी कर सकें।",
        },
        {
          q: "क्या ऐप ऑफलाइन काम करता है?",
          a: "कुछ डाउनलोड किया गया कंटेंट ऑफलाइन एक्सेस किया जा सकता है, लेकिन लाइव टेस्ट और प्रोग्रेस सिंक जैसे फीचर्स के लिए इंटरनेट आवश्यक है।",
        },
        {
          q: "क्या Clear Cutoff में परीक्षा फॉर्म भरने के लिए टूल्स हैं?",
          a: "हां। फ्री फोटो और हस्ताक्षर रीसाइज़र और आयु पात्रता कैलकुलेटर clearcutoff.in/tools पर उपलब्ध हैं।",
        },
      ],
      payments: [
        {
          q: "क्या Clear Cutoff फ्री है?",
          a: "एंड्रॉइड ऐप डाउनलोड करना फ्री है। फ्री वीडियो लेक्चर और अन्य फ्री लर्निंग रिसोर्स उपलब्ध हैं। कुछ कंटेंट या फीचर्स के लिए अलग एक्सेस आवश्यकताएं हो सकती हैं।",
        },
        {
          q: "मैं अपना सब्सक्रिप्शन कैसे कैंसल करूं?",
          a: "आप कभी भी कैंसल कर सकते हैं। कैंसल करने के बाद भी मौजूदा सब्सक्रिप्शन साइकल खत्म होने तक आपका एक्सेस बना रहता है।",
        },
        {
          q: "रिफंड पॉलिसी क्या है?",
          a: "अगर आपको सेवाएं नहीं मिल रही हैं, तो आप रिफंड के पात्र हैं। अपना अनुरोध hi@clearcutoff.in पर ईमेल करें। मंज़ूर किए गए रिफंड 7 दिनों के भीतर मूल पेमेंट मोड में प्रोसेस होते हैं और बैंक खाते में दिखने में 3–5 कार्यदिवस लग सकते हैं।",
        },
        {
          q: "मेरा पेमेंट कट गया लेकिन प्लान एक्टिव नहीं हुआ। क्या करूं?",
          a: "ऐप बंद करके दोबारा खोलें और जांचें कि आप उसी नंबर से लॉग इन हैं जिससे पेमेंट किया था। अगर प्लान फिर भी एक्टिव न हो, तो पेमेंट का स्क्रीनशॉट और मोबाइल नंबर हमारी सपोर्ट टीम को भेजें।",
        },
      ],
      support: [
        {
          q: "मुझे नोटिफिकेशन क्यों नहीं मिल रहे?",
          a: "अपने फोन की Settings > Apps > Clear Cutoff > Notifications में जाकर उन्हें चालू करें। एंड्रॉइड 13 और उससे ऊपर के वर्ज़न पर, जब ऐप नोटिफिकेशन की अनुमति मांगे तो Allow पर भी टैप करें।",
        },
        {
          q: "सपोर्ट से संपर्क कैसे करें?",
          a: "हमें 7210708599 पर कॉल या WhatsApp करें, या hi@clearcutoff.in पर ईमेल करें।",
        },
      ],
    },
  },
  mr: {
    eyebrow: "वारंवार विचारले जाणारे प्रश्न",
    heading: "काही प्रश्न आहेत?",
    description: "अ‍ॅप डाउनलोड करण्यापूर्वी जाणून घेण्यासारख्या काही गोष्टी.",
    filters: [
      { label: "सुरुवात", key: "gettingStarted" },
      { label: "लॉगिन आणि अकाउंट", key: "login" },
      { label: "कंटेंट आणि फीचर्स", key: "content" },
      { label: "प्लॅन आणि पेमेंट", key: "payments" },
      { label: "नोटिफिकेशन आणि मदत", key: "support" },
    ],
    faqs: {
      gettingStarted: [
        {
          q: "Clear Cutoff अ‍ॅप काय आहे?",
          a: "Clear Cutoff हे शिक्षक भरती आणि पात्रता परीक्षांच्या तयारीसाठीचे अ‍ॅप आहे. यात व्हिडिओ लेक्चर्स, PYQs, रिव्हिजन नोट्स आणि फुल-लेंथ टेस्ट सिरीज एकाच ठिकाणी तुमच्या अँड्रॉइड फोनवर मिळतात.",
        },
        {
          q: "अ‍ॅप कोणत्या TET परीक्षांना सपोर्ट करते?",
          a: "अ‍ॅप CTET, REET, HTET, UPTET आणि इतर राज्यस्तरीय TET परीक्षांना सपोर्ट करते, आणि कालांतराने आणखी परीक्षा जोडल्या जात आहेत.",
        },
        {
          q: "अ‍ॅप कुठून डाउनलोड करायचे?",
          a: 'Google Play Store वर "Clear Cutoff" शोधा आणि Install वर टॅप करा.',
        },
        {
          q: "अ‍ॅप कोणत्या अँड्रॉइड फोनवर चालते?",
          a: "अ‍ॅप बहुतेक अँड्रॉइड फोनवर चालते. किमान अँड्रॉइड व्हर्जन तुम्ही Play Store लिस्टिंगवर पाहू शकता. चांगल्या अनुभवासाठी अ‍ॅप अपडेट ठेवा.",
        },
      ],
      login: [
        {
          q: "लॉग इन कसे करायचे?",
          a: "तुमचा मोबाइल नंबर टाका आणि पाठवलेल्या OTP ने व्हेरिफाय करा. सपोर्टेड फोनवर अ‍ॅप तुमचा नंबर सुचवू शकते आणि OTP आपोआप भरू शकते.",
        },
        {
          q: "मला OTP मिळाला नाही. काय करावे?",
          a: "तुमचा मोबाइल नंबर बरोबर आहे का ते तपासा, नंतर टाइमर संपल्यावर Resend वर टॅप करा. तरीही OTP न आल्यास आमच्या सपोर्ट टीमशी संपर्क साधा.",
        },
        {
          q: "माझ्या फोनवर फोन नंबरचा पॉप-अप दिसत नाही. का?",
          a: "तुमचे SIM आणि नेटवर्क ऑपरेटर नंबर अँड्रॉइडसोबत शेअर करतात तेव्हाच पॉप-अप दिसतो. तो न दिसल्यास तुमचा नंबर स्वतः टाइप करा. लॉगिन त्याच पद्धतीने काम करते.",
        },
        {
          q: "मी अ‍ॅप आणि वेबसाइटवर एकच अकाउंट वापरू शकतो का?",
          a: "होय. त्याच मोबाइल नंबरने लॉग इन करा आणि तुमची खरेदी व प्रगती दोन्हीकडे उपलब्ध राहील.",
        },
      ],
      content: [
        {
          q: "Clear Cutoff पेपर 1 आणि पेपर 2 दोन्ही कव्हर करते का?",
          a: "होय, Clear Cutoff प्रत्येक विषयासाठी PYQs, नोट्स आणि व्हिडिओ लेक्चर्ससह पेपर 1 आणि पेपर 2 दोन्ही कव्हर करते.",
        },
        {
          q: "कोणत्या प्रकारच्या टेस्ट उपलब्ध आहेत?",
          a: "तुम्ही परीक्षा-स्तरीय प्रश्न, सेक्शनल टेस्ट आणि फुल-लेंथ पेपर्सचा सराव करू शकता, जे मागील वर्षांच्या प्रश्नांवर आधारित आहेत.",
        },
        {
          q: "मी अ‍ॅप हिंदीत वापरू शकतो का?",
          a: "होय. अ‍ॅप हिंदी आणि इंग्रजी दोन्हीमध्ये काम करते, त्यामुळे तुम्ही तुमच्या सोयीच्या भाषेत तयारी करू शकता.",
        },
        {
          q: "अ‍ॅप ऑफलाइन काम करते का?",
          a: "काही डाउनलोड केलेला कंटेंट ऑफलाइन अ‍ॅक्सेस करता येतो, पण लाइव्ह टेस्ट आणि प्रगती सिंक करण्यासारख्या फीचर्ससाठी इंटरनेट आवश्यक आहे.",
        },
        {
          q: "Clear Cutoff मध्ये परीक्षा फॉर्म भरण्यासाठी टूल्स आहेत का?",
          a: "होय. मोफत फोटो व स्वाक्षरी रीसायझर आणि वय पात्रता कॅल्क्युलेटर clearcutoff.in/tools वर उपलब्ध आहेत.",
        },
      ],
      payments: [
        {
          q: "Clear Cutoff मोफत आहे का?",
          a: "अँड्रॉइड अ‍ॅप डाउनलोड करणे मोफत आहे. मोफत व्हिडिओ लेक्चर्स आणि इतर मोफत शिक्षण संसाधने उपलब्ध आहेत. काही कंटेंट किंवा फीचर्ससाठी वेगळ्या अ‍ॅक्सेस आवश्यकता असू शकतात.",
        },
        {
          q: "मी माझे सबस्क्रिप्शन कसे रद्द करू?",
          a: "तुम्ही कधीही रद्द करू शकता. रद्द केल्यानंतरही चालू सबस्क्रिप्शन सायकल संपेपर्यंत तुमचा अ‍ॅक्सेस कायम राहतो.",
        },
        {
          q: "रिफंड पॉलिसी काय आहे?",
          a: "तुम्हाला सेवा मिळत नसल्यास तुम्ही रिफंडसाठी पात्र आहात. तुमची विनंती hi@clearcutoff.in वर ईमेल करा. मंजूर झालेले रिफंड 7 दिवसांत मूळ पेमेंट पद्धतीत प्रोसेस केले जातात आणि बँक खात्यात दिसण्यासाठी 3–5 कामकाजाचे दिवस लागू शकतात.",
        },
        {
          q: "माझे पेमेंट कापले गेले पण प्लॅन अ‍ॅक्टिव्ह झाला नाही. काय करावे?",
          a: "अ‍ॅप बंद करून पुन्हा उघडा आणि ज्या नंबरवरून पेमेंट केले त्याच नंबरने लॉग इन आहात का ते तपासा. तरीही प्लॅन अ‍ॅक्टिव्ह न झाल्यास पेमेंटचा स्क्रीनशॉट आणि मोबाइल नंबर आमच्या सपोर्ट टीमला पाठवा.",
        },
      ],
      support: [
        {
          q: "मला नोटिफिकेशन का मिळत नाहीत?",
          a: "तुमच्या फोनच्या Settings > Apps > Clear Cutoff > Notifications मध्ये जाऊन ते चालू करा. अँड्रॉइड 13 आणि त्यावरील व्हर्जनवर, अ‍ॅपने नोटिफिकेशनची परवानगी मागितल्यावर Allow वरही टॅप करा.",
        },
        {
          q: "सपोर्टशी संपर्क कसा साधायचा?",
          a: "आम्हाला 7210708599 वर कॉल किंवा WhatsApp करा, किंवा hi@clearcutoff.in वर ईमेल करा.",
        },
      ],
    },
  },
};

// Mechanical platform-word swap — Android -> iOS, Play Store -> App Store —
// applied to every string in the Android content so the iOS page shows
// exactly the same content/structure with only the platform word changed,
// never hand-duplicated (so the two pages can't drift apart).
function swapToIos(text: string): string {
  return text
    .replace(/Google Play Store/g, "App Store")
    .replace(/Play Store/g, "App Store")
    .replace(/Android/g, "iOS")
    .replace(/एंड्रॉइड/g, "iOS")
    .replace(/अँड्रॉइड/g, "iOS");
}

function toIosContent(content: AppFaqContent): AppFaqContent {
  return {
    eyebrow: swapToIos(content.eyebrow),
    heading: swapToIos(content.heading),
    description: swapToIos(content.description),
    filters: content.filters.map((f) => ({ ...f, label: swapToIos(f.label) })),
    faqs: Object.fromEntries(
      (Object.entries(content.faqs) as [FAQKey, FAQ[]][]).map(([key, items]) => [
        key,
        items.map((item) => ({ q: swapToIos(item.q), a: swapToIos(item.a) })),
      ]),
    ) as Record<FAQKey, FAQ[]>,
  };
}

const CONTENT: Record<AppPlatform, Record<Locale, AppFaqContent>> = {
  android: ANDROID_CONTENT,
  ios: {
    en: toIosContent(ANDROID_CONTENT.en),
    hi: toIosContent(ANDROID_CONTENT.hi),
    mr: toIosContent(ANDROID_CONTENT.mr),
  },
};

export default function AppDownloadFaqSection({
  platform,
  locale = defaultLocale,
}: {
  platform: AppPlatform;
  locale?: Locale;
}) {
  const t = CONTENT[platform][locale];
  const [activeTab, setActiveTab] = React.useState<FAQKey>(t.filters[0]?.key ?? "gettingStarted");
  const containerRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const { markUserAction } = useScrollOnUserAction({
    activeId: activeTab,
    refs: tabRefs,
    containerRef,
    enabled: true,
    getIndex: (id) => t.filters.findIndex((f) => f.key === id),
  });

  const items: AccordionItem[] = (t.faqs[activeTab] ?? []).map((faq, index) => ({
    id: `app-download-faq-${activeTab}-${index}`,
    title: faq.q,
    content: faq.a,
  }));

  return (
    <Section sectionId="app-download-faqs-section" maxWidth="max-w-[900px]" padding="py-ym-section md:py-yd-section px-3 scroll-mt-16 md:scroll-mt-12">
      <div className="flex flex-col gap-6">
        <HeaderBlock
          eyebrow={{ text: t.eyebrow }}
          heading={{ text: t.heading }}
          description={{ text: t.description }}
          eyebrowOptions={{ alignMobile: "center", alignDesktop: "center" }}
          headingOptions={{ alignMobile: "center", alignDesktop: "center", font: "display-medium !font-bold" }}
          descriptionOptions={{ alignMobile: "center", alignDesktop: "center" }}
          containerClassName="mx-auto text-center"
        />

        <div className="flex justify-center w-full px-3 md:px-2">
          <div ref={containerRef} className="inline-flex max-w-full bg-brand-dark py-1 px-1 overflow-x-auto rounded-full relative">
            {t.filters.map((filter, index) => {
              const isActive = activeTab === filter.key;
              return (
                <button
                  key={filter.key}
                  ref={(el) => { tabRefs.current[index] = el; }}
                  onClick={() => { markUserAction(); setActiveTab(filter.key); }}
                  className="relative px-4 py-1.5 flex justify-center items-center rounded-sm whitespace-nowrap z-10 cursor-pointer"
                >
                  {isActive && (
                    <motion.div layoutId="app-download-faq-active-pill" className="absolute inset-0 bg-white rounded-full shadow-sm" transition={{ type: "spring", stiffness: 500, damping: 35 }} />
                  )}
                  <span className={`relative body-medium ${isActive ? "text-text-gray-normal !font-semibold" : "text-white"}`}>
                    {filter.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <FAQAccordion items={items} defaultOpenId={items[0]?.id} />
      </div>
    </Section>
  );
}
