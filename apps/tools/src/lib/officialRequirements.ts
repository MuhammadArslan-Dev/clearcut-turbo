// "Official Requirements" widget data — dimensions/file-size/format and
// administering-body name are plain facts (copied as-is); the
// generalRequirements/rulesText prose is written in our own original
// wording conveying the same factual content, not copied verbatim, since
// the source (resizer.exammint.in) is a competitor site and copying its
// exact sentences would be a copyright problem regardless of accuracy.
//
// Keyed by our own resizerExams.ts slug. Only includes exams that have a
// matching page on the reference site — an exam absent here simply has no
// widget rendered (see ResizerSpokePage.tsx), rather than showing
// fabricated content. `thumb` is present only for exams that actually
// require a left thumb impression upload.
export interface OfficialRequirementCard {
  widthPx: number;
  heightPx: number;
  minKB: number;
  maxKB: number;
  format: string;
  generalRequirements?: string;
  rulesLabel: string;
  rulesText: string;
}

export interface ExamOfficialRequirements {
  administeringBody: string;
  photo: OfficialRequirementCard;
  signature: OfficialRequirementCard;
  thumb?: OfficialRequirementCard;
}

const STANDARD_THUMB: OfficialRequirementCard = {
  widthPx: 240,
  heightPx: 240,
  minKB: 20,
  maxKB: 50,
  format: "jpg",
  rulesLabel: "Rules & Guidelines",
  rulesText:
    "Press the left thumb firmly using blue or black ink on a plain white sheet — keep the ridge pattern sharp, with no smudging or excess ink.",
};

export const OFFICIAL_REQUIREMENTS: Record<string, ExamOfficialRequirements> = {
  upsc: {
    administeringBody: "Union Public Service Commission (UPSC)",
    photo: {
      widthPx: 400, heightPx: 400, minKB: 20, maxKB: 300, format: "jpg",
      generalRequirements: "A current colour photo with a calm, natural expression — don't sign across it.",
      rulesLabel: "Rules & Background",
      rulesText: "White backdrop, face filling roughly three-quarters of the frame, dead-centre and fully forward-facing with both ears showing. Skip uniforms, tinted eyewear, or any head covering that isn't for religious reasons — and even then the face must stay fully visible.",
    },
    signature: {
      widthPx: 400, heightPx: 400, minKB: 20, maxKB: 100, format: "jpg",
      generalRequirements: "Upload one scan containing three matching signatures, one under the other.",
      rulesLabel: "Rules & Ink",
      rulesText: "Sign three times in black ink on plain paper, keeping all three in the single scanned image. Final crop should land between 350×350 and 500×500px, 20–100KB.",
    },
  },
  "ssc-cgl": {
    administeringBody: "Staff Selection Commission (SSC)",
    photo: {
      widthPx: 275, heightPx: 354, minKB: 20, maxKB: 50, format: "jpg",
      generalRequirements: "Captured live through the application portal itself — pre-saved photos are rejected outright.",
      rulesLabel: "Rules & Background",
      rulesText: "Even lighting on a plain backdrop, face fully inside the on-screen guide box, looking straight ahead. Hats, masks and eyewear are all off-limits during capture.",
    },
    signature: {
      widthPx: 140, heightPx: 60, minKB: 10, maxKB: 20, format: "jpg",
      generalRequirements: "A clean scan of your signature — legibility matters more than style.",
      rulesLabel: "Rules & Ink",
      rulesText: "Avoid tiny or blurry scans and don't write in block capitals. The system tolerates up to 236×79px if 140×60 isn't practical. Visually impaired candidates may submit a thumb impression here instead.",
    },
  },
  "ssc-chsl": {
    administeringBody: "Staff Selection Commission (SSC)",
    photo: {
      widthPx: 200, heightPx: 240, minKB: 20, maxKB: 50, format: "jpg",
      generalRequirements: "Taken live via webcam or an Android device during the application — scans aren't accepted.",
      rulesLabel: "Rules & Background",
      rulesText: "Face the camera squarely under good lighting against a plain backdrop; no cap, mask or spectacles. You'll need to confirm consent for the live capture.",
    },
    signature: {
      widthPx: 200, heightPx: 80, minKB: 10, maxKB: 20, format: "jpg",
      generalRequirements: "A scan of a signature in black ink on white paper, saved as JPG/JPEG.",
      rulesLabel: "Rules & Ink",
      rulesText: "Physical size works out to about 4 × 2cm. Keep it legible and never in block capitals.",
    },
  },
  "ssc-gd": {
    administeringBody: "Staff Selection Commission (SSC)",
    photo: {
      widthPx: 200, heightPx: 240, minKB: 20, maxKB: 50, format: "jpg",
      generalRequirements: "Recent passport photo (roughly 3.5×4.5cm) on a light or white backdrop, no older than three months.",
      rulesLabel: "Rules & Background",
      rulesText: "Face should fill 70–80% of the frame, eyes open and looking ahead, ears visible, no cap or dark glasses. A printed date on the photo is fine.",
    },
    signature: {
      widthPx: 240, heightPx: 80, minKB: 10, maxKB: 20, format: "jpg",
      generalRequirements: "Black-ink signature scanned from white paper.",
      rulesLabel: "Rules & Ink",
      rulesText: "Roughly 6 × 2cm. Legible, not block capitals — a left thumb impression (240×240px, 20–50KB) is also required alongside it.",
    },
    thumb: STANDARD_THUMB,
  },
  neet: {
    administeringBody: "National Testing Agency (NTA)",
    photo: {
      widthPx: 275, heightPx: 354, minKB: 10, maxKB: 200, format: "jpg",
      generalRequirements: "Two separate prints are needed — a passport-size and a postcard-size — both current and unretouched; bring physical copies to the centre.",
      rulesLabel: "Rules & Background",
      rulesText: "Plain white background on both, taken after 1 Jan 2025, with your name and the shoot date printed on each. Face (including ears) should fill 80% of the frame — no mask, cap or goggles unless medically required.",
    },
    signature: {
      widthPx: 275, heightPx: 118, minKB: 4, maxKB: 30, format: "jpg",
      generalRequirements: "A full signature scan in your normal running hand.",
      rulesLabel: "Rules & Ink",
      rulesText: "Black ink on white paper, legible, no all-caps, no digital touch-ups.",
    },
    thumb: { widthPx: 300, heightPx: 225, minKB: 10, maxKB: 200, format: "jpg", rulesLabel: "Rules & Guidelines", rulesText: STANDARD_THUMB.rulesText },
  },
  "neet-pg": {
    administeringBody: "National Board of Examinations in Medical Sciences (NBEMS)",
    photo: {
      widthPx: 350, heightPx: 450, minKB: 10, maxKB: 80, format: "jpg",
      generalRequirements: "Recent colour passport photo (within 3 months) showing face, neck and shoulders, unedited.",
      rulesLabel: "Rules & Background",
      rulesText: "White background, face filling 70–80% of frame, neutral expression, both ears visible — no cap, dark glasses, mask or shadow. NBEMS also requires a live webcam capture during the online form.",
    },
    signature: {
      widthPx: 350, heightPx: 150, minKB: 10, maxKB: 80, format: "jpg",
      generalRequirements: "Full signature scanned from plain white paper.",
      rulesLabel: "Rules & Ink",
      rulesText: "Black or dark-blue ink, running hand, inside a 3.5×1.5cm box on unlined paper. All-caps or initials-only will be rejected.",
    },
    thumb: { widthPx: 350, heightPx: 150, minKB: 10, maxKB: 80, format: "jpg", rulesLabel: "Rules & Guidelines", rulesText: STANDARD_THUMB.rulesText },
  },
  jee: {
    administeringBody: "National Testing Agency (NTA)",
    photo: {
      widthPx: 275, heightPx: 354, minKB: 10, maxKB: 200, format: "jpg",
      generalRequirements: "Recent colour passport photo, natural and unfiltered, face as the clear focal point.",
      rulesLabel: "Rules & Background",
      rulesText: "White background, 80% face visibility with ears showing and no mask. No explicit name/date printing needed. Caps and goggles aren't allowed.",
    },
    signature: {
      widthPx: 275, heightPx: 118, minKB: 10, maxKB: 100, format: "jpg",
      generalRequirements: "Scan of a full, legible signature.",
      rulesLabel: "Rules & Ink",
      rulesText: "Black or blue ink, running hand on white paper — no digital signatures.",
    },
  },
  "india-post-gds": {
    administeringBody: "India Post",
    photo: {
      widthPx: 320, heightPx: 400, minKB: 30, maxKB: 100, format: "jpg",
      generalRequirements: "Recent colour passport photo at 320×400px, 30–100KB.",
      rulesLabel: "Rules & Background",
      rulesText: "Plain white or light background, face covering 70–80% of the frame — no selfies or re-scanned prints.",
    },
    signature: {
      widthPx: 300, heightPx: 120, minKB: 20, maxKB: 100, format: "jpg",
      generalRequirements: "Scan of your signature, 300×120px, 20–100KB.",
      rulesLabel: "Rules & Ink",
      rulesText: "Black or blue ink on white paper — digital signatures aren't accepted.",
    },
  },
  "ssc-mts": {
    administeringBody: "Staff Selection Commission (SSC)",
    photo: {
      widthPx: 200, heightPx: 240, minKB: 20, maxKB: 50, format: "jpg",
      generalRequirements: "Live capture through the MySSC app or a webcam — not a saved photo.",
      rulesLabel: "Rules & Background",
      rulesText: "Plain, well-lit background, face square to the camera, no cap/mask/glasses.",
    },
    signature: {
      widthPx: 240, heightPx: 80, minKB: 10, maxKB: 20, format: "jpg",
      generalRequirements: "Black-ink signature scan on white paper, uploaded separately.",
      rulesLabel: "Rules & Ink",
      rulesText: "About 6×2cm, legible, not block capitals. A left thumb impression (240×240px, 20–50KB) is also needed.",
    },
    thumb: STANDARD_THUMB,
  },
  ibps: {
    administeringBody: "Institute of Banking Personnel Selection (IBPS)",
    photo: {
      widthPx: 200, heightPx: 230, minKB: 20, maxKB: 50, format: "jpg",
      generalRequirements: "Passport-style colour photo, plus a separate live capture taken during registration via webcam or phone.",
      rulesLabel: "Rules & Background",
      rulesText: "Light, ideally white background, relaxed natural expression facing the camera. No glare on glasses; no caps, hats or dark glasses (religious headwear is fine if the face stays visible).",
    },
    signature: {
      widthPx: 140, heightPx: 60, minKB: 10, maxKB: 20, format: "jpg",
      generalRequirements: "Signature scan — keep it identical across every stage of the process.",
      rulesLabel: "Rules & Ink",
      rulesText: "Black ink, and never written in capitals.",
    },
    thumb: STANDARD_THUMB,
  },
  "rrb-alp": {
    administeringBody: "Railway Recruitment Boards (RRBs)",
    photo: {
      widthPx: 275, heightPx: 354, minKB: 50, maxKB: 150, format: "jpg",
      generalRequirements: "Studio-taken colour passport photo — phone selfies risk rejection. Keep a dozen spare prints handy.",
      rulesLabel: "Rules & Background",
      rulesText: "Plain white backdrop, non-white clothing, taken within the last two months, no markings on the photo itself. Face should fill at least half the frame.",
    },
    signature: {
      widthPx: 275, heightPx: 157, minKB: 30, maxKB: 49, format: "jpg",
      generalRequirements: "Signature scan.",
      rulesLabel: "Rules & Ink",
      rulesText: "Black ink only, running hand — no block capitals or disconnected letters.",
    },
  },
  "railway-rrb": {
    administeringBody: "Railway Recruitment Boards (RRBs)",
    photo: {
      widthPx: 240, heightPx: 240, minKB: 30, maxKB: 70, format: "jpg",
      generalRequirements: "Studio-shot recent colour passport photo — keep a dozen spares.",
      rulesLabel: "Rules & Background",
      rulesText: "White or light background, no cap or sunglasses, face covering at least half the frame.",
    },
    signature: {
      widthPx: 140, heightPx: 60, minKB: 30, maxKB: 70, format: "jpg",
      generalRequirements: "Signature scan.",
      rulesLabel: "Rules & Ink",
      rulesText: "Black ink, running hand — block letters aren't accepted.",
    },
  },
  "rrb-group-d": {
    administeringBody: "Railway Recruitment Boards (RRBs)",
    photo: {
      widthPx: 240, heightPx: 240, minKB: 20, maxKB: 50, format: "jpg",
      generalRequirements: "3.5×3.5cm square photo (~240×240px), taken within 2–3 months, plain background, face covering over half the frame.",
      rulesLabel: "Rules & Background",
      rulesText: "JPG only, 20–50KB, at least 100 DPI. No selfies, filters, caps, sunglasses or glare.",
    },
    signature: {
      widthPx: 140, heightPx: 60, minKB: 10, maxKB: 40, format: "jpg",
      generalRequirements: "5×2cm signature scan at 100–150 DPI for clarity.",
      rulesLabel: "Rules & Ink",
      rulesText: "Black or blue ink, cursive — not block capitals. JPG, 10–40KB.",
    },
    thumb: { widthPx: 140, heightPx: 60, minKB: 10, maxKB: 40, format: "jpg", rulesLabel: "Rules & Guidelines", rulesText: STANDARD_THUMB.rulesText },
  },
  ctet: {
    administeringBody: "Central Board of Secondary Education (CBSE)",
    photo: {
      widthPx: 350, heightPx: 450, minKB: 10, maxKB: 100, format: "jpg",
      generalRequirements: "Recent colour passport photo (3.5×4.5cm), strictly 10–100KB, JPG.",
      rulesLabel: "Rules & Background",
      rulesText: "Plain white/light background, face filling 70–80% of frame with both ears visible. Prescription glasses okay if glare-free — no caps, hats, masks or tinted lenses.",
    },
    signature: {
      widthPx: 350, heightPx: 150, minKB: 3, maxKB: 30, format: "jpg",
      generalRequirements: "Original signature scanned from plain white paper, sized 3.5×1.5cm.",
      rulesLabel: "Rules & Ink",
      rulesText: "Black or blue ink, running hand on unruled paper — block capitals are rejected. 3–30KB, JPG.",
    },
  },
  iocl: {
    administeringBody: "Indian Oil Corporation Limited (IOCL)",
    photo: {
      widthPx: 200, heightPx: 230, minKB: 20, maxKB: 50, format: "jpg",
      generalRequirements: "Recent colour passport photo (4.5×3.5cm) on a light or white background.",
      rulesLabel: "Rules & Background",
      rulesText: "Centred, full-frontal face with both ears visible and eyes open, neutral expression. No cap, dark glasses, mask, or busy backdrop.",
    },
    signature: {
      widthPx: 140, heightPx: 60, minKB: 10, maxKB: 20, format: "jpg",
      generalRequirements: "Scan of an original handwritten signature on clean white paper.",
      rulesLabel: "Rules & Ink",
      rulesText: "Black ink, ordinary running hand — all-caps or block letters are rejected. 140×60px, 10–20KB.",
    },
    thumb: STANDARD_THUMB,
  },
  nptel: {
    administeringBody: "NPTEL / SWAYAM (IIT Madras & Ministry of Education)",
    photo: {
      widthPx: 350, heightPx: 450, minKB: 10, maxKB: 200, format: "jpg",
      generalRequirements: "Clear, recent portrait-style photo on a plain white or light backdrop.",
      rulesLabel: "Rules & Background",
      rulesText: "Look directly at the camera, both eyes/ears visible, no hats, dark sunglasses or heavy filters. 10–200KB (50–150KB recommended), JPG.",
    },
    signature: {
      widthPx: 300, heightPx: 120, minKB: 4, maxKB: 30, format: "jpg",
      generalRequirements: "Scan of a genuine handwritten signature on plain white paper.",
      rulesLabel: "Rules & Ink",
      rulesText: "Dark blue or black ink, cursive, on clean unlined paper — crop tightly around it. 4–30KB, JPG.",
    },
  },
  dsssb: {
    administeringBody: "Delhi Subordinate Services Selection Board (DSSSB)",
    photo: {
      widthPx: 480, heightPx: 672, minKB: 50, maxKB: 300, format: "jpg",
      generalRequirements: "Colour postcard-size photo (5×7in, exactly 480×672px), 50–300KB, JPG. Face should be centred, filling roughly 75–80% of the frame.",
      rulesLabel: "Rules & Background",
      rulesText: "Plain white background, both ears and shoulders visible — no dark glasses, caps, masks or hats (religious headwear fine if the face stays visible). Must be within the last 6 months; no mobile selfies.",
    },
    signature: {
      widthPx: 140, heightPx: 110, minKB: 10, maxKB: 40, format: "jpg",
      generalRequirements: "Signature scan, exactly 140×110px, 10–40KB, JPG.",
      rulesLabel: "Rules & Ink",
      rulesText: "Black ink/gel pen, running hand on plain white paper — block capitals are rejected. Only the candidate's own signature counts.",
    },
  },
  wbcs: {
    administeringBody: "West Bengal Public Service Commission (WBPSC)",
    photo: {
      widthPx: 138, heightPx: 177, minKB: 20, maxKB: 100, format: "jpg",
      generalRequirements: "Recent, clear passport-style photo.",
      rulesLabel: "Rules & Background",
      rulesText: "Light or white background, face taking up about 80% of frame — no dark glasses, caps or hats.",
    },
    signature: {
      widthPx: 138, heightPx: 59, minKB: 10, maxKB: 20, format: "jpg",
      generalRequirements: "Full signature scan.",
      rulesLabel: "Rules & Ink",
      rulesText: "Black ink on white paper, running hand — no block capitals.",
    },
  },
  opsc: {
    administeringBody: "Odisha Public Service Commission (OPSC)",
    photo: {
      widthPx: 200, heightPx: 240, minKB: 20, maxKB: 100, format: "jpg",
      generalRequirements: "Colour passport photo under 3 months old with your name written on it, on a white/light backdrop.",
      rulesLabel: "Rules & Background",
      rulesText: "Face clearly identifiable, no hat or dark glasses, background light or white — must reflect your current look.",
    },
    signature: {
      widthPx: 140, heightPx: 60, minKB: 10, maxKB: 50, format: "jpg",
      generalRequirements: "Signature in black or dark-blue ink on white paper, scanned at 140×60px.",
      rulesLabel: "Rules & Ink",
      rulesText: "Clear and legible, no smudges or marks.",
    },
  },
  apsc: {
    administeringBody: "Assam Public Service Commission (APSC)",
    photo: {
      widthPx: 200, heightPx: 250, minKB: 20, maxKB: 50, format: "jpg",
      generalRequirements: "Recent colour passport photo, light/white background, no harsh shadows, both ears visible.",
      rulesLabel: "Rules & Background",
      rulesText: "If wearing glasses avoid reflections so the eyes read clearly. Keep the file under 50KB.",
    },
    signature: {
      widthPx: 140, heightPx: 60, minKB: 10, maxKB: 20, format: "jpg",
      generalRequirements: "Black-ink signature on white paper — scan just the signature, not the whole sheet.",
      rulesLabel: "Rules & Ink",
      rulesText: "Under 50KB, clear and legible.",
    },
  },
  mppsc: {
    administeringBody: "Madhya Pradesh Public Service Commission (MPPSC)",
    photo: {
      widthPx: 275, heightPx: 354, minKB: 25, maxKB: 200, format: "jpg",
      generalRequirements: "High-quality recent colour scan.",
      rulesLabel: "Rules & Background",
      rulesText: "No older than 3 months, light/white background, face square to the camera.",
    },
    signature: {
      widthPx: 275, heightPx: 118, minKB: 25, maxKB: 200, format: "jpg",
      generalRequirements: "Signature scan.",
      rulesLabel: "Rules & Ink",
      rulesText: "Black ink on white paper, clear and legible.",
    },
  },
  jpsc: {
    administeringBody: "Jharkhand Public Service Commission (JPSC)",
    photo: {
      widthPx: 275, heightPx: 354, minKB: 20, maxKB: 50, format: "jpg",
      generalRequirements: "Clear, recent colour passport photo.",
      rulesLabel: "Rules & Background",
      rulesText: "Light/white background, no glasses or cap, both ears visible.",
    },
    signature: {
      widthPx: 275, heightPx: 118, minKB: 10, maxKB: 20, format: "jpg",
      generalRequirements: "Signature scan.",
      rulesLabel: "Rules & Ink",
      rulesText: "Black ink on white paper, legible, no all-caps.",
    },
  },
  mpsc: {
    administeringBody: "Maharashtra Public Service Commission (MPSC)",
    photo: {
      widthPx: 275, heightPx: 354, minKB: 20, maxKB: 50, format: "jpg",
      generalRequirements: "Recent good-quality colour passport photo.",
      rulesLabel: "Rules & Background",
      rulesText: "Plain white or off-white background, face filling 70–80% of frame, no dark glasses or hats.",
    },
    signature: {
      widthPx: 275, heightPx: 118, minKB: 10, maxKB: 20, format: "jpg",
      generalRequirements: "Signature scan — must be signed by the candidate personally.",
      rulesLabel: "Rules & Ink",
      rulesText: "Black ink on white paper.",
    },
  },
  tnpsc: {
    administeringBody: "Tamil Nadu Public Service Commission (TNPSC)",
    photo: {
      widthPx: 275, heightPx: 354, minKB: 20, maxKB: 50, format: "jpg",
      generalRequirements: "Colour passport photo with your name and date printed at the bottom, on a white/light background.",
      rulesLabel: "Rules & Background",
      rulesText: "Within the last 6 months, neutral expression, eyes open, no dark glasses or caps.",
    },
    signature: {
      widthPx: 275, heightPx: 118, minKB: 10, maxKB: 20, format: "jpg",
      generalRequirements: "Signature scan, black or dark-blue ink on white paper.",
      rulesLabel: "Rules & Ink",
      rulesText: "Legible, running hand, no block capitals or smudges.",
    },
  },
  kpsc: {
    administeringBody: "Kerala Public Service Commission (KPSC)",
    photo: {
      widthPx: 150, heightPx: 200, minKB: 20, maxKB: 30, format: "jpg",
      generalRequirements: "Passport-size colour or B&W photo at 4.5×3.5cm, showing face and shoulders on a light background.",
      rulesLabel: "Rules & Background",
      rulesText: "Identifiable, eyes open, both ears visible, face centred — no side angles or harsh shadows.",
    },
    signature: {
      widthPx: 150, heightPx: 100, minKB: 20, maxKB: 30, format: "jpg",
      generalRequirements: "Black-ink signature scan on white paper, up to 30KB.",
      rulesLabel: "Rules & Ink",
      rulesText: "Good-quality white paper, blue or black ink.",
    },
  },
  uppsc: {
    administeringBody: "Uttar Pradesh Public Service Commission (UPPSC)",
    photo: {
      widthPx: 180, heightPx: 216, minKB: 20, maxKB: 50, format: "jpg",
      generalRequirements: "Photo and signature pasted together on a 5×6cm white sheet as per the prescribed layout, signed within the marked box.",
      rulesLabel: "Rules & Background",
      rulesText: "Scan at 200 DPI, recent photo, eyes open, no cap except religious headwear.",
    },
    signature: {
      widthPx: 216, heightPx: 108, minKB: 10, maxKB: 30, format: "jpg",
      generalRequirements: "Full signature within the given box — initials alone aren't accepted.",
      rulesLabel: "Rules & Ink",
      rulesText: "JPG/PNG/TIFF, under 50KB, true colour at 200 DPI — no capital-letter signatures.",
    },
  },
  upsssc: {
    administeringBody: "Uttar Pradesh Subordinate Services Selection Commission (UPSSSC)",
    photo: {
      widthPx: 350, heightPx: 450, minKB: 50, maxKB: 100, format: "jpg",
      generalRequirements: "Colour passport photo (3.5×4.5cm) on a light/white background, strictly 50–100KB, JPG.",
      rulesLabel: "Rules & Background",
      rulesText: "Full frontal view, ears visible, eyes forward, face filling 70–80% of frame — no sunglasses, caps or face coverings.",
    },
    signature: {
      widthPx: 350, heightPx: 150, minKB: 30, maxKB: 50, format: "jpg",
      generalRequirements: "Signature with your full name written in Devanagari script directly beneath it, in the same box.",
      rulesLabel: "Rules & Ink",
      rulesText: "Black or dark-blue ink, English signature on top and Hindi name below, 3.5×1.5cm on white paper — missing the Hindi name can mean rejection. 30–50KB.",
    },
  },
  gpsc: {
    administeringBody: "Gujarat Public Service Commission (GPSC)",
    photo: {
      widthPx: 130, heightPx: 180, minKB: 10, maxKB: 15, format: "jpg",
      generalRequirements: "Recent passport photo (3.6×5cm) on a light background, good scan quality.",
      rulesLabel: "Rules & Background",
      rulesText: "Face-to-body ratio around 70:30, no dark glasses/caps/hats, head and neck visible, ideally within the last 3–6 months.",
    },
    signature: {
      widthPx: 275, heightPx: 90, minKB: 10, maxKB: 15, format: "jpg",
      generalRequirements: "Black-ink signature scan on white paper, 7.5×2.5cm.",
      rulesLabel: "Rules & Ink",
      rulesText: "Clear and legible, under 15KB.",
    },
  },
  rpsc: {
    administeringBody: "Rajasthan Public Service Commission (RPSC)",
    photo: {
      widthPx: 240, heightPx: 320, minKB: 20, maxKB: 50, format: "jpg",
      generalRequirements: "Recent (within 6 months) colour photo at 3.5×4.5cm, passport-style, on a light/white background.",
      rulesLabel: "Rules & Background",
      rulesText: "Face at least half the frame, no phone selfies, features clearly visible, no cap/hat/dark glasses — must match the photo used at the exam centre.",
    },
    signature: {
      widthPx: 280, heightPx: 80, minKB: 20, maxKB: 50, format: "jpg",
      generalRequirements: "Sign within a 7×2cm box on A4 white paper — only the candidate's own signature is valid.",
      rulesLabel: "Rules & Ink",
      rulesText: "Scan just the box in JPEG, 20–50KB, 280×80 to 560×160px — mobile-captured signatures aren't accepted.",
    },
  },
  hpsc: {
    administeringBody: "Haryana Public Service Commission (HPSC)",
    photo: {
      widthPx: 138, heightPx: 177, minKB: 10, maxKB: 100, format: "jpg",
      generalRequirements: "Passport photo under 3 months old, JPEG, white background, face-to-body ratio 70:30.",
      rulesLabel: "Rules & Background",
      rulesText: "3.5×4.5cm, head/neck/face visible, no head coverings, scanned at 200 DPI.",
    },
    signature: {
      widthPx: 138, heightPx: 59, minKB: 10, maxKB: 50, format: "jpg",
      generalRequirements: "Signature in blue/black pen on a blank white sheet.",
      rulesLabel: "Rules & Ink",
      rulesText: "4×2cm, running hand rather than block letters.",
    },
  },
  bpsc: {
    administeringBody: "Bihar Public Service Commission (BPSC)",
    photo: {
      widthPx: 250, heightPx: 250, minKB: 20, maxKB: 50, format: "jpg",
      generalRequirements: "Recent colour passport photo on a white/light background, face and shoulders centred and clear.",
      rulesLabel: "Rules & Background",
      rulesText: "3.5×4.5cm, face covering 50–60% of frame, no cap/headgear (barring religious)/tinted glasses/shadows, both ears visible.",
    },
    signature: {
      widthPx: 220, heightPx: 100, minKB: 10, maxKB: 20, format: "jpg",
      generalRequirements: "Black or blue-ink signature scan on white paper.",
      rulesLabel: "Rules & Ink",
      rulesText: "4×2cm, sharp with no blur.",
    },
  },
  tspsc: {
    administeringBody: "Telangana State Public Service Commission (TSPSC)",
    photo: {
      widthPx: 275, heightPx: 354, minKB: 20, maxKB: 50, format: "jpg",
      generalRequirements: "Colour or high-contrast B&W photo at 3.5×4.5cm with your name and shoot date printed on it.",
      rulesLabel: "Rules & Background",
      rulesText: "No cap or goggles; glasses are fine if there's no flash glare. Polaroids aren't accepted.",
    },
    signature: {
      widthPx: 275, heightPx: 118, minKB: 10, maxKB: 30, format: "jpg",
      generalRequirements: "Black-ink signature scan on white paper.",
      rulesLabel: "Rules & Ink",
      rulesText: "3.5×1.5cm, legible, signed only by the candidate.",
    },
  },
  cgpsc: {
    administeringBody: "Chhattisgarh Public Service Commission (CGPSC)",
    photo: {
      widthPx: 275, heightPx: 354, minKB: 30, maxKB: 100, format: "jpg",
      generalRequirements: "Recent passport photo at 3.5×4.5cm, light background preferred.",
      rulesLabel: "Rules & Background",
      rulesText: "Good-quality colour image, face clearly visible, no dark glasses or caps.",
    },
    signature: {
      widthPx: 275, heightPx: 118, minKB: 20, maxKB: 50, format: "jpg",
      generalRequirements: "Black or blue-ink signature scan on white paper.",
      rulesLabel: "Rules & Ink",
      rulesText: "3.5×1.5cm, legible, not block letters.",
    },
  },
  ukpsc: {
    administeringBody: "Uttarakhand Public Service Commission (UKPSC)",
    photo: {
      widthPx: 150, heightPx: 200, minKB: 30, maxKB: 50, format: "jpg",
      generalRequirements: "Passport photo (colour or high-contrast B&W) with your name and shoot date printed on it, no cap or goggles.",
      rulesLabel: "Rules & Background",
      rulesText: "Glasses are fine; Polaroids aren't accepted. Needs clear contrast throughout.",
    },
    signature: {
      widthPx: 150, heightPx: 100, minKB: 20, maxKB: 30, format: "jpg",
      generalRequirements: "Signature scanned and uploaded separately.",
      rulesLabel: "Rules & Ink",
      rulesText: "150×100px, 20–30KB, clear and legible.",
    },
  },
  appsc: {
    administeringBody: "Arunachal Pradesh Public Service Commission (APPSC)",
    photo: {
      widthPx: 200, heightPx: 250, minKB: 50, maxKB: 100, format: "jpg",
      generalRequirements: "Recent colour passport photo, JPG/JPEG or PNG only.",
      rulesLabel: "Rules & Background",
      rulesText: "Full face and shoulders clearly shown, white/light background preferred.",
    },
    signature: {
      widthPx: 140, heightPx: 60, minKB: 20, maxKB: 50, format: "jpg",
      generalRequirements: "Black or blue-ink signature scan on white paper.",
      rulesLabel: "Rules & Ink",
      rulesText: "20–50KB; PNG is also accepted.",
    },
  },
  "manipur-psc": {
    administeringBody: "Manipur Public Service Commission (MPSC)",
    photo: {
      widthPx: 140, heightPx: 177, minKB: 20, maxKB: 50, format: "jpg",
      generalRequirements: "Passport photo in formal attire against a solid colour backdrop (blue, green or red), colour print only.",
      rulesLabel: "Rules & Background",
      rulesText: "Recent and clearly identifiable, face visible.",
    },
    signature: {
      widthPx: 140, heightPx: 80, minKB: 10, maxKB: 20, format: "jpg",
      generalRequirements: "Black-ink signature on white paper, scanned copy — must be signed personally by the applicant.",
      rulesLabel: "Rules & Ink",
      rulesText: "Clear and legible.",
    },
  },
  ppsc: {
    administeringBody: "Punjab Public Service Commission (PPSC)",
    photo: {
      widthPx: 140, heightPx: 177, minKB: 10, maxKB: 40, format: "jpg",
      generalRequirements: "Recent colour passport photo on a light background, natural relaxed expression facing the camera.",
      rulesLabel: "Rules & Background",
      rulesText: "No caps, hats or dark glasses (religious headwear fine if it doesn't hide the face); if wearing glasses, keep lenses glare-free.",
    },
    signature: {
      widthPx: 140, heightPx: 80, minKB: 10, maxKB: 40, format: "jpg",
      generalRequirements: "Black or blue-ink signature scan on white paper.",
      rulesLabel: "Rules & Ink",
      rulesText: "Sign clearly enough to verify at the exam — only the candidate's own signature is valid.",
    },
  },
  "goa-psc": {
    administeringBody: "Goa State Commission (GSC)",
    photo: {
      widthPx: 200, heightPx: 250, minKB: 10, maxKB: 500, format: "jpg",
      generalRequirements: "Passport photo scanned as JPG/JPEG, under 1MB.",
      rulesLabel: "Rules & Background",
      rulesText: "Clear and identifiable, ideally recent.",
    },
    signature: {
      widthPx: 140, heightPx: 80, minKB: 10, maxKB: 500, format: "jpg",
      generalRequirements: "Signature scan in JPG/JPEG, under 1MB.",
      rulesLabel: "Rules & Ink",
      rulesText: "Clear and legible.",
    },
  },
  kas: {
    administeringBody: "Kerala Public Service Commission (KPSC)",
    photo: {
      widthPx: 150, heightPx: 200, minKB: 20, maxKB: 200, format: "jpg",
      generalRequirements: "Recent colour passport photo (within 6 months for new profiles) with your name and shoot date printed clearly at the bottom.",
      rulesLabel: "Rules & Background",
      rulesText: "Stays valid for 10 years once uploaded — make sure lighting and background are clean, no hats or dark glasses.",
    },
    signature: {
      widthPx: 140, heightPx: 80, minKB: 20, maxKB: 100, format: "jpg",
      generalRequirements: "Black or dark-blue ink signature scan on white paper.",
      rulesLabel: "Rules & Ink",
      rulesText: "Legible, between 350×350 and 1000×1000px, capped at 300KB total.",
    },
  },
  hppsc: {
    administeringBody: "Himachal Pradesh Public Service Commission (HPPSC)",
    photo: {
      widthPx: 110, heightPx: 140, minKB: 10, maxKB: 40, format: "jpg",
      generalRequirements: "Recent passport photo, JPG/PNG, 3.5×4.5cm (~110×140px), 10–100KB, clear face on a light/white background.",
      rulesLabel: "Rules & Background",
      rulesText: "200 DPI recommended, both ears visible, eyes open — no dark glasses, caps or harsh shadows/red-eye.",
    },
    signature: {
      widthPx: 110, heightPx: 140, minKB: 10, maxKB: 30, format: "jpg",
      generalRequirements: "Black-ink signature scan on white paper, same format as the photo.",
      rulesLabel: "Rules & Ink",
      rulesText: "~110×140px, 10–30KB, legible, handwritten (not printed), not block capitals.",
    },
  },
  "mizoram-psc": {
    administeringBody: "Mizoram Public Service Commission",
    photo: {
      widthPx: 130, heightPx: 200, minKB: 0, maxKB: 10240, format: "jpg",
      generalRequirements: "Scanned colour passport photo, 130×200px, up to 10MB, ideally within the last 6 months.",
      rulesLabel: "Rules & Background",
      rulesText: "Clear and identifiable, light/white background preferred, face centred, no dark glasses or caps.",
    },
    signature: {
      widthPx: 177, heightPx: 98, minKB: 0, maxKB: 75, format: "jpg",
      generalRequirements: "Black-ink signature scan on white paper.",
      rulesLabel: "Rules & Ink",
      rulesText: "177×98px, up to 75KB, legible, not block capitals.",
    },
  },
  "meghalaya-psc": {
    administeringBody: "Meghalaya Public Service Commission",
    photo: {
      widthPx: 150, heightPx: 200, minKB: 20, maxKB: 50, format: "jpg",
      generalRequirements: "Recent colour passport photo, ~150×200px (3.5×4.5cm), white/light background.",
      rulesLabel: "Rules & Background",
      rulesText: "Identifiable face, eyes open, both ears visible, no partial angles, no dark glasses/caps/harsh shadows.",
    },
    signature: {
      widthPx: 150, heightPx: 100, minKB: 20, maxKB: 50, format: "jpg",
      generalRequirements: "Black-ink signature scan on white paper, JPG/JPEG.",
      rulesLabel: "Rules & Ink",
      rulesText: "150×100px, 20–50KB, legible, not block capitals.",
    },
  },
  "nagaland-psc": {
    administeringBody: "Nagaland Public Service Commission",
    photo: {
      widthPx: 200, heightPx: 240, minKB: 0, maxKB: 100, format: "jpg",
      generalRequirements: "Scanned recent colour passport photo, 200×240px, up to 100KB, white/light background.",
      rulesLabel: "Rules & Background",
      rulesText: "Identifiable, face centred, eyes open, both ears visible, no dark glasses/caps/hats.",
    },
    signature: {
      widthPx: 200, heightPx: 100, minKB: 0, maxKB: 100, format: "jpg",
      generalRequirements: "Black-ink signature scan on white paper, JPG.",
      rulesLabel: "Rules & Ink",
      rulesText: "200×100px, up to 100KB, legible, not block letters.",
    },
  },
  "sikkim-psc": {
    administeringBody: "Sikkim Public Service Commission",
    photo: {
      widthPx: 150, heightPx: 200, minKB: 10, maxKB: 50, format: "jpg",
      generalRequirements: "Colour passport photo, 150×200px (3.5×4.5cm), JPG/JPEG or PNG, white/light background.",
      rulesLabel: "Rules & Background",
      rulesText: "Recent (within 6 months), clearly visible face, eyes open, both ears visible, no dark glasses or caps.",
    },
    signature: {
      widthPx: 150, heightPx: 100, minKB: 5, maxKB: 30, format: "jpg",
      generalRequirements: "Black-ink signature scan on white paper.",
      rulesLabel: "Rules & Ink",
      rulesText: "150×100px (3.5×1.5cm), 5–30KB, JPG/JPEG or PNG, handwritten — not block letters.",
    },
  },
  "tripura-psc": {
    administeringBody: "Tripura Public Service Commission",
    photo: {
      widthPx: 200, heightPx: 250, minKB: 20, maxKB: 100, format: "jpg",
      generalRequirements: "Recent colour passport photo, ~200×250px (3.5×4.5cm), JPG/JPEG, white/light background.",
      rulesLabel: "Rules & Background",
      rulesText: "Identifiable, face centred, eyes open, both ears visible, no dark glasses/caps/harsh shadows.",
    },
    signature: {
      widthPx: 200, heightPx: 100, minKB: 10, maxKB: 50, format: "jpg",
      generalRequirements: "Black-ink signature scan on white paper.",
      rulesLabel: "Rules & Ink",
      rulesText: "200×100px, 10–50KB, JPG/JPEG, legible, not block letters.",
    },
  },
  jkpsc: {
    administeringBody: "Jammu & Kashmir Public Service Commission",
    photo: {
      widthPx: 200, heightPx: 240, minKB: 10, maxKB: 20, format: "jpg",
      generalRequirements: "Scanned colour passport photo with the shoot date printed on it, 200×240px (3.5×4.5cm), white/light background.",
      rulesLabel: "Rules & Background",
      rulesText: "Recent (within 6 months), date visible on the photo itself, face clearly visible, no dark glasses or caps.",
    },
    signature: {
      widthPx: 200, heightPx: 100, minKB: 10, maxKB: 20, format: "jpg",
      generalRequirements: "Black-ink signature scan on white paper — some categories also require a separate thumb impression.",
      rulesLabel: "Rules & Ink",
      rulesText: "200×100px, 10–20KB, JPG/JPEG, legible, not block letters.",
    },
  },
  jkssb: {
    administeringBody: "Jammu & Kashmir Services Selection Board (JKSSB)",
    photo: {
      widthPx: 180, heightPx: 225, minKB: 20, maxKB: 50, format: "jpg",
      generalRequirements: "Recent colour passport photo, 180×225px (3.5×4.5cm), white background mandatory, JPG/JPEG.",
      rulesLabel: "Rules & Background",
      rulesText: "No coloured backgrounds, face clearly visible, eyes open, no dark glasses/caps/hats.",
    },
    signature: {
      widthPx: 180, heightPx: 100, minKB: 10, maxKB: 20, format: "jpg",
      generalRequirements: "Black-ink signature scan on white paper.",
      rulesLabel: "Rules & Ink",
      rulesText: "180×100px (3.5×1.5cm), 10–20KB, JPG/JPEG, legible signature.",
    },
  },
  "sbi-clerk": {
    administeringBody: "State Bank of India (SBI)",
    photo: {
      widthPx: 200, heightPx: 230, minKB: 20, maxKB: 50, format: "jpg",
      generalRequirements: "Colour passport photo (4.5×3.5cm), recent, on a white/light background.",
      rulesLabel: "Rules & Background",
      rulesText: "Preferably 200×230px, 20–50KB, relaxed forward-facing expression, no caps or dark glasses (religious headwear fine if the face stays visible).",
    },
    signature: {
      widthPx: 140, heightPx: 60, minKB: 10, maxKB: 20, format: "jpg",
      generalRequirements: "Black-ink signature on white paper, scanned separately.",
      rulesLabel: "Rules & Ink",
      rulesText: "Preferably 140×60px, 10–20KB, legible, no block capitals, signed only by the applicant.",
    },
    thumb: STANDARD_THUMB,
  },
  "sbi-po": {
    administeringBody: "State Bank of India (SBI)",
    photo: {
      widthPx: 200, heightPx: 230, minKB: 20, maxKB: 50, format: "jpg",
      generalRequirements: "Recent passport-style colour photo (4.5×3.5cm) on a white/light background.",
      rulesLabel: "Rules & Background",
      rulesText: "Preferably 200×230px, 20–50KB, face taking up ~70% of frame, no caps or dark glasses.",
    },
    signature: {
      widthPx: 140, heightPx: 60, minKB: 10, maxKB: 20, format: "jpg",
      generalRequirements: "Signature scan on white paper, black ink.",
      rulesLabel: "Rules & Ink",
      rulesText: "Preferably 140×60px, 10–20KB, legible, no block capitals.",
    },
    thumb: STANDARD_THUMB,
  },
  "rbi-grade-b": {
    administeringBody: "Reserve Bank of India (RBI)",
    photo: {
      widthPx: 200, heightPx: 230, minKB: 20, maxKB: 50, format: "jpg",
      generalRequirements: "Recent colour passport photo (4.5×3.5cm), light/white background.",
      rulesLabel: "Rules & Background",
      rulesText: "200×230px, 20–50KB, eyes open and facing the camera, no dark glasses or caps.",
    },
    signature: {
      widthPx: 140, heightPx: 60, minKB: 10, maxKB: 20, format: "jpg",
      generalRequirements: "Black-ink signature on plain white paper — a handwritten declaration and a left thumb impression are also required alongside it.",
      rulesLabel: "Rules & Ink",
      rulesText: "140×60px, 10–20KB, legible.",
    },
    thumb: STANDARD_THUMB,
  },
  "sbi-cbo": {
    administeringBody: "State Bank of India (SBI)",
    photo: {
      widthPx: 200, heightPx: 230, minKB: 20, maxKB: 50, format: "jpg",
      generalRequirements: "Recent passport-style colour photo (4.5×3.5cm), light background.",
      rulesLabel: "Rules & Background",
      rulesText: "Preferably 200×230px, 20–50KB, relaxed forward-facing look, no caps/glasses/hats.",
    },
    signature: {
      widthPx: 140, heightPx: 60, minKB: 10, maxKB: 20, format: "jpg",
      generalRequirements: "Black-ink signature scan on white paper.",
      rulesLabel: "Rules & Ink",
      rulesText: "Preferably 140×60px, 10–20KB, legible, not block/capital letters.",
    },
    thumb: STANDARD_THUMB,
  },
  "idbi-am": {
    administeringBody: "Industrial Development Bank of India (IDBI)",
    photo: {
      widthPx: 200, heightPx: 230, minKB: 20, maxKB: 50, format: "jpg",
      generalRequirements: "Recent passport-style colour photo (4.5×3.5cm), light background.",
      rulesLabel: "Rules & Background",
      rulesText: "Preferably 200×230px, 20–50KB, centred and clear, no dark glasses or caps.",
    },
    signature: {
      widthPx: 140, heightPx: 60, minKB: 10, maxKB: 20, format: "jpg",
      generalRequirements: "Black-ink signature scan on white paper — a left thumb impression (240×240px, 20–50KB) is also required.",
      rulesLabel: "Rules & Ink",
      rulesText: "Preferably 140×60px, 10–20KB, legible.",
    },
    thumb: STANDARD_THUMB,
  },
  "boi-po": {
    administeringBody: "Bank of India (BOI)",
    photo: {
      widthPx: 200, heightPx: 230, minKB: 20, maxKB: 50, format: "jpg",
      generalRequirements: "Recent colour passport photo (4.5×3.5cm), light background.",
      rulesLabel: "Rules & Background",
      rulesText: "Preferably 200×230px, 20–50KB, relaxed forward-facing look, no caps/glasses/hats.",
    },
    signature: {
      widthPx: 140, heightPx: 60, minKB: 10, maxKB: 20, format: "jpg",
      generalRequirements: "Black-ink signature scan on white paper — a left thumb impression (240×240px, 20–50KB) is also required.",
      rulesLabel: "Rules & Ink",
      rulesText: "Preferably 140×60px, 10–20KB, legible.",
    },
    thumb: STANDARD_THUMB,
  },
  "canara-bank": {
    administeringBody: "Canara Bank",
    photo: {
      widthPx: 200, heightPx: 230, minKB: 20, maxKB: 50, format: "jpg",
      generalRequirements: "Colour passport photo (4.5×3.5cm), light background.",
      rulesLabel: "Rules & Background",
      rulesText: "Preferably 200×230px, 20–50KB, JPG/JPEG, clear identifiable face, no caps or dark glasses.",
    },
    signature: {
      widthPx: 140, heightPx: 60, minKB: 10, maxKB: 20, format: "jpg",
      generalRequirements: "Black-ink signature scan on white paper.",
      rulesLabel: "Rules & Ink",
      rulesText: "Preferably 140×60px, 10–20KB, JPG/JPEG, legible, no capitals.",
    },
    thumb: STANDARD_THUMB,
  },
  "union-bank": {
    administeringBody: "Union Bank of India",
    photo: {
      widthPx: 200, heightPx: 230, minKB: 20, maxKB: 50, format: "jpg",
      generalRequirements: "Recent colour passport photo (4.5×3.5cm), white/light background.",
      rulesLabel: "Rules & Background",
      rulesText: "Preferably 200×230px, 20–50KB, JPG/JPEG, centred and clear, no dark glasses or caps.",
    },
    signature: {
      widthPx: 140, heightPx: 60, minKB: 10, maxKB: 20, format: "jpg",
      generalRequirements: "Black-ink signature scan on white paper — a left thumb impression (240×240px, 20–50KB) is also required.",
      rulesLabel: "Rules & Ink",
      rulesText: "Preferably 140×60px, 10–20KB, legible, no block letters.",
    },
    thumb: STANDARD_THUMB,
  },
  "central-bank-india": {
    administeringBody: "Central Bank of India",
    photo: {
      widthPx: 200, heightPx: 230, minKB: 20, maxKB: 50, format: "jpg",
      generalRequirements: "Passport-style colour photo (4.5×3.5cm), light background.",
      rulesLabel: "Rules & Background",
      rulesText: "Preferably 200×230px, 20–50KB, JPG/JPEG, forward-facing, no dark glasses or caps.",
    },
    signature: {
      widthPx: 140, heightPx: 60, minKB: 10, maxKB: 20, format: "jpg",
      generalRequirements: "Black-ink signature scan on white paper — a left thumb impression (240×240px, 20–50KB) is also required.",
      rulesLabel: "Rules & Ink",
      rulesText: "Preferably 140×60px, 10–20KB, no block letters.",
    },
    thumb: STANDARD_THUMB,
  },
  nicl: {
    administeringBody: "National Insurance Company Limited (NICL)",
    photo: {
      widthPx: 200, heightPx: 230, minKB: 20, maxKB: 50, format: "jpg",
      generalRequirements: "Recent colour passport photo (4.5×3.5cm) on a white/light background, 20–50KB.",
      rulesLabel: "Rules & Background",
      rulesText: "Preferably 200×230px, relaxed natural expression facing forward, both eyes/ears visible — no dark glasses, caps or hats (religious headwear fine if the face stays visible).",
    },
    signature: {
      widthPx: 140, heightPx: 60, minKB: 10, maxKB: 20, format: "jpg",
      generalRequirements: "Signature scanned from unlined clean white paper, black ink.",
      rulesLabel: "Rules & Ink",
      rulesText: "Preferably 140×60px, 10–20KB, JPG/JPEG, ordinary cursive hand — all-caps or block letters get rejected.",
    },
    thumb: STANDARD_THUMB,
  },
  "wb-police": {
    administeringBody: "West Bengal Police Recruitment Board (WBPRB)",
    photo: {
      widthPx: 200, heightPx: 240, minKB: 10, maxKB: 50, format: "jpg",
      generalRequirements: "Recent (within 3 months) colour passport photo, forward-facing on a clear white background.",
      rulesLabel: "Rules & Background",
      rulesText: "Nothing covering the face or head, eyes open without glare, no sunglasses or loose hair across the face, no red-eye or shadow — cropped selfies or group photos aren't allowed.",
    },
    signature: {
      widthPx: 140, heightPx: 80, minKB: 10, maxKB: 50, format: "jpg",
      generalRequirements: "Full signature scanned in JPG, filling the given space.",
      rulesLabel: "Rules & Ink",
      rulesText: "10–50KB, clear and legible, good scan quality.",
    },
  },
  "haryana-police": {
    administeringBody: "Haryana Police Recruitment Board (HPRB)",
    photo: {
      widthPx: 138, heightPx: 177, minKB: 20, maxKB: 40, format: "jpg",
      generalRequirements: "Recent colour passport photo on a light background, taken during the current recruitment cycle.",
      rulesLabel: "Rules & Background",
      rulesText: "No B&W or Polaroid shots; face and shoulders clearly visible, no dark glasses or caps.",
    },
    signature: {
      widthPx: 138, heightPx: 59, minKB: 10, maxKB: 30, format: "jpg",
      generalRequirements: "Sign a 2×1in box on paper with a black ballpoint pen, then scan just that area.",
      rulesLabel: "Rules & Ink",
      rulesText: "Under 30KB, clear and legible.",
    },
  },
  "rajasthan-police": {
    administeringBody: "Rajasthan Police",
    photo: {
      widthPx: 350, heightPx: 450, minKB: 50, maxKB: 100, format: "jpg",
      generalRequirements: "Recent (within 6 months) colour photo, clear and identifiable, no cap or dark glasses.",
      rulesLabel: "Rules & Background",
      rulesText: "50–100KB, JPEG, white/light background, face covering at least half the frame.",
    },
    signature: {
      widthPx: 400, heightPx: 200, minKB: 20, maxKB: 50, format: "jpg",
      generalRequirements: "Sign inside the designated box on white paper with black or dark-blue pen — only the candidate may sign.",
      rulesLabel: "Rules & Ink",
      rulesText: "Scan just the box, 20–50KB, clear — mobile-captured signatures aren't accepted.",
    },
  },
  "maharashtra-police": {
    administeringBody: "Maharashtra Police",
    photo: {
      widthPx: 160, heightPx: 200, minKB: 5, maxKB: 20, format: "jpg",
      generalRequirements: "Passport photo (JPG/PNG) showing face and shoulders clearly, recent, white/light background.",
      rulesLabel: "Rules & Background",
      rulesText: "5–20KB, roughly 160–200px wide by 200px+ tall, colour only, no dark glasses or caps.",
    },
    signature: {
      widthPx: 256, heightPx: 64, minKB: 5, maxKB: 20, format: "jpg",
      generalRequirements: "Signature scan (JPG/PNG), black ink on white paper.",
      rulesLabel: "Rules & Ink",
      rulesText: "5–20KB, 256×64px, legible, not block letters.",
    },
  },
  "up-police": {
    administeringBody: "Uttar Pradesh Police",
    photo: {
      widthPx: 180, heightPx: 225, minKB: 20, maxKB: 50, format: "jpg",
      generalRequirements: "Colour passport photo (35×45mm) from the last 6 months, white/light-grey background preferred.",
      rulesLabel: "Rules & Background",
      rulesText: "20–50KB, clear quality showing face and shoulders, no headgear or dark glasses, shadow-free background.",
    },
    signature: {
      widthPx: 200, heightPx: 80, minKB: 5, maxKB: 20, format: "jpg",
      generalRequirements: "Signature scanned from white paper, black pen.",
      rulesLabel: "Rules & Ink",
      rulesText: "5–20KB, JPG, running hand — not block letters.",
    },
  },
  "tn-police": {
    administeringBody: "Tamil Nadu Police (TNUSRB)",
    photo: {
      widthPx: 275, heightPx: 354, minKB: 20, maxKB: 50, format: "jpg",
      generalRequirements: "Colour passport photo from the last 6 months with your name and date printed at the bottom, on a white/light background.",
      rulesLabel: "Rules & Background",
      rulesText: "Neutral expression, eyes open, no dark glasses or caps — face should dominate the frame.",
    },
    signature: {
      widthPx: 200, heightPx: 80, minKB: 10, maxKB: 20, format: "jpg",
      generalRequirements: "Signature scan in black or dark-blue ink on white paper.",
      rulesLabel: "Rules & Ink",
      rulesText: "10–20KB, legible, running hand, not block/capital letters.",
    },
  },
  "kerala-police": {
    administeringBody: "Kerala Police",
    photo: {
      widthPx: 150, heightPx: 200, minKB: 20, maxKB: 30, format: "jpg",
      generalRequirements: "Passport photo (colour or B&W) from the last 6 months, name and date printed at the bottom, face/shoulders clear.",
      rulesLabel: "Rules & Background",
      rulesText: "Light/white background, eyes open, both ears visible, face centred, no side angles or harsh shadows — stays valid for 10 years once uploaded.",
    },
    signature: {
      widthPx: 150, heightPx: 100, minKB: 20, maxKB: 30, format: "jpg",
      generalRequirements: "Black-ink signature scan on white paper.",
      rulesLabel: "Rules & Ink",
      rulesText: "20–30KB, JPG, legible, not block letters.",
    },
  },
  "bihar-police": {
    administeringBody: "Bihar Police Recruitment Commission (BPSSC)",
    photo: {
      widthPx: 200, heightPx: 230, minKB: 30, maxKB: 50, format: "jpg",
      generalRequirements: "Recent (3–6 months) colour passport photo on a white/light background, face and shoulders centred.",
      rulesLabel: "Rules & Background",
      rulesText: "Under 50KB, eyes open, both ears visible, no cap/headgear (except religious)/tinted glasses/shadows.",
    },
    signature: {
      widthPx: 140, heightPx: 60, minKB: 20, maxKB: 50, format: "jpg",
      generalRequirements: "Signature scan, black or blue ink on white paper.",
      rulesLabel: "Rules & Ink",
      rulesText: "Under 50KB, sharp with no blur.",
    },
  },
  "assam-police": {
    administeringBody: "Assam Police",
    photo: {
      widthPx: 280, heightPx: 350, minKB: 100, maxKB: 450, format: "jpg",
      generalRequirements: "Recent colour passport photo (4.5×3.5cm) with a white background, scanned as JPEG.",
      rulesLabel: "Rules & Background",
      rulesText: "Up to 450KB, no harsh shadows, both ears visible, no dark glasses or caps.",
    },
    signature: {
      widthPx: 280, heightPx: 200, minKB: 50, maxKB: 100, format: "jpg",
      generalRequirements: "Signature scan covering the full signature area, black ink on white paper.",
      rulesLabel: "Rules & Ink",
      rulesText: "Roughly 3.5×2.5cm, up to 100KB, JPEG.",
    },
  },
  "mp-police": {
    administeringBody: "Madhya Pradesh Police",
    photo: {
      widthPx: 200, heightPx: 250, minKB: 50, maxKB: 200, format: "jpg",
      generalRequirements: "Live photo upload against a white background — a recent full-face colour passport photo works too.",
      rulesLabel: "Rules & Background",
      rulesText: "No caps, dark glasses or headgear (except religious), eyes open, name and date printed on it.",
    },
    signature: {
      widthPx: 300, heightPx: 100, minKB: 30, maxKB: 100, format: "jpg",
      generalRequirements: "Signature scan plus a short (40+ word) handwriting sample in your own hand, both uploaded separately.",
      rulesLabel: "Rules & Ink",
      rulesText: "Black ink, plain language for the handwriting sample — both need to be clearly legible.",
    },
  },
  "karnataka-police": {
    administeringBody: "Karnataka Police",
    photo: {
      widthPx: 200, heightPx: 250, minKB: 30, maxKB: 100, format: "jpg",
      generalRequirements: "Recent colour passport photo on a white/light background, face and shoulders clear.",
      rulesLabel: "Rules & Background",
      rulesText: "JPG/JPEG, 30–100KB, no dark glasses or caps, eyes open, no shadows/harsh light.",
    },
    signature: {
      widthPx: 140, heightPx: 80, minKB: 20, maxKB: 50, format: "jpg",
      generalRequirements: "Signature scan, black ink on white paper.",
      rulesLabel: "Rules & Ink",
      rulesText: "JPG/JPEG, 20–50KB, legible, running hand, not block letters.",
    },
  },
  "telangana-police": {
    administeringBody: "Telangana Police",
    photo: {
      widthPx: 275, heightPx: 354, minKB: 20, maxKB: 50, format: "jpg",
      generalRequirements: "Colour passport photo on a white/light background, recent (3–6 months), full frontal view.",
      rulesLabel: "Rules & Background",
      rulesText: "3.5×4.5cm, 20–50KB, no dark glasses or caps, eyes open, no harsh lighting.",
    },
    signature: {
      widthPx: 200, heightPx: 80, minKB: 10, maxKB: 30, format: "jpg",
      generalRequirements: "Signature scan, black or dark-blue ink on white paper.",
      rulesLabel: "Rules & Ink",
      rulesText: "10–30KB, legible, running hand, JPG.",
    },
  },
  "gujarat-police": {
    administeringBody: "Gujarat Police",
    photo: {
      widthPx: 200, heightPx: 250, minKB: 30, maxKB: 100, format: "jpg",
      generalRequirements: "Recent colour passport photo on a white/light background, JPG, face and shoulders clear.",
      rulesLabel: "Rules & Background",
      rulesText: "30–100KB, no dark glasses or caps, eyes open, both ears visible, no harsh shadows.",
    },
    signature: {
      widthPx: 140, heightPx: 80, minKB: 10, maxKB: 50, format: "jpg",
      generalRequirements: "Signature scan, black ink on white paper.",
      rulesLabel: "Rules & Ink",
      rulesText: "10–50KB, JPG, legible, running hand.",
    },
  },
  "jk-police": {
    administeringBody: "Jammu & Kashmir Board of Professional Entrance Examinations (BOPEE)",
    photo: {
      widthPx: 200, heightPx: 250, minKB: 50, maxKB: 200, format: "jpg",
      generalRequirements: "Recent colour passport-style photo on a light background, scanned at good resolution.",
      rulesLabel: "Rules & Background",
      rulesText: "JPEG, 50–200KB, full face and shoulders clear, no dark glasses or caps, eyes open.",
    },
    signature: {
      widthPx: 140, heightPx: 80, minKB: 20, maxKB: 100, format: "jpg",
      generalRequirements: "Signature scan, black or blue ink on white paper — a separate left thumb impression scan is also needed.",
      rulesLabel: "Rules & Ink",
      rulesText: "20–100KB, legible.",
    },
  },
  "delhi-police": {
    administeringBody: "Delhi Police / Staff Selection Commission (SSC)",
    photo: {
      widthPx: 100, heightPx: 120, minKB: 20, maxKB: 50, format: "jpg",
      generalRequirements: "Colour passport photo (3.5×4.5cm) on a white/light background, both ears visible, eyes open.",
      rulesLabel: "Rules & Background",
      rulesText: "Up to 50KB, JPG/JPEG only, no dark glasses/caps/hats, no harsh shadows.",
    },
    signature: {
      widthPx: 140, heightPx: 60, minKB: 10, maxKB: 20, format: "jpg",
      generalRequirements: "Signature scan in dark-blue or black ink on white paper.",
      rulesLabel: "Rules & Ink",
      rulesText: "140×60px, 10–20KB, JPG, running hand — not capital letters.",
    },
  },
  "punjab-police": {
    administeringBody: "Punjab Police / Punjab Public Service Commission",
    photo: {
      widthPx: 200, heightPx: 240, minKB: 20, maxKB: 50, format: "jpg",
      generalRequirements: "Colour passport photo (3.5×4.5cm) from the last 3–6 months, white/light background.",
      rulesLabel: "Rules & Background",
      rulesText: "20–50KB, JPG/JPEG, eyes open, both ears visible, no dark glasses or caps.",
    },
    signature: {
      widthPx: 140, heightPx: 80, minKB: 10, maxKB: 20, format: "jpg",
      generalRequirements: "Signature scan, black or blue ink on white paper.",
      rulesLabel: "Rules & Ink",
      rulesText: "10–20KB, JPG, running hand — not capitals.",
    },
  },
  "hp-police": {
    administeringBody: "Himachal Pradesh Police / HPPSC",
    photo: {
      widthPx: 110, heightPx: 140, minKB: 10, maxKB: 40, format: "jpg",
      generalRequirements: "Recent scanned passport photo (JPG/JPEG), clear face on a white/light background, preferably 110×140px.",
      rulesLabel: "Rules & Background",
      rulesText: "Up to 40KB, no dark glasses/caps/hats, eyes open, both ears visible.",
    },
    signature: {
      widthPx: 140, heightPx: 110, minKB: 10, maxKB: 40, format: "jpg",
      generalRequirements: "Signature scan, black ink, running hand, on white paper.",
      rulesLabel: "Rules & Ink",
      rulesText: "140×110px, up to 40KB, JPG, not block/capital letters.",
    },
  },
  "uttarakhand-police": {
    administeringBody: "Uttarakhand Police Department",
    photo: {
      widthPx: 150, heightPx: 200, minKB: 10, maxKB: 20, format: "jpg",
      generalRequirements: "Recent (3–6 months) colour passport photo (3.5×4.5cm) on a white/light background.",
      rulesLabel: "Rules & Background",
      rulesText: "10–20KB, JPG/JPEG, eyes open, both ears visible, no dark glasses or caps.",
    },
    signature: {
      widthPx: 150, heightPx: 100, minKB: 10, maxKB: 20, format: "jpg",
      generalRequirements: "Signature scan from plain unlined white paper, black or dark-blue gel pen.",
      rulesLabel: "Rules & Ink",
      rulesText: "150×100px, 10–20KB, JPG, running hand — not capital letters.",
    },
  },
  "odisha-police": {
    administeringBody: "Odisha Police",
    photo: {
      widthPx: 200, heightPx: 240, minKB: 35, maxKB: 50, format: "jpg",
      generalRequirements: "Recent scanned colour passport photo (3.5×4.5cm) on a white/light background.",
      rulesLabel: "Rules & Background",
      rulesText: "35–50KB, JPG/JPEG, no dark glasses or caps, both ears and neck visible in frontal view.",
    },
    signature: {
      widthPx: 140, heightPx: 60, minKB: 25, maxKB: 50, format: "jpg",
      generalRequirements: "Signature scan, black or dark-blue ink on white paper.",
      rulesLabel: "Rules & Ink",
      rulesText: "140×60px, 25–50KB, JPG, running hand — not block letters.",
    },
  },
  "cg-police": {
    administeringBody: "Chhattisgarh Police Department",
    photo: {
      widthPx: 200, heightPx: 240, minKB: 50, maxKB: 200, format: "jpg",
      generalRequirements: "Recent colour passport photo (3.5×4.5cm) on a white/light background.",
      rulesLabel: "Rules & Background",
      rulesText: "50–200KB, JPG/JPEG or PNG, eyes open, no dark glasses or caps.",
    },
    signature: {
      widthPx: 140, heightPx: 80, minKB: 10, maxKB: 50, format: "jpg",
      generalRequirements: "Signature scan, black ink, running hand, on white paper.",
      rulesLabel: "Rules & Ink",
      rulesText: "140×80px, 10–50KB, JPG/PNG, not capitals.",
    },
  },
  "goa-police": {
    administeringBody: "Goa Police",
    photo: {
      widthPx: 600, heightPx: 600, minKB: 20, maxKB: 500, format: "jpg",
      generalRequirements: "Square colour photo (600×600px), taken within 6 months, full-face frontal view with ~70% face visibility on a white, blue or black background.",
      rulesLabel: "Rules & Background",
      rulesText: "Up to 500KB, JPG/JPEG/PNG/BMP/GIF, neutral expression, both eyes open, no headwear obscuring the hair.",
    },
    signature: {
      widthPx: 200, heightPx: 100, minKB: 10, maxKB: 50, format: "jpg",
      generalRequirements: "Signature scan, black ink on white paper.",
      rulesLabel: "Rules & Ink",
      rulesText: "10–50KB, JPG, running hand — not block letters.",
    },
  },
  "meghalaya-police": {
    administeringBody: "Meghalaya Police / Meghalaya Recruitment Board",
    photo: {
      widthPx: 140, heightPx: 178, minKB: 20, maxKB: 50, format: "jpg",
      generalRequirements: "Passport photo with a name plate (35×45mm) on a red background — must be pasted (not pinned) onto the form.",
      rulesLabel: "Rules & Background",
      rulesText: "20–50KB, clear face, eyes open, no caps or goggles.",
    },
    signature: {
      widthPx: 178, heightPx: 140, minKB: 10, maxKB: 50, format: "jpg",
      generalRequirements: "Signature on white paper in black ink, with your name and date printed in capitals underneath.",
      rulesLabel: "Rules & Ink",
      rulesText: "178×140px, 10–50KB, JPG, legible.",
    },
  },
  "manipur-police": {
    administeringBody: "Manipur Police / Manipur Public Service Commission",
    photo: {
      widthPx: 200, heightPx: 240, minKB: 20, maxKB: 50, format: "jpg",
      generalRequirements: "Passport photo (3.5×4.5cm) in formal attire against a solid colour background (blue, green or red).",
      rulesLabel: "Rules & Background",
      rulesText: "20–50KB, JPG/JPEG, recent, clear face, eyes open, no dark glasses or caps.",
    },
    signature: {
      widthPx: 140, heightPx: 80, minKB: 10, maxKB: 20, format: "jpg",
      generalRequirements: "Signature scan, black ink on white paper.",
      rulesLabel: "Rules & Ink",
      rulesText: "140×80px, 10–20KB, JPG, running hand — not capitals.",
    },
  },
  "tripura-police": {
    administeringBody: "Tripura Police",
    photo: {
      widthPx: 200, heightPx: 240, minKB: 20, maxKB: 50, format: "jpg",
      generalRequirements: "Recent colour passport photo (3.5×4.5cm) on a white/light background, clearly identifiable.",
      rulesLabel: "Rules & Background",
      rulesText: "20–50KB, JPG/JPEG, eyes open, both ears visible, no dark glasses or caps, face centred.",
    },
    signature: {
      widthPx: 140, heightPx: 80, minKB: 10, maxKB: 20, format: "jpg",
      generalRequirements: "Signature scan, black ink, running hand, on white paper.",
      rulesLabel: "Rules & Ink",
      rulesText: "140×80px, 10–20KB, JPG, not block/capital letters.",
    },
  },
  "delhi-judiciary": {
    administeringBody: "Delhi High Court",
    photo: {
      widthPx: 200, heightPx: 240, minKB: 20, maxKB: 50, format: "jpg",
      generalRequirements: "Recent colour passport photo (4.5×3.5cm) on a mandatory white/light background.",
      rulesLabel: "Rules & Background",
      rulesText: "20–50KB, JPG/JPEG, eyes open, both ears visible, no dark glasses/caps/hats/harsh shadows.",
    },
    signature: {
      widthPx: 140, heightPx: 80, minKB: 10, maxKB: 20, format: "jpg",
      generalRequirements: "Signature scan, black ink, running hand, on white paper.",
      rulesLabel: "Rules & Ink",
      rulesText: "~3×1.5cm, 10–20KB, JPG, not block/capital letters.",
    },
  },
  "patna-hc-stenographer": {
    administeringBody: "Patna High Court",
    photo: {
      widthPx: 200, heightPx: 240, minKB: 20, maxKB: 50, format: "jpg",
      generalRequirements: "Recent colour passport photo (4.5×3.5cm) on a clear, ideally white/light background — full face, ears and neck visible frontally.",
      rulesLabel: "Rules & Background",
      rulesText: "20–50KB, JPG/JPEG, neutral expression, eyes forward, no dark glasses/caps/hats/shadows/red-eye.",
    },
    signature: {
      widthPx: 140, heightPx: 80, minKB: 10, maxKB: 20, format: "jpg",
      generalRequirements: "Signature scan, black ink, running hand, on white paper.",
      rulesLabel: "Rules & Ink",
      rulesText: "10–20KB, JPG/JPEG, legible, done only by the candidate — not block letters.",
    },
  },
  "bombay-hc-clerk": {
    administeringBody: "Bombay High Court (Maharashtra)",
    photo: {
      widthPx: 200, heightPx: 240, minKB: 20, maxKB: 50, format: "jpg",
      generalRequirements: "Latest passport photo (3.5×4.5cm), recent (ideally 3–6 months), white/light background.",
      rulesLabel: "Rules & Background",
      rulesText: "JPG/JPEG, face clearly visible, no dark glasses or caps, both ears visible, eyes open, legible file.",
    },
    signature: {
      widthPx: 120, heightPx: 80, minKB: 10, maxKB: 20, format: "jpg",
      generalRequirements: "Signature (3×2.5cm) in black ballpoint pen on white paper, running hand — sign the admit card identically at the exam.",
      rulesLabel: "Rules & Ink",
      rulesText: "JPG/JPEG, clear and legible. Only the candidate can sign.",
    },
  },
  "himachal-hc-stenographer": {
    administeringBody: "Himachal Pradesh High Court",
    photo: {
      widthPx: 200, heightPx: 240, minKB: 20, maxKB: 50, format: "jpg",
      generalRequirements: "Recent colour passport photo on a white background, ~3.5×4.5cm (200×240px), eyes open.",
      rulesLabel: "Rules & Background",
      rulesText: "20–50KB, JPG/JPEG/PNG, no dark glasses/caps/hats, both ears visible, no harsh shadows or red-eye.",
    },
    signature: {
      widthPx: 140, heightPx: 80, minKB: 10, maxKB: 20, format: "jpg",
      generalRequirements: "Signature scan, black ink, running hand, on white paper — done only by the candidate.",
      rulesLabel: "Rules & Ink",
      rulesText: "10–20KB, JPG/JPEG/PNG, legible, not block/capital letters.",
    },
  },
  "gauhati-hc-clerk": {
    administeringBody: "Gauhati High Court (Assam)",
    photo: {
      widthPx: 200, heightPx: 240, minKB: 20, maxKB: 100, format: "jpg",
      generalRequirements: "Recent (within 6 months) colour passport photo on a white/light background, eyes open, both ears visible.",
      rulesLabel: "Rules & Background",
      rulesText: "20–100KB, JPG/JPEG, no dark glasses/caps/hats, face centred and clearly identifiable.",
    },
    signature: {
      widthPx: 140, heightPx: 80, minKB: 10, maxKB: 50, format: "jpg",
      generalRequirements: "Signature scan, black ink, running hand, on white paper.",
      rulesLabel: "Rules & Ink",
      rulesText: "10–50KB, JPG/JPEG, only the candidate's own signature is valid, not block letters.",
    },
  },
  "maharashtra-judiciary": {
    administeringBody: "Maharashtra Public Service Commission (MPSC)",
    photo: {
      widthPx: 200, heightPx: 240, minKB: 20, maxKB: 50, format: "jpg",
      generalRequirements: "Recent colour passport photo (4.5×3.5cm) on a white/light background, face/neck/shoulders clearly visible.",
      rulesLabel: "Rules & Background",
      rulesText: "20–50KB, JPG/JPEG, eyes forward, no dark glasses/caps/hats, no partial views or harsh shadows.",
    },
    signature: {
      widthPx: 140, heightPx: 80, minKB: 10, maxKB: 20, format: "jpg",
      generalRequirements: "Signature scan, black ink on white paper.",
      rulesLabel: "Rules & Ink",
      rulesText: "~140×80px, 10–20KB, JPG, clear running hand — not block/capital letters.",
    },
  },
  "chhattisgarh-judiciary": {
    administeringBody: "Chhattisgarh Public Service Commission (CGPSC)",
    photo: {
      widthPx: 200, heightPx: 240, minKB: 20, maxKB: 100, format: "jpg",
      generalRequirements: "Passport photo on a light-coloured background, ~200×240px, face clearly visible.",
      rulesLabel: "Rules & Background",
      rulesText: "Up to 100KB, JPG/JPEG, no dark glasses/caps/hats, eyes open, both ears visible, face centred.",
    },
    signature: {
      widthPx: 140, heightPx: 80, minKB: 10, maxKB: 100, format: "jpg",
      generalRequirements: "Clear black-ink signature on white paper, scanned and uploaded separately.",
      rulesLabel: "Rules & Ink",
      rulesText: "Up to 100KB, JPG, running hand — must be the candidate's own signature, not block letters.",
    },
  },
  "rajasthan-judiciary": {
    administeringBody: "Rajasthan High Court",
    photo: {
      widthPx: 240, heightPx: 320, minKB: 20, maxKB: 50, format: "jpg",
      generalRequirements: "Recent (within 6 months) colour photo (3.5×4.5cm) on a white/light background, face clearly visible.",
      rulesLabel: "Rules & Background",
      rulesText: "20–50KB, JPEG, no dark glasses/caps/hats, both ears visible, face covering at least half the frame.",
    },
    signature: {
      widthPx: 280, heightPx: 80, minKB: 20, maxKB: 50, format: "jpg",
      generalRequirements: "Sign inside a 7×2cm box on white paper with black or dark-blue pen.",
      rulesLabel: "Rules & Ink",
      rulesText: "20–50KB, JPEG, 280×80 to 560×160px, clear running hand.",
    },
  },
  "karnataka-judiciary": {
    administeringBody: "Karnataka High Court",
    photo: {
      widthPx: 200, heightPx: 240, minKB: 20, maxKB: 50, format: "jpg",
      generalRequirements: "Recent colour passport photo (~200×240px) on a white/light background, eyes open.",
      rulesLabel: "Rules & Background",
      rulesText: "20–50KB, JPG/JPEG, both ears visible, no dark glasses/caps/hats, clearly identifiable.",
    },
    signature: {
      widthPx: 140, heightPx: 80, minKB: 10, maxKB: 20, format: "jpg",
      generalRequirements: "Signature scan, black ink, running hand, on white paper.",
      rulesLabel: "Rules & Ink",
      rulesText: "10–20KB, JPG, legible — not block/capital letters, candidate only.",
    },
  },
  "wb-judiciary": {
    administeringBody: "West Bengal Public Service Commission (WBPSC)",
    photo: {
      widthPx: 200, heightPx: 240, minKB: 20, maxKB: 50, format: "jpg",
      generalRequirements: "Recent colour passport photo (4.5×3.5cm) on a white/light background, clearly identifiable face.",
      rulesLabel: "Rules & Background",
      rulesText: "20–50KB, JPG/JPEG, no dark glasses/caps/hats, eyes open, both ears visible.",
    },
    signature: {
      widthPx: 140, heightPx: 80, minKB: 10, maxKB: 20, format: "jpg",
      generalRequirements: "Signature scan, black ink, running hand, on white paper.",
      rulesLabel: "Rules & Ink",
      rulesText: "10–20KB, JPG, not block/capital letters — candidate's own signature only.",
    },
  },
};
