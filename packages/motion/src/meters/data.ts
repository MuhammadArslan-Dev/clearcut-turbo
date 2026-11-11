/**
 * Cutoff Meter — the 9 states of the studio (HTET Level 2, General, cutoff 90/150), copied
 * verbatim from "Cutoff Meter Studio.html" (lines 431–489). Example data for the gallery and
 * for wiring later; action reasons, impacts, timings and build notes are English-only in the
 * design, the student-facing copy is en + hi.
 */

import type { NibAccessory, NibMood } from "../nibbu";

export type StateKey = "locked" | "calibrating" | "far" | "close" | "cleared" | "safe" | "dropped" | "cooling" | "examnear";

export interface MeterAction {
  t: { en: string; hi: string };
  why: string;
  imp: string;
  time: string;
  cta: string;
  /** neutral (non-marks) impact pill */
  neu: boolean;
}

export interface MeterState {
  k: StateKey;
  lab: { en: string; hi: string };
  desc: string;
  score: number | null;
  prev?: number;
  band: number;
  tests: number;
  trend: number[] | null;
  subj?: number[];
  mood: NibMood;
  acc: NibAccessory;
  cool?: boolean;
  /** days to exam (default 41) */
  exam?: number;
  head: { en: string; hi: string };
  acts: MeterAction[];
  notes: { trigger: string; motion: string; nibbu: string; copy: string; events: string };
}

export const SUBJ: { en: string; hi: string }[] = [{en:"CDP",hi:"बाल विकास"},{en:"Languages",hi:"भाषाएँ"},{en:"Gen. Studies",hi:"सामान्य अध्ययन"},{en:"Subject",hi:"विषय"}];
export const SMAX: number[] = [30,30,30,60];
function A(en: string, hi: string, why: string, imp: string, time: string, cta: string, neu?: boolean): MeterAction {
  return { t: { en, hi }, why, imp, time, cta, neu: !!neu };
}

export const STATES: MeterState[] = [
 {k:"locked",lab:{en:"Locked",hi:"लॉक"},desc:"No test taken yet",score:null,band:0,tests:0,trend:null,mood:"happy",acc:"none",
  head:{en:"I can’t read your level yet. Answer 5 PYQs and I’ll show where you stand against the cutoff.",hi:"अभी मैं आपका लेवल नहीं जानता। 5 PYQ हल करें, मैं बताऊँगा आप कटऑफ़ से कितने दूर हैं।"},
  acts:[A("Take the 5-question test","5 सवालों का टेस्ट दें","Unlocks the meter with a first estimate.","Unlocks meter","2 min","Start test",true),
        A("Or start any topic test","या कोई भी टॉपिक टेस्ट शुरू करें","Any submitted test also unlocks it.","Unlocks meter","10 min","Browse topics",true)],
  notes:{trigger:"User has submitted zero tests (control group of the onboarding A/B also lands here).",motion:"Grey track, lock icon idles. On first submit: lock shakes 3×, breaks upward, track colours in, needle sweeps 0 → score.",nibbu:"happy, default",copy:"Never show a number or ‘0’. Show ‘?’ so it doesn’t read as a failing score.",events:"meter_viewed {state: locked} · meter_unlock_cta_clicked"}},
 {k:"calibrating",lab:{en:"Early estimate",hi:"शुरुआती अनुमान"},desc:"1–2 tests, wide range",score:72,band:15,tests:1,trend:[72],mood:"wow",acc:"none",
  head:{en:"First read: around 72, but it could be anywhere from 57 to 87. Two more tests and I’ll be much surer.",hi:"पहला अनुमान: लगभग 72, पर यह 57 से 87 के बीच कहीं भी हो सकता है। 2 टेस्ट और दें, अनुमान पक्का होगा।"},
  acts:[A("Take a 25-question CDP topic test","CDP का 25 सवालों का टेस्ट दें","CDP is 30 marks and the most repeated PYQ area.","Range ±15 → ±10","15 min","Start",true),
        A("Take your first full mock","अपना पहला फुल मॉक दें","A full mock covers all four sections at once.","Range → ±6","150 min","Schedule",true),
        A("Confirm your category","अपनी कैटेगरी चुनें","Cutoff is 60% (90) for General, 55% (83) for reserved.","Right cutoff line","10 sec","Set",true)],
  notes:{trigger:"1–2 tests submitted, or fewer than 60 questions answered in total.",motion:"Needle sweeps to estimate, wide translucent band around it. Band breathes softly to signal ‘still learning’.",nibbu:"wow",copy:"Say ‘around’ and show the range. Don’t name a zone in bold yet: the pill reads ‘Early estimate’.",events:"meter_viewed {state: calibrating, band: 15}"}},
 {k:"far",lab:{en:"Needs work",hi:"मेहनत ज़रूरी"},desc:"Far below cutoff",score:58,band:7,tests:6,trend:[52,54,53,57,58],subj:[16,17,9,16],mood:"determined",acc:"headband",
  head:{en:"You’re 32 marks away, and that’s fine at 41 days out. Subject is worth 60 marks, so that’s where we start.",hi:"आप 32 अंक दूर हैं, और 41 दिन बचे हैं तो यह ठीक है। विषय 60 अंकों का है, शुरुआत वहीं से करेंगे।"},
  acts:[A("Rebuild Subject basics: 6 science topic tests","विषय की नींव: विज्ञान के 6 टॉपिक टेस्ट","Subject is 60 marks and you score 16 there.","+8 marks","6 × 15 min","Start"),
        A("CDP: Piaget & Vygotsky PYQs","CDP: पियाजे और वायगोत्स्की के PYQ","Most repeated CDP topic in past papers.","+4 marks","20 min","Practice"),
        A("Daily 20-question test, 7 days in a row","रोज़ 20 सवाल, लगातार 7 दिन","Daily practice raises accuracy and moves the meter every day.","+3 marks","12 min/day","Start streak")],
  notes:{trigger:"Predicted score < cutoff − 15, tests ≥ 3.",motion:"Needle settles in red without bounce. No confetti, no shake. Actions slide in one by one.",nibbu:"determined + headband",copy:"Always pair the gap with time left. Lead with the biggest-marks section, not the weakest-percentage one.",events:"meter_action_clicked {state: far, action_id, rank}"}},
 {k:"close",lab:{en:"Almost there",hi:"बस थोड़ा और"},desc:"Within 15 marks",score:82,band:6,tests:9,trend:[70,74,73,79,82],subj:[20,21,13,28],mood:"determined",acc:"none",
  head:{en:"8 marks to the Clear Zone. These 3 moves cover exactly that.",hi:"क्लियर ज़ोन बस 8 अंक दूर है। ये 3 काम ठीक उतने ही अंक दिलाएँगे।"},
  acts:[A("Gen. Studies: reasoning series & coding","सामान्य अध्ययन: रीज़निंग की श्रृंखला व कोडिंग","Your lowest section: 13/30, 41% accuracy.","+3 marks","2 tests","Start"),
        A("Attempt every question in mocks","मॉक में हर सवाल हल करें","You left 9 blank in Mock 3. HTET has no negative marking.","+3 marks","Next mock","See tip"),
        A("Hindi: संधि & समास PYQs","हिंदी: संधि और समास के PYQ","Wrong in 5 of your last 8 attempts.","+2 marks","15 min","Practice")],
  notes:{trigger:"cutoff − 15 ≤ predicted < cutoff.",motion:"Needle springs into amber with a small overshoot. Gap number counts down. Header shows ‘These 3 cover your gap’.",nibbu:"determined",copy:"Make the action impacts add up to the gap. That sum is the hook.",events:"meter_action_clicked {state: close} · gap_covered_shown"}},
 {k:"cleared",lab:{en:"Clear Zone",hi:"क्लियर ज़ोन"},desc:"At or above cutoff",score:94,band:5,tests:14,trend:[82,85,88,91,94],subj:[23,23,17,31],mood:"happy",acc:"cap",
  head:{en:"You’re over the line by 4. Now let’s build a buffer so exam-day nerves can’t push you under.",hi:"आप कटऑफ़ से 4 अंक ऊपर हैं। अब बफ़र बनाते हैं ताकि परीक्षा के दिन घबराहट नीचे न ले जाए।"},
  acts:[A("Build a 10-mark buffer: Maths revision","10 अंकों का बफ़र: गणित रिवीज़न","Maths is 18/30 in your subject section.","+4 marks","3 tests","Start"),
        A("One full mock every Sunday","हर रविवार एक फुल मॉक","Keeps your estimate fresh and tight.","Range → ±3","150 min","Schedule",true),
        A("Re-attempt your 18 wrong PYQs","अपने 18 गलत PYQ दोबारा हल करें","Cheapest marks you can get.","+2 marks","20 min","Retry")],
  notes:{trigger:"cutoff ≤ predicted < cutoff + 10.",motion:"First time only: needle crosses the cutoff line, burst ring + confetti + ‘Cleared ✓’ stamp, Nibbu gets the cap. After that, a calm green state.",nibbu:"happy + cap",copy:"Celebrate once, then point at the buffer. ‘Cleared’ is a prediction, not a result: never say ‘You will pass’.",events:"meter_zone_changed {from: almost, to: clear}"}},
 {k:"safe",lab:{en:"Safe Zone",hi:"सेफ़ ज़ोन"},desc:"Cutoff + 10, tight range",score:108,band:4,tests:22,trend:[96,99,103,106,108],subj:[25,25,20,38],mood:"happy",acc:"star",
  head:{en:"18 above the cutoff with a tight range. Keep it warm with short daily revision.",hi:"कटऑफ़ से 18 ऊपर और अनुमान पक्का। रोज़ थोड़ा रिवीज़न करके इसे बनाए रखें।"},
  acts:[A("Revision mode: 15-minute mixed PYQs daily","रिवीज़न मोड: रोज़ 15 मिनट मिक्स PYQ","Stops the meter from cooling.","Holds Safe Zone","15 min/day","Start",true),
        A("Exam-pace mock: 150 Qs in 140 min","परीक्षा जैसी गति: 140 मिनट में 150 सवाल","Leaves a 10-minute buffer on exam day.","+10 min buffer","140 min","Start",true),
        A("Add CTET to your plan","अपने प्लान में CTET जोड़ें","CDP (30 marks) carries over directly.","Second exam","—","See plans",true)],
  notes:{trigger:"predicted ≥ cutoff + 10 and range ≤ ±5.",motion:"Gold star pops on Nibbu, soft shimmer passes over the arc once.",nibbu:"happy + star",copy:"This is the upsell moment: a second exam, not a discount.",events:"meter_viewed {state: safe} · cross_exam_cta_clicked"}},
 {k:"dropped",lab:{en:"Score dropped",hi:"स्कोर गिरा"},desc:"After a weak test",score:81,prev:88,band:6,tests:12,trend:[79,84,88,88,81],subj:[21,21,15,24],mood:"determined",acc:"headband",
  head:{en:"Mock 4 pulled you down 7. Most misses were percentages. Here’s how to win it back this week.",hi:"मॉक 4 ने 7 अंक कम किए। ज़्यादातर गलतियाँ प्रतिशत में थीं। इस हफ़्ते ऐसे वापस पाएँ।"},
  acts:[A("Review the 12 questions you got wrong","अपने 12 गलत सवाल देखें","8 of 12 were percentage and ratio.","+3 marks","15 min","Review"),
        A("Retake: percentage topic test","दोबारा दें: प्रतिशत टॉपिक टेस्ट","Shows the meter you’ve fixed it.","+2 marks","10 min","Start"),
        A("See your 5-week trend","अपना 5 हफ़्ते का ट्रेंड देखें","One mock moves the meter ±7. Your trend is still up.","Context","—","Open",true)],
  notes:{trigger:"Predicted falls by ≥ 3 after a test submit.",motion:"Needle eases down (no spring), one gentle wobble, red ‘−7’ chip fades. No sad face, no red flash.",nibbu:"determined + headband",copy:"Always name the cause and give the way back in the same card.",events:"meter_drop_shown {delta: -7, cause: test}"}},
 {k:"cooling",lab:{en:"Cooling down",hi:"ठंडा पड़ रहा"},desc:"4 days inactive",score:83,prev:86,band:7,tests:10,trend:[78,82,86,86,83],subj:[21,22,14,26],mood:"sleepy",acc:"zzz",cool:true,
  head:{en:"4 days without practice, so I’ve cooled your score by 3. One 10-minute test warms it back up.",hi:"4 दिन से अभ्यास नहीं, इसलिए स्कोर 3 अंक ठंडा हुआ। 10 मिनट का एक टेस्ट इसे फिर गर्म कर देगा।"},
  acts:[A("10-minute daily test","10 मिनट का डेली टेस्ट","Restores the 3 cooled marks.","+3 marks","10 min","Start"),
        A("Resume: Science chapter 4","जारी रखें: विज्ञान अध्याय 4","You stopped halfway through.","+1 mark","8 min","Resume"),
        A("Set a 7 pm reminder","शाम 7 बजे का रिमाइंडर लगाएँ","Your most active time is 7–9 pm.","Keeps streak","5 sec","Set",true)],
  notes:{trigger:"No practice for 3+ days. Decay ~1 mark/day after day 3, capped at −5. Restores fully on next test.",motion:"Colours desaturate slowly, ❄ chip fades in, Nibbu sleepy with z’s. On next test: colours warm back, ‘+3 restored’ chip.",nibbu:"sleepy + zzz",copy:"Decay is a nudge, so it must be reversible in one session. Say exactly how much and how to get it back.",events:"meter_cooling_shown {days: 4, decay: 3} · push_sent"}},
 {k:"examnear",lab:{en:"Final week",hi:"आख़िरी हफ़्ता"},desc:"Exam in ≤ 7 days",score:87,band:4,tests:19,trend:[80,83,85,86,87],subj:[22,23,15,27],mood:"determined",acc:"none",exam:6,
  head:{en:"6 days left and you’re 3 marks short. No new chapters now, just high-yield PYQs and exam pace.",hi:"6 दिन बचे हैं और आप 3 अंक पीछे हैं। अब नए अध्याय नहीं, सिर्फ़ ज़्यादा आने वाले PYQ और परीक्षा की गति।"},
  acts:[A("Top 50 repeated CDP PYQs","CDP के 50 सबसे ज़्यादा दोहराए गए PYQ","Highest return per minute this week.","+2 marks","25 min","Start"),
        A("Two timed mocks: Wed & Sat","दो टाइम्ड मॉक: बुधवार और शनिवार","Locks exam pace and tightens your estimate.","+1 mark · ±3","2 × 150 min","Schedule"),
        A("Skip-first on long GS maths","लंबे GS गणित सवाल पहले छोड़ें","Saves time for sure-shot questions; come back at the end.","+5 min","Strategy","Learn")],
  notes:{trigger:"Exam date ≤ 7 days away (date auto-set per user).",motion:"Exam chip turns orange with a countdown. Meter animations get shorter (≤ 600 ms) so nothing slows them down.",nibbu:"determined",copy:"Switch actions to revision and strategy only. No new content recommendations.",events:"meter_viewed {state: final_week, days_left}"}}
];

export function stateByKey(k: StateKey): MeterState {
  return STATES.find((s) => s.k === k) ?? STATES[0];
}
