// Module-scoped cache, not a hook — every caller (any number of mounted
// components) shares the same in-flight/resolved promise for a given src, so
// concurrently-rendered instances issue exactly one network request between
// them instead of one each.
const cache = new Map<string, Promise<ArrayBuffer>>();

export function loadLottieAsset(src: string): Promise<ArrayBuffer> {
  let promise = cache.get(src);
  if (!promise) {
    promise = fetch(src).then((res) => res.arrayBuffer());
    cache.set(src, promise);
  }
  return promise;
}
