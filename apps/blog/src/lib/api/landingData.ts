// src/lib/api/landingData.ts
import 'server-only'; // Ensure this file is only used on the server
import { createFetchClient } from "@clearcut/api/fetch-client";

const PAYLOAD_URL = process.env.NEXT_PUBLIC_PAYLOAD_URL;

if (!PAYLOAD_URL) {
  throw new Error('NEXT_PUBLIC_PAYLOAD_URL is not defined');
}

const client = createFetchClient({ baseUrl: PAYLOAD_URL });

export async function getPayloadData(collection: string, query?: string) {
  const path = `/api/${collection}${query ? `?${query}` : ''}`;
  try {
    // Revalidate data every 60 seconds
    return await client.fetchJson(path, { revalidate: 60 });
  } catch (error) {
    console.error(`Network or parsing error for ${collection}:`, error);
    throw error;
  }
}

export async function getPayloadGlobal(slug: string, query?: string) {
  const path = `/api/globals/${slug}${query ? `?${query}` : ''}`;
  try {
    // Global settings might revalidate less often
    return await client.fetchJson(path, { revalidate: 3600 });
  } catch (error) {
    console.error(`Network or parsing error for global ${slug}:`, error);
    throw error;
  }
}

export async function getPayloadDocument(collection: string, id: string, query?: string) {
  const path = `/api/${collection}/${id}${query ? `?${query}` : ''}`;
  try {
    return await client.fetchJson(path, { revalidate: 60 });
  } catch (error) {
    console.error(`Network or parsing error for document ${collection}/${id}:`, error);
    throw error;
  }
}

// Helper to get full image URL
export function getMediaURL(filename: string | undefined): string {
  if (!filename) return '';
  return `${process.env.NEXT_PUBLIC_PAYLOAD_MEDIA_URL}/${filename}`;
}
