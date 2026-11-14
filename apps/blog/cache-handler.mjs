// Next.js `cacheHandler` entry (phase 113) — a thin, edge-safe proxy.
//
// The real Redis implementation is cache-handler.impl.mjs. It must NOT be imported statically here:
// Turbopack also bundles whatever `cacheHandler` points to into the Edge middleware chunk, and the
// cache-handler library / Redis client use Node-only modules (`node:assert/strict`, zlib) — in the
// Edge sandbox that threw at load time and made every page return 500. So the implementation is loaded
// with a runtime `import()` the bundler is told to ignore, and only when Next (Node) actually calls the
// handler. At the Edge nothing here is ever called.
//
// Why Redis at all: see cache-handler.impl.mjs.

// Sibling file of THIS module. Natively loaded by Node, import.meta.url is this file; built by string slicing
// (not new URL(..., import.meta.url)) so the bundler does not try to pull the implementation into the Edge chunk.
function implUrl() {
  const here = import.meta.url;
  return here.slice(0, here.lastIndexOf("/") + 1) + "cache-handler.impl.mjs";
}

let loading;
function inner(options) {
  loading ??= import(/* webpackIgnore: true */ /* turbopackIgnore: true */ implUrl()).then(
    (mod) => new mod.default(options),
  );
  return loading;
}

export default class BlogCacheHandler {
  constructor(options) {
    this.options = options;
  }

  async get(...args) {
    return (await inner(this.options)).get(...args);
  }

  async set(...args) {
    return (await inner(this.options)).set(...args);
  }

  async revalidateTag(...args) {
    return (await inner(this.options)).revalidateTag(...args);
  }

  resetRequestCache() {
    // Per-request in-memory reset: nothing to do for a handler that keeps no per-request state.
  }
}
