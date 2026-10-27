# Phase 43 — Google Sheet edits for the teaching-exam resizers (CC-159)

**For:** the team that edits the tools Google Sheet (`1v37K1Ohbgla8n_Ee7SBAxd3urjhkPd0rNBUHtHx-9Qs`, read by BigQuery `content.tools_*` external tables).
**Sources:** every number is from the official document listed in `43-specs-verified.md`. Checked 2026-10-27.
**After editing:** run the tools-backend syncs (`/api/v1/bigquery/syncToolExamMapping`, the documents and content syncs), check `GET /api/v1/tools/resizer/exams/<slug>`, then build and deploy tools (`TOOLS_DEPLOY.md`; `pnpm build` clears the fetch cache).

Rows are found by `exam_slug` (+ `doc_type` on the documents tab). "—" means leave as is. Old values are what the production API returned on 2026-10-27; if the sheet differs, stop and tell Claude.

Out of scope for now (user, 2026-10-27): UPTET (team verifies later), extra documents (HTET left thumb, REET Aadhaar/marksheet, PwD certificate PDFs).

## Tab `tools_exam_documents`

| exam_slug | doc_type | Column | Old | New |
|---|---|---|---|---|
| ctet | photo | verification | unverified | official_verified |
| ctet | photo | source_url | — | https://cdnbbsr.s3waas.gov.in/s3443dec3062d0286986e21dc0631734c9/uploads/2026/05/202605111250310617.pdf |
| ctet | photo | verified_on | — | 2026-10-27 |
| ctet | photo | note | — | Bulletin: JPG/JPEG 10–100 KB, 3.5 × 4.5 cm. px is our conversion. |
| ctet | signature | verification | unverified | official_verified |
| ctet | signature | source_url | — | (same CTET bulletin URL) |
| ctet | signature | verified_on | — | 2026-10-27 |
| ctet | signature | note | — | Bulletin: JPG/JPEG 3–30 KB, 3.5 × 1.5 cm. |
| htet | photo | verification | unverified | official_verified |
| htet | photo | source_url | — | https://htet.eapplynow.com/PhotoUploadInfo.html |
| htet | photo | verified_on | — | 2026-10-27 |
| htet | photo | note | — | Portal: JPEG/JPG 20–50 KB, white background, ≥60% visibility. No px given. HTET-2026 bulletin pending — re-check. |
| htet | signature | max_kb | 20 | **50** |
| htet | signature | verification | unverified | official_verified |
| htet | signature | source_url | — | https://htet.eapplynow.com/PhotoUploadInfo.html |
| htet | signature | verified_on | — | 2026-10-27 |
| hptet | photo | width_px / height_px | 200 / 230 | **350 / 450** (official 3.5 × 4.5 cm, same conversion as CTET) |
| hptet | photo | min_kb / max_kb | 20 / 50 | **5 / 19** (official: "less than 20 kb", no minimum) |
| hptet | photo | verification | unverified | official_verified |
| hptet | photo | source_url | — | https://hpbose.org/Admin/Upload/PROSPEECTUSTETNOVEMBER2026FINAL.pdf |
| hptet | photo | verified_on | — | 2026-10-27 |
| hptet | photo | note | — | Prospectus TET Nov 2026 §7.B: jpg, less than 20 kb, 3.5 × 4.5 cm. No minimum; 5 KB is ours. |
| hptet | signature | width_px / height_px | 140 / 60 | **350 / 150** (official 3.5 × 1.5 cm) |
| hptet | signature | min_kb / max_kb | 10 / 20 | **5 / 14** (official: "less than 15 kb", no minimum) |
| hptet | signature | verification | unverified | official_verified |
| hptet | signature | source_url | — | (same HPTET prospectus URL) |
| hptet | signature | verified_on | — | 2026-10-27 |
| reet | photo | verification | unverified | official_verified |
| reet | photo | source_url | — | https://reet-bucket.blr1.cdn.digitaloceanspaces.com/REET2024-Prod/docs/faq-reet2024.pdf |
| reet | photo | verified_on | — | 2026-10-27 |
| reet | photo | note | — | REET-2024 FAQ Q.11 + sample form: JPEG 20–50 KB. No px given. No REET-2026 notice yet. |
| reet | signature | min_kb / max_kb | 10 / 20 | **20 / 50** |
| reet | signature | verification | unverified | official_verified |
| reet | signature | source_url | — | (same REET FAQ URL) |
| reet | signature | verified_on | — | 2026-10-27 |
| ugc-net | photo | *(new row)* | — | mode upload, sort_order 1, width_px 350, height_px 450, min_kb 10, max_kb 200, format jpg, is_required TRUE, verification official_verified, source_url https://cdnbbsr.s3waas.gov.in/s301eee509ee2f68dc6014898c309e86bf/uploads/2026/10/20261016860019603.pdf, verified_on 2026-10-27, note "Bulletin Dec 2026: 10–200 KB, colour or B&W, 80% face incl. ears, white background. No format or px given." — uid / mapping_uid as for the other rows of ugc-net's mapping |
| ugc-net | signature | *(new row)* | — | mode upload, sort_order 2, width_px 350, height_px 150, min_kb 10, max_kb 50, format jpg, is_required TRUE, verification official_verified, same source_url, verified_on 2026-10-27, note "Bulletin Dec 2026: 10–50 KB." |

## Tab `tools_exam_mapping`

| exam_slug | Column | Old | New |
|---|---|---|---|
| ugc-net (resizer row) | category_slug / category_uid | empty | the same values as ctet's resizer row (`teaching-exams`) |

## Tab `tools_exam_content` → `data_json`

Add or change only these keys; keep everything else in the JSON as is.

| exam_slug | Key | Old | New |
|---|---|---|---|
| ctet | teachingPageSlug | — | "ctet" |
| htet | teachingPageSlug | — | "htet" |
| hptet | teachingPageSlug | — | "hptet" |
| hptet | noMinimumDocs | — | ["photo", "signature"] |
| hptet | photoSpec | 200×230, 20–50 | widthPx 350, heightPx 450, minSizeKB 5, maxSizeKB 19 |
| hptet | signatureSpec | 140×60, 10–20 | widthPx 350, heightPx 150, minSizeKB 5, maxSizeKB 14 |
| reet | teachingPageSlug | — | "reet" |
| reet | signatureSpec | minSizeKB 10, maxSizeKB 20 | minSizeKB 20, maxSizeKB 50 |
| htet | signatureSpec | maxSizeKB 20 | maxSizeKB 50 |
| ugc-net | sessionTag | — | "Dec 2026" |
| ugc-net | signatureSpec | minSizeKB 4, maxSizeKB 30 | minSizeKB 10, maxSizeKB 50 |
| ugc-net | officialRequirements.photo.rulesText | "Dimensions: 350 × 450 pixels (3.5 cm × 4.5 cm). File size: 10–200 KB in JPG/JPEG format. Unclear or computer-generated images will be rejected by NTA." | "File size: 10–200 KB. The December 2026 bulletin does not state a format or pixel size." |
| ugc-net | officialRequirements.signature.rulesText | "Dimensions: 350 × 150 pixels. File size: 4–30 KB in JPG/JPEG format. Must be in running handwriting. Block letters are not accepted." | "File size: 10–50 KB (UGC-NET December 2026 bulletin)." |

| ugc-net | officialRequirements.signature.generalRequirements | "Candidate's signature on clean white paper using a black or blue ballpoint pen." | "Candidate's signature." (the bulletin says nothing about paper or pen) |

**Open point (not edited — decide):** CTET's `officialRequirements` prose ("face filling 70–80%, both ears visible, glasses okay if glare-free, no caps…", "black or blue ink, running hand… block capitals are rejected") is not in the CTET Sept 2026 bulletin, which states only format, KB, cm and "latest photograph". Once the page says "Verified against ctet.nic.in", that prose sits next to it. Trim it to what the bulletin says, or keep it as general guidance.

`sessionTag` is left empty elsewhere, so titles use the default year 2026.

Never add `portalErrors` until someone has copied a message word for word from a live portal (with the date).
