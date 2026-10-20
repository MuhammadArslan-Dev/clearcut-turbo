// DOM attribute shared by the server card and its client controller. Kept
// out of the "use client" module: a value exported from one reaches server
// code as a client reference, not the string.

/** Marks a card's server-rendered answer + explanation <details>, which
 * QuestionInteraction opens/closes. */
export const EXPLANATION_ATTR = "data-explanation";
