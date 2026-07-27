/**
 * Zod-free phone constants.
 *
 * This module exists purely so that consumers who need the raw regex do NOT
 * pull zod into their bundle.
 *
 * `common/phone.ts` builds `indianMobileSchema` with a top-level
 * `z.string().regex(...)` call. A bundler cannot prove that call is
 * side-effect-free, so it is retained even when a consumer imports only
 * `INDIAN_MOBILE_REGEX` — and zod comes with it. That is not a hypothetical:
 * `@clearcut/auth`'s validators.ts imports only the regex, and it was one of
 * the paths putting all of zod into the initial client bundle of every public
 * page (measured: 73 KB chunk, 83% unused, loaded before DCL).
 *
 * Splitting the constant out keeps the value in exactly one place — phone.ts
 * re-exports it, so both `@clearcut/validation/common/phone` and this module
 * remain valid import paths and no consumer has to change.
 */

/**
 * Indian mobile number: 10 digits, first digit 6-9. Matches the pattern
 * already used ad-hoc across the auth flow — consolidated here instead of
 * re-declared per call site.
 */
export const INDIAN_MOBILE_REGEX = /^[6-9]\d{9}$/;
