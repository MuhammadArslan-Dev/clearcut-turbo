"use client";

import * as React from "react";
import { useServerInsertedHTML } from "next/navigation";
import { CacheProvider } from "@emotion/react";
import { createEmotionCache } from "@/lib/emotion-cache";

/**
 * Emotion SSR integration for the App Router.
 *
 * Without this, `@emotion/react`'s `<Global>` (used by MUI Joy's
 * `CssVarsProvider` for its CSS-variable and reset styles) renders a real
 * `<style data-emotion="css-global …">` element *inside the React tree* during
 * SSR, but renders `null` on the client. React sees a `<style>` where it
 * expects the next real element and throws hydration error #418 — "the server
 * rendered HTML didn't match the client. As a result this tree will be
 * regenerated on the client." Regenerating the whole tree pushed the blog
 * homepage's LCP element (a server-rendered `<h1>`) from first paint out to
 * after hydration: measured LCP 5.26s on mobile, 91% of it Render Delay.
 *
 * Setting `cache.compat = true` flips `<Global>` to register its styles in
 * `cache.inserted` and return `null` on the server too, so the SSR and client
 * trees match. The registered styles are then flushed into the document via
 * `useServerInsertedHTML` so they still arrive before first paint (no FOUC).
 */
export default function EmotionProvider({ children }: { children: React.ReactNode }) {
  const [{ cache, flush }] = React.useState(() => {
    const cache = createEmotionCache();
    // Opt into Emotion's "compat" SSR mode — see the note above. This is the
    // line that actually removes the `<style>` element from the SSR tree.
    cache.compat = true;

    const prevInsert = cache.insert;
    let inserted: string[] = [];

    cache.insert = (...args: Parameters<typeof prevInsert>) => {
      const serialized = args[1];
      if (cache.inserted[serialized.name] === undefined) {
        inserted.push(serialized.name);
      }
      return prevInsert(...args);
    };

    const flush = () => {
      const prev = inserted;
      inserted = [];
      return prev;
    };

    return { cache, flush };
  });

  useServerInsertedHTML(() => {
    const names = flush();
    if (names.length === 0) return null;

    let styles = "";
    for (const name of names) {
      const style = cache.inserted[name];
      // `cache.inserted[name]` is `true` (not a string) for styles Emotion has
      // already written to a real stylesheet; only serialized strings need to
      // be emitted here.
      if (typeof style === "string") {
        styles += style;
      }
    }

    if (!styles) return null;

    return (
      <style
        key={cache.key}
        data-emotion={`${cache.key} ${names.join(" ")}`}
        dangerouslySetInnerHTML={{ __html: styles }}
      />
    );
  });

  return <CacheProvider value={cache}>{children}</CacheProvider>;
}
