// Single source of truth for which exams this app serves. A page rejects
// (redirects home / 404s) any examName segment not in this list — add an
// exam here only once its backend content (sections + questions) is real,
// not just a stub navigation entry.
export const ALLOWED_EXAMS = ["ctet", "htet", "hptet"];
