export type Locale = "en" | "hi";

// Central dictionary for every static UI string in this app. Kept as one
// flat object (not next-intl) deliberately — apps/tools is a static export
// with no server/middleware, so it can't use the proxy.ts-based routing the
// other three apps share (see CLAUDE.md "apps/tools deployment"). Hindi
// pages instead live under a literal /hi route tree (app/hi/...), each
// passing locale="hi" into these same components — one component per
// concern, not a duplicated Hindi copy of every file.
//
// Exam short names (HTET, UPSC, ...) are deliberately NOT translated here —
// they're proper-noun abbreviations, kept Roman on both locales, matching
// how every competitor and official notification refers to them.
const DICTIONARY = {
  en: {
    presets: {
      photo: { label: "Photo", sublabel: "Passport size" },
      signature: { label: "Add Name", sublabel: "With name & date" },
      custom: { label: "Custom", sublabel: "Your own size" },
      draw: { label: "Signature", sublabel: "Draw or upload" },
      thumb: { label: "Left Thumb", sublabel: "Impression scan" },
    },
    tool: {
      configuration: "Configuration",
      documentType: "Document type",
      unit: "Unit",
      width: (unit: string) => `Width (${unit})`,
      height: (unit: string) => `Height (${unit})`,
      minSizeKB: "Min size (KB)",
      maxSizeKB: "Max size (KB)",
      imageRequirements: "Image Requirements",
      dimensions: "Dimensions",
      size: "Size",
      format: "Format",
      imageAdjustments: "Image Adjustments",
      brightness: "Brightness",
      contrast: "Contrast",
      signatureCleanUp: "Signature Clean Up",
      signatureCleanUpHint: "Whitens paper shadows and darkens faint ink.",
      nameOrDateRequired: "Name or Date required",
      nameBlockLettersLabel: "Name (Block Letters)",
      namePlaceholder: "Enter your full name",
      dateOfPhotoLabel: "Date of Photo",
      includeDateLabel: "Include Date",
      resizeSettingsLabel: "Resize Settings",
      optionalBadge: "OPTIONAL",
      keepOriginalDimensionsHint: "Leave unchecked to keep original dimensions.",
      privacyFirst: "Privacy First: your photos are processed locally in your browser and never uploaded.",
      fastSecure: "Fast & Secure: image processing happens instantly on your device. No waiting, no uploads.",
      uploadProcess: "Upload & Process",
      cropAdjust: "Crop & Adjust",
      yourOptimizedImage: "Your optimized image",
      drawSignature: "Draw signature",
      uploadImage: "Upload image",
      signHere: "Sign here with your mouse or finger",
      clear: "Clear",
      useThisSignature: "Use this signature",
      clickToUpload: "Click to upload or drag and drop",
      acceptedFormats: (mb: number) => `JPG, PNG, WEBP, or HEIC up to ${mb}MB`,
      dragToReposition: "Drag the box to reposition, corners to resize",
      reset: "Reset",
      cancel: "Cancel",
      applyOptimize: "Apply & Optimize",
      statusAnalyzing: "Analyzing image…",
      statusResizing: "Resizing…",
      statusCompressing: "Compressing…",
      original: "Original",
      ready: "Ready",
      checkSize: "Check size",
      perfectMatch: "✓ Perfect Match! Image meets all exam requirements.",
      outsideTarget: "⚠ Outside target range. Try adjusting the sliders above.",
      downloadImage: "Download Image",
      autoRenamedPrefix: "Auto-renamed to",
      autoRenamedSuffix: "for error-free portal upload.",
      share: "Share",
      copied: "Copied!",
      processAnother: "Process Another",
      errorHeic: "Could not convert this HEIC photo. Please try a JPG or PNG instead.",
      errorFileType: "Please choose a JPG, PNG, WEBP, or HEIC image.",
      errorFileSize: (mb: number) => `Please choose an image under ${mb}MB.`,
      errorInvalidValues: "Enter valid width, height, and size values.",
      errorReadImage: "Could not read this image.",
      errorProcessImage: "Could not process this image.",
      errorGeneric: "Something went wrong. Please try again.",
      loadingImage: "Loading image…",
    },
    hub: {
      badgeFree: "100% Free & Private",
      badgePrivacy: "Privacy Certified",
      h1: "Exam-Ready Photos & Signatures in Seconds",
      lead: "Resize and compress your photo or signature for CTET, HTET, UPTET and more. Processed right in your browser, nothing is ever uploaded.",
      howItWorksTitle: "How it works",
      howItWorksLead: "Get your exam documents ready in 3 simple steps. No technical skills required.",
      steps: [
        {
          title: "1. Choose your document type",
          description: "Pick Photo or Signature and we automatically load the right dimensions and file size limit.",
        },
        {
          title: "2. Upload & process",
          description: "Drop in your photo or signature. Resizing and compression happen instantly, right in your browser.",
        },
        {
          title: "3. Download",
          description: "Preview the optimized result and download it. Your file never leaves your device.",
        },
      ],
    },
    moreTools: {
      title: "More tools",
      items: {
        addNameDate: { label: "Add Name & Date", sublabel: "Stamp name/date on a photo" },
        imageCompressor: { label: "Image Compressor", sublabel: "Hit an exact KB range" },
        signatureCompressor: { label: "Signature Compressor", sublabel: "Clean up & compress ink" },
        faceCoverage: { label: "75% Face Coverage", sublabel: "Positioning guide" },
      },
    },
    modeTabs: {
      imageResizer: "Image Resizer",
      addNameDate: "Add Name & Date",
    },
    spoke: {
      h1: (shortName: string) => `${shortName} Photo & Signature Resizer`,
      lead: (shortName: string, fullName: string) =>
        `Resize and compress your photo or signature to the ${shortName} (${fullName}) application-form requirements. Processed right in your browser, nothing is ever uploaded.`,
      specsTitle: (shortName: string) => `${shortName} photo & signature specifications`,
      specDocument: "Document",
      specFileSize: "File size",
      specPhoto: "Photo",
      specSignature: "Signature",
      faqsTitle: (shortName: string) => `${shortName} resizer FAQs`,
      differentExamPrompt: "Preparing for a different exam?",
      useGeneralResizer: "Use the general resizer",
      relatedToolsBadge: "Related tools",
      relatedToolsTitlePrefix: "Also resize for",
      relatedToolsTitleSuffix: "exams",
      relatedToolsLead: (categoryLabel: string) =>
        `Preparing for multiple exams? Resize your photo and signature for other ${categoryLabel} exams instantly.`,
      officialRequirementsPrefix: "Official Requirements for",
      administeredBy: "Administered by",
      officialGuidelines: "Official Guidelines",
      generalRequirements: "General Requirements",
      photographLabel: "Photograph",
      thumbImpressionLabel: "Thumb Impression",
    },
    category: {
      h1: (label: string) => `${label}: Photo & Signature Resizer`,
      lead: "Pick your exam below to load its exact photo & signature dimensions. Processed right in your browser, nothing is ever uploaded.",
      searchWithin: (label: string) => `Search within ${label}…`,
      differentCategoryPrompt: "Looking for a different category?",
      browseAllExams: "Browse all exams",
    },
    browse: {
      title: "Browse by exam",
      lead: "Every exam has its own photo & signature size. Search, or pick a category, then your exam.",
      searchPlaceholder: "Search your exam (e.g. UPSC, CTET, SBI PO)…",
      examCount: (count: number) => `${count} exam${count === 1 ? "" : "s"}`,
    },
    search: {
      noResults: (query: string) => `No exam matched "${query}". Try a different name, or browse below.`,
    },
    recentExams: {
      title: "Recently viewed",
    },
    addNameDatePage: {
      howItWorksTitle: "How it works",
      howItWorksLead: "Get your exam-ready photo in 3 simple steps. No technical skills required.",
      steps: [
        {
          title: "1. Upload your photo",
          description: "Upload the passport-size photo you want to stamp with your name and date. JPG, PNG, WEBP, and HEIC are all supported.",
        },
        {
          title: "2. Enter your details",
          description: "Type your name and pick a date — include just the name, just the date, or both, whichever your form asks for.",
        },
        {
          title: "3. Download",
          description: "Preview exactly how the stamped photo will look, then download it instantly in full quality.",
        },
      ],
      featuresTitle: "Name & date stamping, done right",
      featuresLead: "Create exam-ready photos with your name and date printed on them in seconds, no editing skills needed.",
      features: [
        { title: "Custom Text", description: "Print your full name in clear block letters, the format most official exam notifications ask for." },
        { title: "Date Stamping", description: "Add the date of the photo automatically. Pick any date, or use today's." },
        { title: "Exam Compliant", description: "Matches the plain black-text-on-white-background format SSC, UPSC, and other boards expect." },
        { title: "Instant Preview", description: "See exactly how your photo will look with the name and date before you download it." },
        { title: "Works on Mobile", description: "Stamp your photos right from your phone, no desktop needed." },
        { title: "Completely Free", description: "Stamp as many photos as you need, at no cost, with no hidden charges." },
      ],
      faqTitle: "Add Name & Date FAQs",
      faqs: [
        {
          q: "How do I add my name and date to a photo?",
          a: "Upload your photo, type your name and/or pick a date, and the tool stamps both onto the image instantly. You can download the result right away.",
        },
        {
          q: "Is this name and date format accepted for exam forms?",
          a: "The name prints in plain block letters and the date in DD/MM/YYYY format, on a white strip at the bottom of the photo, the layout most government exam portals expect. Always double-check against your own exam's official notification.",
        },
        {
          q: "Can I add only the date, or only the name?",
          a: "Yes. Leave the name field blank to stamp just the date, or leave \"Include Date\" unchecked to stamp just the name.",
        },
        {
          q: "Does this change my photo's dimensions?",
          a: "Not unless you turn on Resize Settings. By default, your photo keeps its original size, only the name/date text is added.",
        },
        {
          q: "Is my photo uploaded anywhere?",
          a: "No. Everything happens locally in your browser using the Canvas API. Your photo never leaves your device.",
        },
        {
          q: "Is this tool free to use?",
          a: "Yes, completely free, with no limit on how many photos you can stamp.",
        },
      ],
    },
    footer: {
      policy: "Policy",
      terms: "Terms & Conditions",
      refund: "Refund",
      contact: "Contact",
      whatsapp: "WhatsApp",
      copyright: (year: number) => `© ${year} Clear Cutoff. All rights reserved!`,
    },
  },
  hi: {
    presets: {
      photo: { label: "फोटो", sublabel: "पासपोर्ट साइज़" },
      signature: { label: "नाम जोड़ें", sublabel: "नाम और तारीख सहित" },
      custom: { label: "कस्टम", sublabel: "अपना खुद का साइज़" },
      draw: { label: "हस्ताक्षर", sublabel: "बनाएं या अपलोड करें" },
      thumb: { label: "बायां अंगूठा", sublabel: "इंप्रेशन स्कैन" },
    },
    tool: {
      configuration: "कॉन्फ़िगरेशन",
      documentType: "दस्तावेज़ का प्रकार",
      unit: "इकाई",
      width: (unit: string) => `चौड़ाई (${unit})`,
      height: (unit: string) => `ऊंचाई (${unit})`,
      minSizeKB: "न्यूनतम साइज़ (KB)",
      maxSizeKB: "अधिकतम साइज़ (KB)",
      imageRequirements: "इमेज आवश्यकताएं",
      dimensions: "आयाम",
      size: "साइज़",
      format: "फॉर्मेट",
      imageAdjustments: "इमेज एडजस्टमेंट",
      brightness: "ब्राइटनेस",
      contrast: "कॉन्ट्रास्ट",
      signatureCleanUp: "सिग्नेचर क्लीन अप",
      signatureCleanUpHint: "कागज़ की परछाई को सफ़ेद करता है और हल्की स्याही को गहरा करता है।",
      nameOrDateRequired: "नाम या तारीख आवश्यक",
      nameBlockLettersLabel: "नाम (ब्लॉक अक्षरों में)",
      namePlaceholder: "अपना पूरा नाम दर्ज करें",
      dateOfPhotoLabel: "फ़ोटो की तारीख",
      includeDateLabel: "तारीख शामिल करें",
      resizeSettingsLabel: "रिसाइज़ सेटिंग्स",
      optionalBadge: "वैकल्पिक",
      keepOriginalDimensionsHint: "मूल आयाम रखने के लिए अनचेक छोड़ें।",
      privacyFirst: "गोपनीयता पहले: आपकी फ़ोटो आपके ब्राउज़र में ही प्रोसेस होती है और कभी अपलोड नहीं होती।",
      fastSecure: "तेज़ और सुरक्षित: इमेज प्रोसेसिंग आपकी डिवाइस पर तुरंत होती है। न इंतज़ार, न अपलोड।",
      uploadProcess: "अपलोड करें और प्रोसेस करें",
      cropAdjust: "क्रॉप और एडजस्ट करें",
      yourOptimizedImage: "आपकी ऑप्टिमाइज़्ड इमेज",
      drawSignature: "हस्ताक्षर बनाएं",
      uploadImage: "इमेज अपलोड करें",
      signHere: "यहां माउस या उंगली से हस्ताक्षर करें",
      clear: "साफ़ करें",
      useThisSignature: "यह हस्ताक्षर उपयोग करें",
      clickToUpload: "अपलोड करने के लिए क्लिक करें या ड्रैग करें",
      acceptedFormats: (mb: number) => `JPG, PNG, WEBP, या HEIC, ${mb}MB तक`,
      dragToReposition: "स्थिति बदलने के लिए बॉक्स को ड्रैग करें, साइज़ बदलने के लिए कोनों को खींचें",
      reset: "रीसेट",
      cancel: "रद्द करें",
      applyOptimize: "लागू करें और ऑप्टिमाइज़ करें",
      statusAnalyzing: "इमेज का विश्लेषण हो रहा है…",
      statusResizing: "साइज़ बदला जा रहा है…",
      statusCompressing: "कंप्रेस किया जा रहा है…",
      original: "मूल",
      ready: "तैयार",
      checkSize: "साइज़ जांचें",
      perfectMatch: "✓ बिल्कुल सही! इमेज सभी परीक्षा आवश्यकताओं को पूरा करती है।",
      outsideTarget: "⚠ लक्ष्य सीमा से बाहर। ऊपर दिए गए स्लाइडर समायोजित करें।",
      downloadImage: "इमेज डाउनलोड करें",
      autoRenamedPrefix: "पोर्टल पर बिना त्रुटि अपलोड के लिए इसका नाम अपने आप बदलकर",
      autoRenamedSuffix: "कर दिया गया है।",
      share: "शेयर करें",
      copied: "कॉपी हो गया!",
      processAnother: "एक और प्रोसेस करें",
      errorHeic: "यह HEIC फ़ोटो कन्वर्ट नहीं हो सकी। कृपया JPG या PNG आज़माएं।",
      errorFileType: "कृपया JPG, PNG, WEBP, या HEIC इमेज चुनें।",
      errorFileSize: (mb: number) => `कृपया ${mb}MB से छोटी इमेज चुनें।`,
      errorInvalidValues: "मान्य चौड़ाई, ऊंचाई और साइज़ दर्ज करें।",
      errorReadImage: "यह इमेज पढ़ी नहीं जा सकी।",
      errorProcessImage: "यह इमेज प्रोसेस नहीं हो सकी।",
      errorGeneric: "कुछ गड़बड़ हो गई। कृपया फिर से कोशिश करें।",
      loadingImage: "इमेज लोड हो रही है…",
    },
    hub: {
      badgeFree: "100% मुफ़्त और निजी",
      badgePrivacy: "गोपनीयता प्रमाणित",
      h1: "सेकंडों में परीक्षा के लिए तैयार फ़ोटो और हस्ताक्षर",
      lead: "CTET, HTET, UPTET और अन्य परीक्षाओं के लिए अपनी फ़ोटो या हस्ताक्षर को रिसाइज़ और कंप्रेस करें। आपके ब्राउज़र में ही प्रोसेस होता है, कभी अपलोड नहीं होता।",
      howItWorksTitle: "यह कैसे काम करता है",
      howItWorksLead: "अपने परीक्षा दस्तावेज़ 3 आसान चरणों में तैयार करें। किसी तकनीकी ज्ञान की ज़रूरत नहीं।",
      steps: [
        {
          title: "1. अपने दस्तावेज़ का प्रकार चुनें",
          description: "फ़ोटो या हस्ताक्षर चुनें, हम सही आयाम और फ़ाइल साइज़ सीमा अपने आप लोड कर देंगे।",
        },
        {
          title: "2. अपलोड करें और प्रोसेस करें",
          description: "अपनी फ़ोटो या हस्ताक्षर डालें। रिसाइज़िंग और कंप्रेशन आपके ब्राउज़र में तुरंत हो जाता है।",
        },
        {
          title: "3. डाउनलोड करें",
          description: "ऑप्टिमाइज़्ड परिणाम देखें और डाउनलोड करें। आपकी फ़ाइल कभी आपकी डिवाइस से बाहर नहीं जाती।",
        },
      ],
    },
    moreTools: {
      title: "अन्य टूल्स",
      items: {
        addNameDate: { label: "नाम और तारीख जोड़ें", sublabel: "फ़ोटो पर नाम/तारीख स्टैम्प करें" },
        imageCompressor: { label: "इमेज कंप्रेसर", sublabel: "सटीक KB सीमा में लाएं" },
        signatureCompressor: { label: "सिग्नेचर कंप्रेसर", sublabel: "स्याही साफ़ व कंप्रेस करें" },
        faceCoverage: { label: "75% फेस कवरेज", sublabel: "पोज़िशनिंग गाइड" },
      },
    },
    modeTabs: {
      imageResizer: "इमेज रिसाइज़र",
      addNameDate: "नाम और तारीख जोड़ें",
    },
    spoke: {
      h1: (shortName: string) => `${shortName} फ़ोटो और हस्ताक्षर रिसाइज़र`,
      lead: (shortName: string, fullName: string) =>
        `अपनी फ़ोटो या हस्ताक्षर को ${shortName} (${fullName}) आवेदन-फॉर्म की आवश्यकताओं के अनुसार रिसाइज़ और कंप्रेस करें। आपके ब्राउज़र में ही प्रोसेस होता है, कभी अपलोड नहीं होता।`,
      specsTitle: (shortName: string) => `${shortName} फ़ोटो और हस्ताक्षर विनिर्देश`,
      specDocument: "दस्तावेज़",
      specFileSize: "फ़ाइल साइज़",
      specPhoto: "फ़ोटो",
      specSignature: "हस्ताक्षर",
      faqsTitle: (shortName: string) => `${shortName} रिसाइज़र सामान्य प्रश्न`,
      differentExamPrompt: "किसी अलग परीक्षा की तैयारी कर रहे हैं?",
      useGeneralResizer: "सामान्य रिसाइज़र उपयोग करें",
      relatedToolsBadge: "संबंधित टूल्स",
      relatedToolsTitlePrefix: "",
      relatedToolsTitleSuffix: "परीक्षाओं के लिए भी रिसाइज़ करें",
      relatedToolsLead: (categoryLabel: string) =>
        `कई परीक्षाओं की तैयारी कर रहे हैं? अन्य ${categoryLabel} परीक्षाओं के लिए भी अपनी फ़ोटो और हस्ताक्षर तुरंत रिसाइज़ करें।`,
      officialRequirementsPrefix: "के लिए आधिकारिक आवश्यकताएं",
      administeredBy: "संचालक निकाय",
      officialGuidelines: "आधिकारिक दिशानिर्देश",
      generalRequirements: "सामान्य आवश्यकताएं",
      photographLabel: "फ़ोटोग्राफ",
      thumbImpressionLabel: "अंगूठे का निशान",
    },
    category: {
      h1: (label: string) => `${label}: फ़ोटो और हस्ताक्षर रिसाइज़र`,
      lead: "अपनी सटीक फ़ोटो और हस्ताक्षर साइज़ जानने के लिए नीचे अपनी परीक्षा चुनें। आपके ब्राउज़र में ही प्रोसेस होता है, कभी अपलोड नहीं होता।",
      searchWithin: (label: string) => `${label} में खोजें…`,
      differentCategoryPrompt: "किसी अलग श्रेणी की तलाश है?",
      browseAllExams: "सभी परीक्षाएं देखें",
    },
    browse: {
      title: "परीक्षा अनुसार खोजें",
      lead: "हर परीक्षा की अपनी फ़ोटो व हस्ताक्षर साइज़ होती है। खोजें, या पहले श्रेणी चुनें फिर अपनी परीक्षा।",
      searchPlaceholder: "अपनी परीक्षा खोजें (जैसे UPSC, CTET, SBI PO)…",
      examCount: (count: number) => `${count} परीक्षा${count === 1 ? "" : "एं"}`,
    },
    search: {
      noResults: (query: string) => `"${query}" से मेल खाती कोई परीक्षा नहीं मिली। कोई और नाम आज़माएं, या नीचे देखें।`,
    },
    recentExams: {
      title: "हाल ही में देखी गई",
    },
    addNameDatePage: {
      howItWorksTitle: "यह कैसे काम करता है",
      howItWorksLead: "अपनी परीक्षा-तैयार फ़ोटो 3 आसान चरणों में पाएं। किसी तकनीकी ज्ञान की ज़रूरत नहीं।",
      steps: [
        {
          title: "1. अपनी फ़ोटो अपलोड करें",
          description: "जिस पासपोर्ट-साइज़ फ़ोटो पर नाम और तारीख स्टैम्प करनी है उसे अपलोड करें। JPG, PNG, WEBP और HEIC सभी सपोर्टेड हैं।",
        },
        {
          title: "2. अपनी जानकारी दर्ज करें",
          description: "अपना नाम टाइप करें और तारीख चुनें, सिर्फ़ नाम, सिर्फ़ तारीख, या दोनों, जो भी आपके फॉर्म में चाहिए।",
        },
        {
          title: "3. डाउनलोड करें",
          description: "स्टैम्प की गई फ़ोटो कैसी दिखेगी यह पहले देखें, फिर उसे तुरंत पूरी क्वालिटी में डाउनलोड करें।",
        },
      ],
      featuresTitle: "सही तरीके से नाम और तारीख स्टैम्पिंग",
      featuresLead: "सेकंडों में अपने नाम और तारीख के साथ परीक्षा के लिए तैयार फ़ोटो बनाएं, किसी एडिटिंग स्किल की ज़रूरत नहीं।",
      features: [
        { title: "कस्टम टेक्स्ट", description: "अपना पूरा नाम स्पष्ट ब्लॉक अक्षरों में प्रिंट करें, ठीक उसी फॉर्मेट में जो ज़्यादातर आधिकारिक परीक्षा सूचनाओं में मांगा जाता है।" },
        { title: "तारीख स्टैम्पिंग", description: "फ़ोटो की तारीख अपने आप जोड़ें, कोई भी तारीख चुनें, या आज की तारीख उपयोग करें।" },
        { title: "परीक्षा के अनुरूप", description: "SSC, UPSC और अन्य बोर्ड द्वारा अपेक्षित सफ़ेद बैकग्राउंड पर काले टेक्स्ट के फॉर्मेट से मेल खाता है।" },
        { title: "तुरंत प्रीव्यू", description: "डाउनलोड करने से पहले देखें कि आपकी फ़ोटो नाम और तारीख के साथ बिल्कुल कैसी दिखेगी।" },
        { title: "मोबाइल पर भी काम करता है", description: "अपने फ़ोन से सीधे अपनी फ़ोटो स्टैम्प करें, डेस्कटॉप की ज़रूरत नहीं।" },
        { title: "पूरी तरह मुफ़्त", description: "बिना किसी छुपे शुल्क के जितनी चाहें उतनी फ़ोटो स्टैम्प करें।" },
      ],
      faqTitle: "नाम और तारीख जोड़ें सामान्य प्रश्न",
      faqs: [
        {
          q: "फ़ोटो में नाम और तारीख कैसे जोड़ें?",
          a: "अपनी फ़ोटो अपलोड करें, अपना नाम टाइप करें और/या तारीख चुनें, टूल तुरंत दोनों को इमेज पर स्टैम्प कर देगा। आप तुरंत परिणाम डाउनलोड कर सकते हैं।",
        },
        {
          q: "क्या यह नाम और तारीख फॉर्मेट परीक्षा फॉर्म के लिए स्वीकार्य है?",
          a: "नाम सादे ब्लॉक अक्षरों में और तारीख DD/MM/YYYY फॉर्मेट में, फ़ोटो के नीचे एक सफ़ेद पट्टी पर प्रिंट होती है, यही लेआउट ज़्यादातर सरकारी परीक्षा पोर्टल चाहते हैं। हमेशा अपनी परीक्षा की आधिकारिक सूचना से दोबारा जांच लें।",
        },
        {
          q: "क्या मैं सिर्फ़ तारीख, या सिर्फ़ नाम जोड़ सकता हूं?",
          a: "हां, सिर्फ़ तारीख स्टैम्प करने के लिए नाम फ़ील्ड खाली छोड़ें, या सिर्फ़ नाम स्टैम्प करने के लिए \"तारीख शामिल करें\" अनचेक रखें।",
        },
        {
          q: "क्या इससे मेरी फ़ोटो के आयाम बदल जाते हैं?",
          a: "नहीं, जब तक आप Resize Settings चालू न करें। डिफ़ॉल्ट रूप से आपकी फ़ोटो अपने मूल आकार में ही रहती है, सिर्फ़ नाम/तारीख टेक्स्ट जोड़ा जाता है।",
        },
        {
          q: "क्या मेरी फ़ोटो कहीं अपलोड होती है?",
          a: "नहीं। सब कुछ आपके ब्राउज़र में Canvas API का उपयोग करके स्थानीय रूप से होता है। आपकी फ़ोटो आपकी डिवाइस से कभी बाहर नहीं जाती।",
        },
        {
          q: "क्या यह टूल मुफ़्त है?",
          a: "हां, पूरी तरह मुफ़्त, फ़ोटो स्टैम्प करने की कोई सीमा नहीं।",
        },
      ],
    },
    footer: {
      policy: "नीति",
      terms: "नियम और शर्तें",
      refund: "रिफंड",
      contact: "संपर्क करें",
      whatsapp: "WhatsApp",
      copyright: (year: number) => `© ${year} Clear Cutoff. सर्वाधिकार सुरक्षित!`,
    },
  },
} as const;

export function getDict(locale: Locale) {
  return DICTIONARY[locale];
}

// Category labels are stored in English on ResizerExamSpec.category (also
// used to derive the stable, URL-facing category slug) — this is the Hindi
// display-label lookup, keyed by that same English label so the URL/slug
// never changes when a page is viewed in Hindi.
const CATEGORY_LABELS_HI: Record<string, string> = {
  "Teaching Exams (TET / TGT / PGT)": "शिक्षण परीक्षाएं (TET / TGT / PGT)",
  "Central Government Exams": "केंद्र सरकार परीक्षाएं",
  "State PSCs (Public Service Commissions)": "राज्य लोक सेवा आयोग (State PSCs)",
  "Banking Exams": "बैंकिंग परीक्षाएं",
  "Police Exams": "पुलिस परीक्षाएं",
  "Judiciary Exams": "न्यायिक परीक्षाएं",
  "Other / Education Exams": "अन्य / शिक्षा परीक्षाएं",
};

export function getCategoryLabel(englishLabel: string, locale: Locale): string {
  if (locale === "en") return englishLabel;
  return CATEGORY_LABELS_HI[englishLabel] ?? englishLabel;
}
