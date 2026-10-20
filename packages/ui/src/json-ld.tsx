type JsonLdProps = {
  data: Record<string, any>;
  id?: string;
};

// `JSON.stringify` output goes straight into `dangerouslySetInnerHTML` inside
// a <script> tag. Any field value containing the literal substring
// "</script" (plausible in explanation/question text sourced from a backend,
// not just user input) would close the tag early and let the rest of its
// content render/execute as HTML — the standard, documented risk of
// embedding untrusted JSON this way. Escaping "<" as its JSON unicode escape
// is the standard mitigation: valid JSON (parses back to the same string),
// but can never form "</script" in the emitted HTML.
function escapeJsonLd(json: string): string {
  return json.replace(/</g, "\\u003c");
}

export default function JsonLd({ data, id }: JsonLdProps) {
  return (
    <script
      id={id}
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: escapeJsonLd(JSON.stringify(data)),
      }}
    />
  );
}
