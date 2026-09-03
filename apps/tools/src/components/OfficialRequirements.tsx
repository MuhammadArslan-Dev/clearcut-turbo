import Text from "@clearcut/ui/text";
import { ExamOfficialRequirements, OfficialRequirementCard } from "@/lib/officialRequirements";
import { getDict, Locale } from "@/lib/dictionary";

function PhotoCardIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path
        d="M4 8a2 2 0 0 1 2-2h1.5l1-1.5h7l1 1.5H18a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="13" r="3.2" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function SignatureCardIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M15 4l5 5-9.5 9.5H5.5V14L15 4Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M3 20h5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function ThumbCardIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M5 13.5a7 7 0 0 1 14 0c0 2.6-.8 4.7-2.1 6.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M8 13.5a4 4 0 0 1 8 0c0 2.1-.6 3.7-1.6 5.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M12 12.5a2 2 0 0 0-2 2c0 3-1 5.2-2.6 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function InfoCircleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="shrink-0 text-brand">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <path d="M12 11v6M12 8v.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="shrink-0 text-[var(--color-success-strong)]">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <path d="M8.5 12.5l2.2 2.2L15.5 9.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const ACCENTS = {
  photo: "bg-brand",
  signature: "bg-[var(--color-text-gray-normal)]",
  thumb: "bg-[var(--color-success-strong)]",
} as const;

function SpecBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[var(--color-border-gray-subtle)] bg-[var(--color-gray-bg-soft)] px-3 py-2">
      <Text as="p" variant="body-small" color="gray-muted" className="uppercase tracking-wide !text-[11px]">
        {label}
      </Text>
      <Text as="p" variant="body-medium" weight="semibold" color="gray-normal">
        {value}
      </Text>
    </div>
  );
}

function RequirementCard({
  accentKey,
  icon,
  title,
  subtitle,
  spec,
  generalRequirementsLabel,
  dimensionsLabel,
  fileSizeLabel,
  formatLabel,
}: {
  accentKey: keyof typeof ACCENTS;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  spec: OfficialRequirementCard;
  generalRequirementsLabel: string;
  dimensionsLabel: string;
  fileSizeLabel: string;
  formatLabel: string;
}) {
  return (
    <div className="rounded-2xl border border-[var(--color-border-gray-subtle)] bg-white overflow-hidden flex flex-col h-full">
      <div className={`h-1.5 ${ACCENTS[accentKey]}`} />
      <div className="p-5 flex flex-col gap-4 flex-1">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand/8 text-brand flex items-center justify-center shrink-0">
            {icon}
          </div>
          <div>
            <Text as="p" variant="body-large" weight="semibold" color="gray-normal">
              {title}
            </Text>
            <Text as="p" variant="body-small" color="gray-muted">
              {subtitle}
            </Text>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <SpecBox label={dimensionsLabel} value={`${spec.widthPx} × ${spec.heightPx}px`} />
          <SpecBox label={fileSizeLabel} value={`${spec.minKB}–${spec.maxKB}KB`} />
        </div>
        <SpecBox label={formatLabel} value={spec.format.toUpperCase()} />

        {spec.generalRequirements && (
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <InfoCircleIcon />
              <Text as="p" variant="body-small" weight="semibold" color="gray-normal">
                {generalRequirementsLabel}
              </Text>
            </div>
            <Text as="p" variant="body-small" color="gray-muted">
              {spec.generalRequirements}
            </Text>
          </div>
        )}

        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <CheckCircleIcon />
            <Text as="p" variant="body-small" weight="semibold" color="gray-normal">
              {spec.rulesLabel}
            </Text>
          </div>
          <Text as="p" variant="body-small" color="gray-muted">
            {spec.rulesText}
          </Text>
        </div>
      </div>
    </div>
  );
}

/**
 * "Official Requirements for {exam}" — 2 or 3 cards (Photograph, Signature,
 * and Thumb Impression only when that exam actually requires one — see
 * officialRequirements.ts). Renders nothing when the exam has no entry
 * there (91 of our 100 exams do; the rest have no verified data to show,
 * so the section is simply absent rather than showing fabricated content).
 */
export default function OfficialRequirements({
  shortName,
  data,
  locale = "en",
}: {
  shortName: string;
  data: ExamOfficialRequirements;
  locale?: Locale;
}) {
  const t = getDict(locale).spoke;
  const tool = getDict(locale).tool;

  const cards: {
    key: keyof typeof ACCENTS;
    icon: React.ReactNode;
    title: string;
    spec: OfficialRequirementCard;
  }[] = [
    { key: "photo", icon: <PhotoCardIcon />, title: t.photographLabel, spec: data.photo },
    { key: "signature", icon: <SignatureCardIcon />, title: t.specSignature, spec: data.signature },
  ];
  if (data.thumb) {
    cards.push({ key: "thumb", icon: <ThumbCardIcon />, title: t.thumbImpressionLabel, spec: data.thumb });
  }

  return (
    <div className="mt-16 md:mt-20 max-w-[1080px] mx-auto px-2">
      <div className="text-center flex flex-col items-center gap-3 mb-8">
        <h2 className="heading-large !font-bold text-text-gray-normal">
          {locale === "hi" ? (
            <>
              <span className="text-brand">{shortName}</span> {t.officialRequirementsPrefix}
            </>
          ) : (
            <>
              {t.officialRequirementsPrefix} <span className="text-brand">{shortName}</span>
            </>
          )}
        </h2>
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-brand/8 text-brand">
          {t.administeredBy} {data.administeringBody}
        </span>
      </div>

      {/* Official Requirements only ever has 2 cards (Photo + Signature) or
          3 (+ Thumb Impression) — with just 2, stretching a 3-column grid
          across the full 1080px container leaves an empty third slot and
          reads as left-aligned rather than balanced, so cap the row width
          and center it instead of always going full-bleed. */}
      <div
        className={`grid gap-5 items-stretch mx-auto ${
          cards.length >= 3 ? "md:grid-cols-3" : "sm:grid-cols-2 max-w-[700px]"
        }`}
      >
        {cards.map((card) => (
          <RequirementCard
            key={card.key}
            accentKey={card.key}
            icon={card.icon}
            title={card.title}
            subtitle={t.officialGuidelines}
            spec={card.spec}
            generalRequirementsLabel={t.generalRequirements}
            dimensionsLabel={tool.dimensions}
            fileSizeLabel={t.specFileSize}
            formatLabel={tool.format}
          />
        ))}
      </div>
    </div>
  );
}
