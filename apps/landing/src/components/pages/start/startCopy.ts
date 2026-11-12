import type { Locale } from "@/lib/i18n/config";

/**
 * Nibbu's speech-bubble lines and the new page chrome for /start (phase 101).
 * en = the prototype's Hinglish lines verbatim (user decision 2026-11-12),
 * hi = Devanagari, mr = Marathi. Validation / error messages stay in
 * StartAuthForm's CONTENT (logic unchanged).
 */
export type StartCopy = {
  say: {
    hello: string;
    idle: [string, string, string];
    tap: string;
    focus: string;
    typing: (n: number) => string;
    pause: (n: number) => string;
    badStart: string;
    short: (n: number) => string;
    empty: string;
    valid: string;
    ready: string;
    sendFail: string;
    otp: string;
    otpIdle: string;
    otpType: (n: number) => string;
    otpShort: string;
    otpCheck: string;
    otpWrong: string;
    resent: string;
    done: string;
    back: string;
    exit: string;
  };
  stepOf: (n: number) => string;
  stepDone: string;
  headingBefore: string;
  headingAccent: string;
  headingAfter: string;
  sub: string;
  sending: string;
  tryAgain: string;
  perkTrial: string;
  perkNoCard: string;
  otpHeading: string;
  sentTo: string;
  change: string;
  verifyStart: string;
  verifying: string;
  verified: string;
  didntGet: string;
  doneHeading: string;
  doneSub: string;
  mascotLabel: string;
};

export const START_COPY: Record<Locale, StartCopy> = {
  en: {
    say: {
      hello: "Namaste! Number daalo, FREE padhai shuru karo 👇",
      idle: [
        "Arre, ruk kyun gaye? Bas apna number likho 👇",
        "Sirf 10 second lagenge. 3 din bilkul FREE!",
        "10,000+ students padh rahe hain. Aap bhi aa jao!",
      ],
      tap: "Hehe! Chalo, yahan number likho 👇",
      focus: "Badhiya! 10 digit ka number likho",
      typing: (n) => `Bahut badhiya! Bas ${n} digit aur…`,
      pause: (n) => `Ruko mat! Sirf ${n} digit baaki hain`,
      badStart: "Oho! Number 6, 7, 8 ya 9 se shuru hota hai",
      short: (n) => `${n} digit kam hain. Poora number likho`,
      empty: "Pehle apna mobile number likho 👇",
      valid: "Shabaash! OTP bhej raha hoon…",
      ready: "Number sahi hai! Ab button dabao 👇",
      sendFail: "OTP nahi gaya. Internet check karke dobara try karo",
      otp: "OTP bhej diya! SMS ya WhatsApp dekho",
      otpIdle: "OTP nahi aaya? Thoda ruko, phir Resend dabao",
      otpType: (n) => `Bas ${n} digit aur…`,
      otpShort: "Poore 4 digit likho",
      otpCheck: "Check kar raha hoon…",
      otpWrong: "Yeh OTP galat hai. Naya message dekh kar dobara likho",
      resent: "Naya OTP bhej diya! Message dekho",
      done: "Badhai ho! Aapki padhai shuru 🎉",
      back: "Wapas aa gaye! Chalo, shuru karte hain 👇",
      exit: "Ruko! 3 din FREE hai, card bhi nahi chahiye",
    },
    stepOf: (n) => `Step ${n} of 2`,
    stepDone: "Done",
    headingBefore: "Start your ",
    headingAccent: "FREE",
    headingAfter: " preparation",
    sub: "Everything for your teaching exam, in one place.",
    sending: "Sending OTP…",
    tryAgain: "Try again",
    perkTrial: "✓ 3-day FREE trial",
    perkNoCard: "✓ No card or payment needed",
    otpHeading: "Enter the 4-digit OTP",
    sentTo: "Sent to",
    change: "Change",
    verifyStart: "Verify & Start",
    verifying: "Verifying…",
    verified: "Verified",
    didntGet: "Didn't get it?",
    doneHeading: "Number verified!",
    doneSub: "Your 3-day FREE trial has started. Taking you to your preparation…",
    mascotLabel: "Nibbu: tap to enter your mobile number",
  },
  hi: {
    say: {
      hello: "नमस्ते! नंबर डालो, FREE पढ़ाई शुरू करो 👇",
      idle: [
        "अरे, रुक क्यों गए? बस अपना नंबर लिखो 👇",
        "सिर्फ़ 10 सेकंड लगेंगे। 3 दिन बिल्कुल FREE!",
        "10,000+ छात्र पढ़ रहे हैं। आप भी आ जाओ!",
      ],
      tap: "हेहे! चलो, यहाँ नंबर लिखो 👇",
      focus: "बढ़िया! 10 अंकों का नंबर लिखो",
      typing: (n) => `बहुत बढ़िया! बस ${n} अंक और…`,
      pause: (n) => `रुको मत! सिर्फ़ ${n} अंक बाकी हैं`,
      badStart: "ओहो! नंबर 6, 7, 8 या 9 से शुरू होता है",
      short: (n) => `${n} अंक कम हैं। पूरा नंबर लिखो`,
      empty: "पहले अपना मोबाइल नंबर लिखो 👇",
      valid: "शाबाश! OTP भेज रहा हूँ…",
      ready: "नंबर सही है! अब बटन दबाओ 👇",
      sendFail: "OTP नहीं गया। इंटरनेट चेक करके दोबारा कोशिश करो",
      otp: "OTP भेज दिया! SMS या WhatsApp देखो",
      otpIdle: "OTP नहीं आया? थोड़ा रुको, फिर Resend दबाओ",
      otpType: (n) => `बस ${n} अंक और…`,
      otpShort: "पूरे 4 अंक लिखो",
      otpCheck: "चेक कर रहा हूँ…",
      otpWrong: "यह OTP गलत है। नया मैसेज देखकर दोबारा लिखो",
      resent: "नया OTP भेज दिया! मैसेज देखो",
      done: "बधाई हो! आपकी पढ़ाई शुरू 🎉",
      back: "वापस आ गए! चलो, शुरू करते हैं 👇",
      exit: "रुको! 3 दिन FREE है, कार्ड भी नहीं चाहिए",
    },
    stepOf: (n) => `चरण ${n} / 2`,
    stepDone: "पूरा",
    headingBefore: "अपनी ",
    headingAccent: "FREE",
    headingAfter: " तैयारी शुरू करें",
    sub: "आपकी टीचिंग परीक्षा के लिए सब कुछ, एक ही जगह।",
    sending: "OTP भेजा जा रहा है…",
    tryAgain: "फिर से कोशिश करें",
    perkTrial: "✓ 3 दिन का FREE ट्रायल",
    perkNoCard: "✓ कोई कार्ड या पेमेंट नहीं",
    otpHeading: "4 अंकों का OTP डालें",
    sentTo: "भेजा गया",
    change: "बदलें",
    verifyStart: "वेरीफाई करें और शुरू करें",
    verifying: "वेरीफाई हो रहा है…",
    verified: "वेरीफाई हो गया",
    didntGet: "OTP नहीं मिला?",
    doneHeading: "नंबर वेरीफाई हो गया!",
    doneSub: "आपका 3 दिन का FREE ट्रायल शुरू हो गया। आपकी तैयारी पर ले जा रहे हैं…",
    mascotLabel: "निब्बू: मोबाइल नंबर डालने के लिए टैप करें",
  },
  mr: {
    say: {
      hello: "नमस्कार! नंबर टाका, FREE अभ्यास सुरू करा 👇",
      idle: [
        "अरे, थांबलात का? फक्त तुमचा नंबर लिहा 👇",
        "फक्त 10 सेकंद लागतील. 3 दिवस पूर्ण FREE!",
        "10,000+ विद्यार्थी शिकत आहेत. तुम्हीपण या!",
      ],
      tap: "हेहे! चला, इथे नंबर लिहा 👇",
      focus: "छान! 10 अंकी नंबर लिहा",
      typing: (n) => `खूप छान! फक्त ${n} अंक अजून…`,
      pause: (n) => `थांबू नका! फक्त ${n} अंक बाकी आहेत`,
      badStart: "अरेच्चा! नंबर 6, 7, 8 किंवा 9 ने सुरू होतो",
      short: (n) => `${n} अंक कमी आहेत. पूर्ण नंबर लिहा`,
      empty: "आधी तुमचा मोबाईल नंबर लिहा 👇",
      valid: "शाब्बास! OTP पाठवतोय…",
      ready: "नंबर बरोबर आहे! आता बटण दाबा 👇",
      sendFail: "OTP गेला नाही. इंटरनेट तपासून पुन्हा प्रयत्न करा",
      otp: "OTP पाठवला! SMS किंवा WhatsApp पाहा",
      otpIdle: "OTP आला नाही? थोडं थांबा, मग Resend दाबा",
      otpType: (n) => `फक्त ${n} अंक अजून…`,
      otpShort: "पूर्ण 4 अंक लिहा",
      otpCheck: "तपासतोय…",
      otpWrong: "हा OTP चुकीचा आहे. नवीन मेसेज पाहून पुन्हा लिहा",
      resent: "नवीन OTP पाठवला! मेसेज पाहा",
      done: "अभिनंदन! तुमचा अभ्यास सुरू 🎉",
      back: "परत आलात! चला, सुरू करूया 👇",
      exit: "थांबा! 3 दिवस FREE आहे, कार्डपण लागत नाही",
    },
    stepOf: (n) => `पायरी ${n} / 2`,
    stepDone: "पूर्ण",
    headingBefore: "तुमची ",
    headingAccent: "FREE",
    headingAfter: " तयारी सुरू करा",
    sub: "तुमच्या शिक्षक परीक्षेसाठी सर्वकाही, एकाच ठिकाणी.",
    sending: "OTP पाठवत आहे…",
    tryAgain: "पुन्हा प्रयत्न करा",
    perkTrial: "✓ 3 दिवसांची FREE ट्रायल",
    perkNoCard: "✓ कार्ड किंवा पेमेंट नको",
    otpHeading: "4 अंकी OTP टाका",
    sentTo: "पाठवला",
    change: "बदला",
    verifyStart: "पडताळा आणि सुरू करा",
    verifying: "पडताळत आहे…",
    verified: "पडताळले",
    didntGet: "OTP मिळाला नाही?",
    doneHeading: "नंबर पडताळला!",
    doneSub: "तुमची 3 दिवसांची FREE ट्रायल सुरू झाली. तुमच्या तयारीकडे नेत आहोत…",
    mascotLabel: "निब्बू: मोबाईल नंबर टाकण्यासाठी टॅप करा",
  },
};
