/** Minimal well-formedness check: every open tag closes, in order. */
export function isWellFormed(xml: string): boolean {
  const body = xml.replace(/^<\?xml[^>]*\?>\s*/, "");
  const stack: string[] = [];
  for (const [, closing, name, selfClosing] of body.matchAll(/<(\/?)([A-Za-z][\w:.-]*)[^>]*?(\/?)>/g)) {
    if (selfClosing) continue;
    if (closing) {
      if (stack.pop() !== name) return false;
    } else {
      stack.push(name);
    }
  }
  return stack.length === 0 && !/&(?!(amp|lt|gt|quot|apos);)/.test(body);
}
