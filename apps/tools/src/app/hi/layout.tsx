// Next's root layout (app/layout.tsx) is the only file allowed to define
// <html>, and it's shared by the English AND Hindi trees (this static export
// has no middleware to make <html lang> vary per route the way next-intl's
// [locale] layout does elsewhere in the monorepo — see globals.css's
// ":lang(hi)" comment). This nested layout instead scopes lang="hi" to a
// wrapping <div>, which :lang(hi) still matches for every element inside it.
export default function HindiLayout({ children }: { children: React.ReactNode }) {
  return <div lang="hi">{children}</div>;
}
