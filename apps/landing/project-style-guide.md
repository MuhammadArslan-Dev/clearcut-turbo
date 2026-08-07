# Clear Cutoff — Project UI Style Guide

> Authoritative reference for all frontend work in this repo.
> Every UI change must comply with this guide before being merged.

---

## 1. Stack & Architecture

| Layer | Technology |
|---|---|
| Framework | Next.js 15 App Router |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 (`@import "tailwindcss"`) + CSS custom properties |
| Component lib | MUI Joy UI (wrapped, never used directly in pages) |
| Animation | Framer Motion — variants live in `src/lib/animations.ts` and `src/lib/animations-premium.ts` |
| i18n | next-intl — all user-facing strings via `useTranslations()` / `getTranslations()` |
| State | Zustand (`authModalStore`, `useAuthStore`, `assessmentStore`) |
| Class composition | `clsx` — always, never string template literals for conditionals |

### Folder map (abbreviated)

```
src/
├── app/[locale]/             ← App Router pages
│   └── (settingpages)/       ← route group for legal/account pages
├── components/
│   ├── features/             ← auth, onboarding, reviews, animation
│   ├── global/               ← Section, MainContainer, AuthModals, FloatingButton
│   ├── icons/                ← ALL SVG icons as .tsx components
│   ├── inputs/               ← MainInput, OTPInput
│   ├── layout/               ← Header, Footer, HeaderWraper
│   ├── modal-bootom-sheet/   ← DrawerSheet, Modal, Overlay
│   ├── sections/             ← full-width page sections
│   ├── shared/               ← text-render/ (Text, Paragraph, HeaderBlock), Banner
│   └── ui/                   ← Button, Badge, CardWrap, cards/
├── lib/
│   ├── animations.ts         ← standard framer-motion variants
│   └── animations-premium.ts ← premium variants + EASE cubic-bezier
├── styles/globals.css        ← CSS vars, @theme, typography classes
└── themes/theme.ts           ← MUI Joy extended theme
```

---

## 2. Color Palette (exact hex codes)

### Primary (brand blue)

| Token | Hex | Tailwind class |
|---|---|---|
| `--color-brand` / `--color-primary` | `#0083FF` | `text-color-brand` / `bg-color-primary` |
| `--color-brand-dark` | `#0053A2` | `text-color-brand-dark` |
| Primary 600 (hover) | `#006FDB` | — |
| `--color-primary-soft` | `#DBEAFE` | `bg-color-primary-soft` |
| `--color-primary-subtle` | `#E8F2FB` | `bg-color-primary-subtle` |

### Success (green)

| Token | Hex | Tailwind class |
|---|---|---|
| `--color-success` | `#00A251` | `text-color-success` / `bg-color-success` |
| `--color-success-highlight` | `#008743` | — |
| `--color-success-soft` | `#E7F6E5` | `bg-color-success-soft` |
| Text green normal | `#1C9E41` | `text-color-text-green-normal` |

### Danger (red)

| Token | Hex | Tailwind class |
|---|---|---|
| Danger 500 | `#D92D20` | — |
| Danger 600 | `#B42318` | — |

### Text gray scale

| Token | Hex | Tailwind class | Use |
|---|---|---|---|
| `--color-text-gray-normal` | `#192839` | `text-text-gray-normal` | Primary body text |
| `--color-text-gray-subtle` | `#40566D` | `text-text-gray-subtle` | Secondary / descriptions |
| `--color-text-gray-muted` | `#768EA7` | `text-text-gray-muted` | Hints, captions, meta |
| `--color-text-gray-disabled` | `#CCCCCC` | `text-text-gray-disabled` | Disabled states |

### Surfaces & borders

| Token | Hex | Tailwind class |
|---|---|---|
| Background | `#FFFFFF` | `bg-white` |
| `--color-background-gray-subtle` | `#F1F5FA` | `bg-color-background-gray-subtle` |
| `--color-border-gray-subtle` | `#CBD5E2` | `border-color-border-gray-subtle` |

### Marketing-only colors (not in system — use sparingly, only for specific CTAs)

| Hex | Use |
|---|---|
| `#FF5315` | Orange CTA gradient end / discount badges |
| `#FF7B00` | Orange CTA gradient start |
| `#FECF49` | Star rating fill |

---

## 3. Typography Scale

> **Rule:** Never use Tailwind's `text-xl`, `text-2xl`, etc. for semantic sizes.
> Use the CSS class system defined in `globals.css`. These are fluid (clamp-based).

### Display

| CSS class | Size range | Line-height | Use for |
|---|---|---|---|
| `display-xlarge` | 40–72px | 48–78px | Hero super-title |
| `display-large` | 38–64px | 46–70px | Display headings |
| `display-medium` | 36–56px | 42–64px | Primary section headings |
| `display-small` | 34–48px | 40–56px | Sub-display |

### Headings

| CSS class | Size range | Line-height | Use for |
|---|---|---|---|
| `heading-2xxlarge` | 32–38px | 38–46px | — |
| `heading-2xlarge` | 32–40px | 38–46px | — |
| `heading-xlarge` | 24–32px | 32–38px | H1 variants |
| `heading-large` | 20–24px | 26–32px | Section H2 |
| `heading-medium` | 18–20px | 24–26px | Sub-headings |
| `heading-small` | 16–18px | 22–24px | Card titles |

### Body

| CSS class | Size range | Line-height | Use for |
|---|---|---|---|
| `body-large` | 16px | 24px | Primary body |
| `body-medium` | 14–15px | 20px | Default body text |
| `body-small` | 12–13px | 18px | Captions, labels |
| `body-xsmall` | 10–11px | 14px | Badges, meta, legal |

### Font weight

Applied via `<Text weight="...">` prop: `normal` | `medium` | `semibold` | `bold`

Or raw Tailwind when inside spans: `!font-semibold` (use `!` to override MUI specificity)

### Font families

- Latin: `Noto Sans` (`--font-latin`)
- Hindi (`:lang(hi)`): `Noto Sans Devanagari` (`--font-hindi`)

---

## 4. Spacing System

### Section spacing (CSS variables)

| Variable | Value | Use |
|---|---|---|
| `py-ym-section` | `1rem` | Mobile vertical padding |
| `px-xm-section` | `1.5rem` | Mobile horizontal padding |
| `py-yd-section` | `2rem` | Desktop vertical padding |
| `px-xd-section` | `2rem` | Desktop horizontal padding |
| `py-y-section` | `3rem` | Large section vertical |
| `px-x-section` | `3rem` | Large section horizontal |

### Standard section padding string

```tsx
padding="py-ym-section md:py-yd-section px-3"
```

### Max widths

| Context | Value |
|---|---|
| Default section / container | `max-w-[1100px]` |
| Wide sections | `max-w-[1120px]` |
| Pricing card | `max-w-[390px]` |
| Full-bleed | `max-w-full` |

---

## 5. Breakpoints

| Name | Value | Note |
|---|---|---|
| `tablet` | `800px` | **This project's primary layout breakpoint** |
| `md` | `768px` | Tailwind default — used in older components only |

Use `tablet:` for all new layout splits. Do not use `md:` for new layout decisions.

---

## 6. Component Inventory & Usage

### A. Text / Typography

```tsx
// Base atom — always use for any rendered text
import Text from "@/components/shared/text-render/Text";

<Text as="h1" variant="heading-xlarge" weight="bold" color="gray-normal">
  Heading
</Text>

<Text as="p" variant="body-medium" color="gray-subtle">
  Body text
</Text>
```

`color` prop values: `gray-normal` | `gray-subtle` | `gray-muted` | `gray-disabled` | `primary-normal` | `primary-dark` | `white`

```tsx
// Structured eyebrow + heading + description block
import HeaderBlock from "@/components/shared/text-render/HeaderBlock";

<HeaderBlock
  eyebrow={{ text: "Eyebrow" }}
  heading={{ text: "Main heading" }}
  description={{ text: "Subtitle" }}
  headingOptions={{ font: "display-medium !font-semibold", alignMobile: "center" }}
  descriptionOptions={{ alignMobile: "center" }}
/>
```

```tsx
// Paragraph with optional highlight + alignment
import Paragraph from "@/components/shared/text-render/Paragraph";

<Paragraph
  text={{ text: "Paragraph content" }}
  textOptions={{ font: "body-medium !font-normal", alignMobile: "center" }}
/>
```

---

### B. Layout wrappers

```tsx
// Section — the standard page-section wrapper
import Section from "@/components/global/Section";

<Section
  sectionId="section-name"           // required
  maxWidth="max-w-[1100px]"          // default
  padding="py-ym-section md:py-yd-section px-3"
  bgColor="bg-white"                 // Tailwind class
>
  {children}
</Section>
```

```tsx
// MainContainer — centered div wrapper
import MainContainer from "@/components/global/main-container";

<MainContainer maxWidth="max-w-[1100px]" padding="px-4">
  {children}
</MainContainer>
```

Section pattern for colored background sections (used across the codebase):
```tsx
<div className={clsx(bgColor)} style={{ background: bgColor }}>
  <Section sectionId="..." padding="py-ym-section md:py-yd-section px-3">
    ...
  </Section>
</div>
```

---

### C. Buttons

```tsx
// All-purpose button — MUI Joy wrapped
import Button from "@/components/ui/buttons/Button";

// Primary solid (default)
<Button size="lg" color="primary" variant="solid" rounded="50px" fullWidth>
  Label
</Button>

// Outlined
<Button size="md" color="primary" variant="outlined" rounded="50px">
  Label
</Button>

// Sizes: "xs" | "sm" | "md" | "lg" | "xl"
// Colors: "primary" | "success" | "danger" | "neutral" | "gray"
// Variants: "solid" | "outlined" | "soft" | "plain"
// rounded: any CSS border-radius value, e.g. "50px" for pill, "12px" for rounded-xl
```

```tsx
// Main CTA — handles auth + analytics automatically
import ContinueFreeButton from "@/components/ui/buttons/ContinueFreeButton";

<ContinueFreeButton
  text="Continue Free Preparation"
  size="lg"
  event={{ element_location: "hero" }}
/>
```

**Gradient buttons** — use `<Button>` with `className`:
```tsx
<Button
  size="lg"
  fullWidth
  rounded="50px"
  className="bg-gradient-to-r from-[#FF7B00] to-[#FF5315] text-white font-bold border-0 shadow-md"
>
  Start Trial →
</Button>
```

---

### D. Cards

```tsx
// CardWrap — MUI Joy Card, plain variant
import CardWrap from "@/components/ui/cards/CardWrap";

<CardWrap
  bgcolor="#ffffff"       // CSS color string
  bordercolor="#CBD5E2"   // CSS color string (default = #CBD5E2)
  borderwidth={1}         // default = 1
  padding="16px"          // CSS string or MUI spacing number
  borderRadius={12}       // px or CSS string
>
  {children}
</CardWrap>
```

```tsx
// PricingCard — full pricing plan
import PricingCard from "@/components/ui/cards/PricingCard";
<PricingCard title="..." price={99} priceNote="..." points={[...]} buttonText="..." />
```

---

### E. Badge / Chip

```tsx
import Badge from "@/components/ui/Badge";

<Badge
  text="Label"
  bgColor="bg-color-primary-subtle"
  color="text-color-brand"
  borderColor="border-color-primary-soft"
  rounded="rounded-full"
  padding="px-3 py-1"
  font="body-xsmall !font-semibold"
  maxHeight="max-h-full"   // override the default max-h-7 when needed
  height="h-auto"
  leftIcon={<Icon />}      // optional
/>
```

---

### F. Inputs

```tsx
import MainInput from "@/components/inputs/MainInput";

// Phone input
<MainInput
  inputType="phone"
  value={phone}
  placeholder="10-digit mobile number"
  maxLength={10}
  onChange={(e) => setPhone(e.target.value)}
  icon={<PhoneIcon />}
  error={errorMessage}
/>

// Text input
<MainInput
  inputType="text"
  label="Name"
  value={name}
  onChange={handler}
/>
```

Style: bottom-border only, focus turns brand blue, error turns red.

---

### G. Modals / Sheets

```tsx
import { DrawerSheet } from "@/components/modal-bootom-sheet/DrawerSheet";

<DrawerSheet
  isOpen={isOpen}
  onClose={() => setOpen(false)}
  direction="right"
  isHeader
  title="Title"
>
  {children}
</DrawerSheet>
```

---

### H. Icons

All icons are SVG React components in `src/components/icons/`. Do **not** import from Lucide, Heroicons, or any third-party icon library.

```tsx
import StarIcon from "@/components/icons/star-icon";
import MainAppLogo from "@/components/icons/main-app-logo";
import CloudIcon from "@/components/icons/cloud-icon";
// ... see src/components/icons/ for full list
```

---

## 7. Animation Conventions

### Import from project presets — never define ad-hoc variants

```tsx
// Standard variants
import { reveal, fadeUp, fadeIn, stagger, hoverScale, viewportOnce } from "@/lib/animations";

// Premium variants + ease
import { EASE, heroContainer, heroItem, revealPremium, cardReveal, hoverCard } from "@/lib/animations-premium";
```

### Standard ease

```ts
// Always use for smooth, premium feel
export const EASE = [0.22, 1, 0.36, 1] as const
```

### Common patterns

```tsx
// Scroll-reveal a section
<motion.div
  variants={reveal({ y: 40, duration: 0.6 })}
  initial="hidden"
  whileInView="show"
  viewport={viewportOnce}
/>

// Stagger children
<motion.div variants={stagger(0, 0.12)} initial="hidden" whileInView="show" viewport={viewportOnce}>
  {items.map(item => (
    <motion.div key={item.id} variants={fadeUp}>...</motion.div>
  ))}
</motion.div>

// Hover interaction
<motion.div {...hoverScale}>...</motion.div>

// Animated notification stack (AnimatePresence + layout)
<AnimatePresence initial={false}>
  {queue.map((item, i) => (
    <motion.div
      key={item.id}
      layout
      initial={{ y: 56, opacity: 0 }}
      animate={{ y: 0, opacity: i === queue.length - 1 ? 1 : 0.5 }}
      exit={{ y: -24, opacity: 0 }}
      transition={{ duration: 0.55, ease: EASE }}
    />
  ))}
</AnimatePresence>
```

---

## 8. Styling Conventions

### Class composition

```tsx
// ✅ Always use clsx for conditionals
import clsx from "clsx";
className={clsx("base", condition && "conditional", variant === "x" && "variant-x")}

// ❌ Never use template literals for conditionals
className={`base ${condition ? "conditional" : ""}`}
```

### Typography classes

```tsx
// ✅ Use semantic CSS class + Text component
<Text as="h2" variant="heading-large" weight="semibold" color="gray-normal">
  Title
</Text>

// ✅ Use CSS class string directly when needed (e.g. in HeaderBlock font option)
headingOptions={{ font: "display-medium !font-semibold" }}

// ❌ Never use Tailwind size for semantic headings
<h2 className="text-2xl font-bold text-gray-900">Title</h2>
```

### Colors

```tsx
// ✅ Use CSS variable tokens
className="text-color-brand bg-color-primary-subtle border-color-border-gray-subtle"

// ✅ Use Text color prop
<Text color="gray-subtle">...</Text>

// ❌ Never hard-code brand/text colors as hex in className
className="text-[#0083FF] text-gray-900 text-gray-500"

// ❌ Never use inline style for colors
style={{ color: "#0083FF" }}
```

### Weight override (inside MUI context)

```tsx
// MUI may apply its own font-weight. Use ! to override.
className="!font-semibold"
```

---

## 9. Section Component Pattern

Every major section follows this pattern:

```tsx
export default React.memo(function MySection({
  bgColor = "bg-white",
  active = true,
}: {
  bgColor?: string;
  active?: boolean;
}) {
  if (!active) return null;

  return (
    <div className={clsx(bgColor)} style={{ background: bgColor }}>
      <Section
        sectionId="my-section"
        padding="py-ym-section md:py-yd-section px-3"
        maxWidth="max-w-[1100px]"
      >
        <HeaderBlock ... />
        {/* content */}
      </Section>
    </div>
  );
});
```

---

## 10. What NOT to Introduce

| Do not use | Use instead |
|---|---|
| Raw `<button>` | `<Button>` or `<ContinueFreeButton>` |
| Raw `<input>` | `<MainInput>` |
| `text-xl`, `text-2xl`, `text-sm` for headings | Semantic CSS class (`heading-large` etc.) |
| `text-gray-900`, `text-gray-500` | `text-text-gray-normal`, `text-text-gray-subtle` |
| `text-[#0083FF]` | `text-color-brand` |
| Hard-coded `#hex` for brand/text | CSS token classes |
| `style={{ color: "..." }}` | Tailwind classes |
| Lucide, Heroicons, or any icon package | `src/components/icons/` only |
| Framer-motion ad-hoc variants | Import from `@/lib/animations` / `@/lib/animations-premium` |
| CSS Modules | Tailwind utility classes only |
| `md:` for layout breakpoints | `tablet:` (800px) |
| `console.log` in components | Remove before commit |
| `React.useMemo` on i18n data | i18n data is already memoized by next-intl |
| `MUIWrapper` in `"use client"` pages | Not needed; wrap only across server/client boundaries |

---

## 11. Grid Patterns in Use

```tsx
// 2-column (feature sections)
<div className="grid md:grid-cols-2 gap-8">

// Hero (11-unit grid, 6+5 split)
<div className="grid md:grid-cols-11 gap-12">
  <div className="md:col-span-6">...</div>
  <div className="md:col-span-5">...</div>
</div>

// 3-column desktop split (page-level)
<div className="hidden tablet:flex h-screen divide-x divide-color-border-gray-subtle">
  <div className="flex-1 overflow-y-auto">...</div>
  <div className="flex-1 overflow-y-auto">...</div>
  <div className="flex-1 overflow-y-auto">...</div>
</div>

// Pricing cards (responsive)
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
```

---

## 12. File / Component Naming Conventions

| Pattern | Example |
|---|---|
| Page components | `page.tsx` (Next.js convention) |
| Section components | `PascalCase` + `Section` suffix |
| Feature components | `PascalCase` inside `features/[feature-name]/` |
| Icon components | `kebab-case-icon.tsx` |
| Hooks | `useHookName.ts` / `useHookName.tsx` |
| Stores | `useStoreName.ts` |
| Types | `src/types/[domain].ts` |

Components that are pure data-render (no client hooks) should be server components (`async function`, no `"use client"`).
Components that use state, effects, or browser APIs must declare `"use client"`.

---

*Last updated: 2026-04-29 — based on full codebase scan.*
