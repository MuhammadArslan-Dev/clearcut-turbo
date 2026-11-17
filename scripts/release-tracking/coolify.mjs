// Read-only Coolify client (phase 117). Only GET /api/v1/deployments/applications/{uuid}; the token is never logged.
import { readFileSync, existsSync } from "node:fs";

/** Panel URLs may be pasted with /mcp or /api/v1 on the end; the REST base is the bare origin. */
export function normalizeBase(url) {
  return String(url).trim().replace(/\/+$/, "").replace(/\/(mcp|api\/v1)$/, "");
}

/** <HOST>_COOLIFY_URL / <HOST>_COOLIFY_TOKEN from the environment (CI secrets) or the git-ignored local file `coolify-token`. */
export function loadCredentials(host, { env = process.env, file = "coolify-token" } = {}) {
  const fromFile = {};
  if (existsSync(file)) {
    for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
      if (m && !line.trim().startsWith("#")) fromFile[m[1]] = m[2];
    }
  }
  const pick = (key) => env[key] || fromFile[key] || "";
  const url = pick(`${host.toUpperCase()}_COOLIFY_URL`);
  const token = pick(`${host.toUpperCase()}_COOLIFY_TOKEN`);
  if (!url || !token || url.includes("REPLACE_ME") || token.includes("REPLACE_ME")) return null;
  return { baseUrl: normalizeBase(url), token };
}

async function getJson(url, token, { retries = 2, backoffMs = 1000, fetchImpl = fetch } = {}) {
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetchImpl(url, { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" }, signal: AbortSignal.timeout(20_000) });
      if (res.ok) return await res.json();
      // 4xx is a real answer (bad token, wrong uuid): never retried. 5xx / 429 are retried.
      if (res.status < 500 && res.status !== 429) throw Object.assign(new Error(`Coolify answered HTTP ${res.status}`), { retryable: false });
      lastError = new Error(`Coolify answered HTTP ${res.status}`);
    } catch (e) {
      if (e.retryable === false) throw e;
      lastError = e;
    }
    if (attempt < retries) await new Promise((r) => setTimeout(r, backoffMs * 2 ** attempt));
  }
  throw lastError;
}

/**
 * Newest-first deployments of one app. Pages with skip/take until `enough(rows)` is true or the history ends.
 * `complete` is true only when the whole history was read.
 */
export async function fetchDeployments({ baseUrl, token, uuid, take = 30, maxPages = 6, enough = () => false, fetchImpl, backoffMs }) {
  const rows = [];
  let total = Infinity;
  for (let page = 0; page < maxPages && rows.length < total; page++) {
    const data = await getJson(`${baseUrl}/api/v1/deployments/applications/${uuid}?skip=${rows.length}&take=${take}`, token, { fetchImpl, backoffMs });
    const batch = data.deployments ?? [];
    total = data.count ?? rows.length + batch.length;
    rows.push(...batch);
    if (batch.length === 0 || enough(rows)) break;
  }
  return { deployments: rows, complete: rows.length >= total };
}
