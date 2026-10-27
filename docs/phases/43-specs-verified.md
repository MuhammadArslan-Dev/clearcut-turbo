# Phase 43 — Teaching-exam upload specs, verified against official sources

**Checked:** 2026-10-27 (research agent; official PDFs/portal pages only; copies in the session scratchpad `dl/`).
**Rule (CC-159):** numbers on the site come only from the official notice or live portal. No verbatim portal error text was found in any official document — leave every "exact message" list empty until the team captures one from a live portal.

## Comparison with what the live tool uses today

| Exam | Document | Live tool (tools API) | Official | Source | Status |
|---|---|---|---|---|---|
| CTET | Photo | 350×450 px, 10–100 KB, jpg | JPG/JPEG, 10–100 KB, 3.5 × 4.5 cm | CTET Sept 2026 Information Bulletin, §2(c) p.3 — https://cdnbbsr.s3waas.gov.in/s3443dec3062d0286986e21dc0631734c9/uploads/2026/05/202605111250310617.pdf | ✅ matches (px are our conversion; bulletin gives cm only) |
| CTET | Signature | 350×150 px, 3–30 KB | JPG/JPEG, 3–30 KB, 3.5 × 1.5 cm | same | ✅ matches |
| UGC NET | Photo | 350×450 px, 10–200 KB | 10–200 KB; colour or B&W, 80% face incl. ears, white background; format + px/cm not stated | Updated Information Bulletin UGC-NET Dec 2026 (16.10.2026), Step-2 p.5 — https://cdnbbsr.s3waas.gov.in/s301eee509ee2f68dc6014898c309e86bf/uploads/2026/10/20261016860019603.pdf | ✅ KB matches |
| UGC NET | Signature | 350×150 px, **4–30 KB** | **10–50 KB** | same | ❌ wrong range |
| UGC NET | PwD/UDID certificate | — | PDF 50–300 KB (PwD only) | same | not a tool preset |
| HTET | Photo | 200×230 px, 20–50 KB | JPEG/JPG 20–50 KB; white background, ≥60% visibility; no px stated | https://htet.eapplynow.com/PhotoUploadInfo.html | ✅ KB matches |
| HTET | Signature | 140×60 px, **10–20 KB** | JPEG/JPG **10–50 KB** | same | ❌ wrong max |
| HTET | Left thumb | **missing** | JPEG/JPG 10–50 KB | same | ❌ missing document |
| HTET | PwD certificate | — | PDF 50–200 KB (PwD only, if applicable) | same + HowtoApply.html step 5 | not a tool preset |
| HPTET | Photo | 200×230 px, **20–50 KB** | jpg, **less than 20 KB**, 3.5 × 4.5 cm; no minimum stated | HPBOSE TET Nov 2026 Prospectus §7.B p.9 — https://hpbose.org/Admin/Upload/PROSPEECTUSTETNOVEMBER2026FINAL.pdf | ❌ tool output is rejected (too large) |
| HPTET | Signature | 140×60 px, **10–20 KB** | jpg, **less than 15 KB**, 3.5 × 1.5 cm | same | ❌ wrong |
| REET | Photo | 200×230 px, 20–50 KB | JPG/JPEG 20–50 KB; ≤ 3 months old; no px | REET-2024 FAQ Q.11 + sample form — https://reet-bucket.blr1.cdn.digitaloceanspaces.com/REET2024-Prod/docs/faq-reet2024.pdf | ✅ KB matches (REET-2024 is the latest cycle) |
| REET | Signature | 140×60 px, **10–20 KB** | JPG/JPEG **20–50 KB**, black pen | same | ❌ tool output (~19.6 KB) is below the minimum |
| REET | Aadhaar image, Class 10 marksheet | — | JPG/JPEG 50–100 KB each | same | not tool presets today |
| UPTET | all | 200×230 / 140×60 (placeholder) | **not verified** — upessc.up.gov.in unreachable from outside India; third-party figures conflict | — | ⛔ do not publish |

## Cycle / window notes
- CTET Sept 2026: exam moved to 12–13 Dec 2026; no next cycle announced.
- UGC NET Dec 2026: applications close 28 Oct 2026 (late fee to 31 Oct), corrections 02–04 Nov, exam 14–19 Dec 2026. Live site is ugcnet.nta.nic.in (ugcnet.nta.ac.in is stale).
- HTET: HTET-2026 announced for 2026 (BSEH notice, 30 Sep 2026); no bulletin yet — specs may change.
- HPTET Nov 2026: window closed; exam 22 Nov – 6 Dec 2026.
- REET: no 2026 notice.

## Implementation notes
- Only CTET and HPTET give cm; nobody gives px. The tool needs px, so px stay our choice — the page should not imply px are official.
- HPTET gives maxima only (no minimum KB); the tool needs a minimum.
- No official document quotes a verbatim upload error.
