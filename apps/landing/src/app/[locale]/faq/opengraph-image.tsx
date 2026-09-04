import { ImageResponse } from "next/og";

export const alt = "Clear Cutoff — Frequently Asked Questions";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Literal hex, not design tokens: Satori (next/og's renderer) has no
// var()/CSS-custom-property support, so tokens can't resolve here. Values
// copied from packages/design-tokens/tokens.css's --color-brand /
// --color-brand-dark to stay visually in sync with the rest of the site.
const BRAND = "#0083ff";
const BRAND_DARK = "#0053a2";

const COPY = {
  en: {
    eyebrow: "CLEAR CUTOFF",
    title: "Frequently Asked Questions",
    subtitle: "Courses, tests, payments & the refund guarantee — answered.",
  },
  hi: {
    eyebrow: "CLEAR CUTOFF",
    title: "अक्सर पूछे जाने वाले प्रश्न",
    subtitle: "कोर्स, टेस्ट, भुगतान और रिफंड गारंटी से जुड़े जवाब।",
  },
};

export default async function Image({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = locale === "hi" ? COPY.hi : COPY.en;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "90px",
          background: `linear-gradient(135deg, ${BRAND} 0%, ${BRAND_DARK} 100%)`,
        }}
      >
        <div
          style={{
            fontSize: 26,
            fontWeight: 700,
            color: "rgba(255,255,255,0.85)",
            letterSpacing: 6,
            marginBottom: 28,
          }}
        >
          {t.eyebrow}
        </div>
        <div
          style={{
            fontSize: 66,
            fontWeight: 800,
            color: "#ffffff",
            lineHeight: 1.15,
            maxWidth: 920,
          }}
        >
          {t.title}
        </div>
        <div
          style={{
            fontSize: 32,
            color: "rgba(255,255,255,0.88)",
            marginTop: 32,
            maxWidth: 820,
          }}
        >
          {t.subtitle}
        </div>
      </div>
    ),
    { ...size },
  );
}
