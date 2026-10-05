// Picks the highest-quality JPEG that still fits an exam portal's size limit.
//
// Aims for TARGET_RATIO of the max size rather than the max itself, so the
// file lands safely under the portal's ceiling even after rounding. It never
// aims for the minimum: a file below the minimum is only returned when the
// image cannot reach the minimum at all (the caller then shows it as outside
// target). Nothing is padded to reach the minimum.

export const TARGET_RATIO = 0.98;

const MIN_QUALITY = 0.05;
const MAX_QUALITY = 1;
// Quality steps finer than this change the file size by well under 1%, so
// searching further only costs encode passes.
const QUALITY_TOLERANCE = 0.005;

export type EncodeAtQuality = (quality: number) => Promise<Blob | null>;

async function encodeOrThrow(encode: EncodeAtQuality, quality: number, errorMessage: string): Promise<Blob> {
  const blob = await encode(quality);
  if (!blob) throw new Error(errorMessage);
  return blob;
}

// Binary search for the largest quality whose encoding is <= limit. JPEG size
// grows with quality, so the search is monotonic. `top` is the already-encoded
// MAX_QUALITY result, reused so the top quality isn't encoded twice.
async function highestQualityUnder(
  encode: EncodeAtQuality,
  top: Blob,
  limit: number,
  errorMessage: string,
): Promise<Blob | null> {
  if (top.size <= limit) return top;

  let low = MIN_QUALITY;
  let high = MAX_QUALITY;
  let fit: Blob | null = null;
  while (high - low > QUALITY_TOLERANCE) {
    const mid = (low + high) / 2;
    const blob = await encodeOrThrow(encode, mid, errorMessage);
    if (blob.size <= limit) {
      fit = blob;
      low = mid;
    } else {
      high = mid;
    }
  }
  return fit;
}

/**
 * Returns the best JPEG the encoder can produce under maxBytes:
 * 1. Highest quality that is <= TARGET_RATIO × maxBytes (the normal case).
 * 2. Otherwise highest quality that is <= maxBytes.
 * 3. Otherwise the smallest possible encoding (still over max, so the caller
 *    reports it as outside range rather than hiding the problem).
 * If even the top quality is under the portal's minimum, that file is returned
 * unchanged; the caller's min/max check reports it.
 */
export async function encodeJpegWithinBudget(
  encode: EncodeAtQuality,
  maxBytes: number,
  errorMessage: string,
): Promise<Blob> {
  const top = await encodeOrThrow(encode, MAX_QUALITY, errorMessage);
  const target = maxBytes * TARGET_RATIO;

  const best =
    (await highestQualityUnder(encode, top, target, errorMessage)) ??
    (await highestQualityUnder(encode, top, maxBytes, errorMessage));
  if (best) return best;

  return encodeOrThrow(encode, MIN_QUALITY, errorMessage);
}
