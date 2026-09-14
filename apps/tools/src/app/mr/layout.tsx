// Next's root layout (app/layout.tsx) is the only file allowed to define
// <html>, and it's shared by the English, Hindi AND Marathi trees (this
// static export has no middleware to make <html lang> vary per route the
// way next-intl's [locale] layout does elsewhere in the monorepo — see
// globals.css's ":lang(hi), :lang(mr)" comment). This nested layout instead
// scopes lang="mr" to a wrapping <div>, which :lang(mr) still matches for
// every element inside it.
export default function MarathiLayout({ children }: { children: React.ReactNode }) {
  return <div lang="mr">{children}</div>;
}
