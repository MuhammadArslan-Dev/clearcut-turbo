// src/lib/api/globals.ts
//
// Note: confirmed zero importers as of Phase 2 (API & Data Layer) — flagging
// as a dead-code cleanup candidate rather than deleting unilaterally, since
// deletion wasn't part of the approved scope for this file.
import { createFetchClient } from "@clearcut/api/fetch-client";

const client = createFetchClient({ baseUrl: process.env.NEXT_PUBLIC_PAYLOAD_URL ?? "" });

export async function fetchGlobalSections(locale: string) {
  return client.fetchJson(`/api/globals/global-sections?locale=${locale}`, {
    cache: "no-store",
    revalidate: false,
  });
}
