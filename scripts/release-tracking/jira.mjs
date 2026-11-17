// Jira Cloud client (phase 117): Basic auth with `email:API token` (Atlassian "basic auth for REST APIs").
// Endpoints: GET /rest/api/3/issue/{key}, GET .../comment (paged), POST .../comment with an ADF body.
// The comment collection path was confirmed from a real issue's `fields.comment.self` link; the POST body shape is
// NOT yet verified against a live write (needs the service-account token, see phase doc §6).
import { requestJson } from "./http.mjs";

export function createJiraClient({ baseUrl, email, token, fetchImpl, backoffMs }) {
  const origin = String(baseUrl).replace(/\/+$/, "");
  const auth = "Basic " + Buffer.from(`${email}:${token}`).toString("base64");
  const api = (path, opts = {}) => requestJson(`${origin}/rest/api/3${path}`, { headers: { Authorization: auth }, fetchImpl, backoffMs, ...opts });

  return {
    /** null when the ticket does not exist or is not visible to the service account (Jira answers 404 for both). */
    async getIssue(key) {
      try {
        return await api(`/issue/${encodeURIComponent(key)}?fields=summary,issuetype,status`, { retries: 2 });
      } catch (e) {
        if (e.status === 404) return null;
        throw e;
      }
    },
    async listComments(key) {
      const all = [];
      let startAt = 0;
      for (;;) {
        const page = await api(`/issue/${encodeURIComponent(key)}/comment?startAt=${startAt}&maxResults=100`, { retries: 2 });
        const batch = page?.comments ?? [];
        all.push(...batch);
        startAt += batch.length;
        if (!batch.length || startAt >= (page.total ?? startAt)) break;
      }
      return all;
    },
    /** Never retried automatically (see http.mjs): the next run re-checks for the marker. */
    async addComment(key, adfBody) {
      return api(`/issue/${encodeURIComponent(key)}/comment`, { method: "POST", body: { body: adfBody }, retries: 0 });
    },
  };
}
