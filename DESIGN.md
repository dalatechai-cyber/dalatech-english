---
name: Core English
description: Editorial-premium dark-mode English tutor for Mongolian speakers — The Nocturnal Academy.
colors:
  midnight-ink: "#0B1222"
  midnight-ink-deep: "#070C18"
  midnight-ink-surface: "#141C30"
  midnight-ink-elevated: "#1F2940"
  candlelight-gold: "#F59E0B"
  candlelight-gold-light: "#FCD34D"
  candlelight-gold-dark: "#D97706"
  vellum-champagne: "#E4C08A"
  text-primary: "#F8FAFC"
  text-secondary: "#CBD5E1"
  text-muted: "#64748B"
  hairline: "#FFFFFF10"
  hairline-gold: "#F59E0B2E"
  ai-bubble-surface: "#1E293B"
typography:
  display:
    fontFamily: "Playfair Display, EB Garamond, Georgia, serif"
    fontSize: "clamp(52px, 9vw, 96px)"
    fontWeight: 400
    lineHeight: 0.95
    letterSpacing: "-0.02em"
    fontStyle: "italic"
  headline:
    fontFamily: "Playfair Display, EB Garamond, Georgia, serif"
    fontSize: "clamp(30px, 4vw, 40px)"
    fontWeight: 400
    lineHeight: 1.1
    letterSpacing: "-0.015em"
  title:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.015em"
  body:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "normal"
    fontFeature: "'ss01', 'cv11', 'calt'"
  label:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "0.22em"
    textTransform: "uppercase"
rounded:
  sm: "4px"
  md: "8px"
  lg: "12px"
  xl: "16px"
  pill: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "40px"
  xxl: "64px"
components:
  button-primary:
    backgroundColor: "{colors.candlelight-gold}"
    textColor: "{colors.midnight-ink}"
    rounded: "{rounded.xl}"
    padding: "16px 28px"
    typography: "{typography.title}"
  button-primary-hover:
    backgroundColor: "{colors.candlelight-gold-dark}"
    textColor: "{colors.midnight-ink}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.text-secondary}"
    rounded: "{rounded.xl}"
    padding: "16px 24px"
  chip-stat:
    backgroundColor: "#F59E0B0A"
    textColor: "{colors.vellum-champagne}"
    rounded: "{rounded.pill}"
    padding: "6px 14px"
    typography: "{typography.label}"
  nav-link:
    backgroundColor: "transparent"
    textColor: "{colors.vellum-champagne}"
    typography: "{typography.label}"
    padding: "0"
  card-surface:
    backgroundColor: "{colors.midnight-ink-surface}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.xl}"
    padding: "24px"
  card-elevated:
    backgroundColor: "{colors.midnight-ink-surface}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.xl}"
    padding: "24px"
  input-field:
    backgroundColor: "{colors.midnight-ink-surface}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.lg}"
    padding: "12px 16px"
    typography: "{typography.body}"
---

# Design System: Core English

## 1. Overview

**Creative North Star: "The Nocturnal Academy"**

Core English is a private late-night reading room. Midnight Ink walls, a single Candlelight Gold lamp, Playfair italics on Vellum Champagne inlays. The learner is not a gamer grinding streaks, they are a student at a serious desk studying under warm light in a room where nobody is shouting at them. The UI is the room. The lesson is the book. The AI tutor is the quiet scholar across the table.

The system is committed to restraint. Gold is rare and ceremonial, never decorative. Serif italics (Playfair Display) appear only as editorial accent: a folio number, a pulled phrase, a section kicker. The body carries in Inter, specifically tuned with `ss01 cv11 calt` to render Mongolian Cyrillic alongside English without the typographic mismatch most bilingual UIs suffer from. Depth is layered: flat surfaces on `#141C30`, dark structural shadows behind, and a single gold ambient glow reserved for achievement (`shadow-gold` on completed levels, primary CTAs).

This system explicitly rejects: Duolingo-style cartoon rewards, Kaplan/ETS institutional beige, purple-to-pink AI-startup gradients, neon-on-black crypto maximalism, and the hero-metric SaaS dashboard template. No mascots. No countdown timers. No "Get Started →" exclamation-point energy. The product does not chase the user; the user chooses the product.

**Key Characteristics:**
- **Editorial over utilitarian.** Serif italics, uppercase kickers with 0.22em tracking, hairline dividers, folio-style numbering (01 / 02 / 03).
- **Restrained color strategy.** Midnight Ink ground carries ~85% of the surface; Candlelight Gold used on ≤10% for primary CTAs, achievement states, focus rings, the one lamp in the room.
- **Bilingual-native typography.** Inter body with OpenType features enabled for Mongolian Cyrillic letterforms, Playfair reserved for English editorial accents.
- **Structural depth + ceremonial glow.** Dark layered shadows define hierarchy; gold ambient glow marks accomplishment.
- **Calm motion.** `pageFadeInUp` (0.4s ease-out), `orbPulse` (6s ambient), `pulseGold` on CTAs. No bounce, no elastic, no choreography.

## 2. Colors: The Midnight Ink Palette

A three-voice palette: a deep ink ground, a single warm flame, and an aged-vellum highlight. Everything else is neutral support. Nothing is bright; everything is dimmed as if lit by lamp, not fluorescent.

### Primary
- **Candlelight Gold** (`#F59E0B`, oklch(75% 0.17 65)): the one lamp. Appears on primary CTAs, achievement borders on unlocked level cards, the streak flame, focus rings, the wordmark in the nav. Never a background fill on large surfaces; never a decorative accent. If you are using it for more than state or identity, you are using it wrong.
- **Candlelight Gold Light** (`#FCD34D`): the highlight on the lamp's glass. Used only as the top stop in gradients on the primary CTA and level-code serif (see The One Flame rule). Never standalone.
- **Candlelight Gold Dark** (`#D97706`): the lamp's shadow side. Bottom stop in the CTA gradient and the active/press state of primary actions.

### Secondary
- **Vellum Champagne** (`#E4C08A`, oklch(82% 0.075 75)): aged paper. The editorial whisper: uppercase kicker labels, nav links, section eyebrows, progress counters. This is the color that carries identity when gold is being reserved for CTAs. If a screen feels visually empty, add Vellum Champagne, not Gold.

### Neutral
- **Midnight Ink** (`#0B1222`, oklch(18% 0.025 260)): the room itself. Global body background, tinted 18% toward cool blue, never pure black (#000 is banned). Carries the radial-glow + grain-overlay composition in `body::before`.
- **Midnight Ink Deep** (`#070C18`): shadow edges. Used in radial gradients and drop-shadows to push surfaces away from the ground.
- **Midnight Ink Surface** (`#141C30`): the raised desk. Cards, nav, dropdown menus, chat bubbles (user side uses gold, AI side uses midnight-ink-surface).
- **Midnight Ink Elevated** (`#1F2940`): one level above. Scrollbar thumbs, pressed states, hover elevation.
- **Text Primary** (`#F8FAFC`, oklch(98% 0.005 260)): body and headline on dark ground. Never `#fff`; tinted 0.5% toward the ink hue.
- **Text Secondary** (`#CBD5E1`): supporting body, descriptive paragraphs, most sub-labels.
- **Text Muted** (`#64748B`): timestamps, footer, minor metadata, inactive states. Still passes AA on Midnight Ink Surface at ≥14px.
- **Hairline** (`rgba(255,255,255,0.06)`): the universal divider. Section breaks, card borders, nav bottom edge, grid gaps. Never a full-weight border; always this whisper.
- **Hairline Gold** (`rgba(245,158,11,0.18)`): the accent divider. Stat pill borders, dropdown active edge. Reserved for gold-adjacent contexts.

**Naming convention.** Base tokens use editorial vocabulary (`midnight-ink`, `candlelight-gold`, `vellum-champagne`) to reinforce the Nocturnal Academy design language. Variants use functional suffixes (`-deep`, `-surface`, `-elevated`, `-light`, `-dark`) so their relationship to the base token is mechanically obvious from the token name alone. The certificate sub-system (§7) uses its own naming convention scoped to that exception.

### Named Rules

**The One Flame Rule** (*heuristic · review-time*). Candlelight Gold is ≤10% of any screen. If you are filling a hero background with it, you are wrong. Gold marks the *one* important affordance (the primary CTA), the *one* achievement state (passed exam border), or the *one* identity element (the wordmark). Everything else is Vellum Champagne or ink.

**Verification method.** Reviewer-judged at design-review and code-review time. Not automated, not pixel-counted. The ≤10% figure is a *posture check*, not a measurement. Per-screen audit checklist (run against every new route and every PR that touches a visible surface):

1. **Enumerate gold.** List every element rendered in Candlelight Gold (`#F59E0B`, `#FCD34D`, `#D97706`, or `var(--gold*)`) or carrying `shadow-gold` / `shadow-gold-sm` / `orb-pulse`.
2. **Assign a role.** For each, name the role it fills: primary affordance, achievement state, focus ring, identity mark (wordmark / flame), AI-presence halo. One role per element.
3. **Reject decoration.** Any gold usage that is not a role (divider accents, icon tints, hover halos on non-achievement surfaces, background gradients without meaning) is demoted to Vellum Champagne, hairline, or removed.
4. **Count roles.** If more than 3–4 gold roles appear on one screen, the scene is over-lit; demote the least-important until the count drops. Two gold roles on a landing hero (wordmark + CTA) is healthy; six is a failure.

If pixel-coverage measurement is ever wanted (e.g., for marketing-asset audits), the tool is a Playwright screenshot + histogram analysis at `1440×900` and `390×844` counting pixels within Δ≤8 of the three gold hexes. This is optional tooling, never a gate.

**The No Pure Black / No Pure White Rule.** `#000` and `#fff` are prohibited. All neutrals are tinted toward the cool ink hue. `#F8FAFC` is the lightest value allowed. `#070C18` is the darkest. This keeps the palette coherent under the radial-glow + grain overlay.

**The Lamp-Light Rule.** Candlelight Gold is warm (hue ~65), not bright-yellow (hue ~90) or sun-orange (hue ~45). It reads as *flame*, not as marigold or construction cone. Stay in the 60–70 hue band when generating variants.

## 3. Typography

**Display Font:** Playfair Display (with EB Garamond and Georgia as fallback).
**Body Font:** Inter (with system-ui and sans-serif as fallback).
**Label/Kicker Font:** Inter (same as body, differentiated by size, weight, and tracking).

**Character:** Playfair is used italic, at display scale, as editorial accent, never for body copy, never for buttons. Inter carries everything functional, tuned with OpenType features `ss01 cv11 calt` to render Mongolian Cyrillic cleanly alongside Latin. The pairing is "magazine pull-quote italic + broadsheet body sans", a Financial Times reading page translated to dark mode.

### Hierarchy
- **Display** (Playfair italic 400, `clamp(52px, 9vw, 96px)`, line-height 0.95, letter-spacing -0.02em): hero wordmarks only. "Core English" on the landing, the level-code digit on level cards. Never more than one Display element on screen.
- **Headline** (Playfair 400, `clamp(30px, 4vw, 40px)`, line-height 1.1, letter-spacing -0.015em): section titles like "Яагаад Core English?" The italic `<em>` inside carries Candlelight Gold.
- **Title** (Inter 600, 18px, line-height 1.3, letter-spacing -0.015em): card titles, feature-tile headings.
- **Body** (Inter 400, 16px, line-height 1.6): all paragraph copy. Input fields enforce ≥16px in `globals.css` to block iOS auto-zoom. Max line length 65–75ch. Mongolian Cyrillic benefits visibly from `ss01 cv11 calt`; keep these features on.
- **Label / Kicker** (Inter 600, 11px, letter-spacing 0.22em, uppercase): section eyebrows, nav links, stat-pill text, CEFR marker on level cards. The most distinctive typographic voice in the system. Used with surrounding hairline segments (`h-px w-8` gold-gradient dividers) on hero eyebrows, never without.

### Named Rules

**The One Italic Rule.** Playfair italic is for display accents. Never italicize body copy. Never italicize buttons or labels. When you want emphasis in body, use weight (600) or color (Vellum Champagne), not italic.

**The 0.22em Tracking Rule.** All-caps kicker labels always use `letter-spacing: 0.22em` (or 0.18em for in-line nav links). Uppercase without aggressive tracking reads as shouting, not editorial. The tracking is what makes it feel like a magazine section-opener, not a UI label.

**The Tabular Numerals Rule.** Every number that represents a score, streak, counter, progress, or quiz result uses `font-variant-numeric: tabular-nums` (via the `.nums-tabular` utility). Proportional digits on changing values are a slop tell.

### Bilingual Typography Rules

Mongolian Cyrillic and English Latin must render as **co-equal type**, not "Latin primary with Cyrillic tolerated." The rules below are mechanical and verifiable; they exist because hand-wave bilingualism is the default failure mode, and prose like "tuned with `ss01 cv11 calt`" does not survive contact with `subsets: ['latin']` font loading. Audit these on every new route and every font-stack change.

**1. Cyrillic glyph coverage on the active body font.** The body font stack must ship Cyrillic glyphs in the same file as Latin — otherwise the browser switches to the next fallback mid-word, which breaks x-height, weight, and metrics. Verify by: (a) opening DevTools → Rendered Fonts on a Cyrillic-heavy screen (`/level/a1`, `/profile`); (b) confirming every Cyrillic character reports the *same* rendered font as every Latin character. If the Cyrillic reports `Segoe UI`, `San Francisco`, or `system-ui` while Latin reports the branded font, the stack is failing parity.

**2. System-sans fallback coverage (floor guarantee).** When the branded font does not cover Cyrillic, the fallback chain must resolve to a Cyrillic-capable sans across every target OS. Canonical stack:

```css
font-family:
  /* branded Cyrillic-capable font, if loaded */
  -apple-system, BlinkMacSystemFont,  /* macOS/iOS: San Francisco (full Cyrillic) */
  "Segoe UI",                         /* Windows: full Cyrillic */
  Roboto,                             /* Android: full Cyrillic */
  "Helvetica Neue", Arial,            /* legacy fallback */
  sans-serif;
```

Do NOT end a body stack with a bare `sans-serif` + no Cyrillic-capable named fallbacks: on older Linux distros that resolves to DejaVu or Liberation, which have mismatched metrics against the branded Latin.

**3. `size-adjust` parity for x-height.** When two fonts in the stack have different x-heights — Cyrillic in `Segoe UI` (x-height ≈ 0.53em) vs. Latin in a loaded branded font (x-height ≈ 0.50em) — the visual size mismatch in mixed-script blocks is jarring. Define a `@font-face` override on the fallback:

```css
@font-face {
  font-family: "Body-Fallback";
  src: local("Segoe UI"), local("system-ui");
  size-adjust: 96%;       /* tune per measured x-height ratio */
  ascent-override: 90%;
  descent-override: 22%;
  line-gap-override: 0%;
}
```

Calibrate `size-adjust` by overlaying a Latin "x" and a Cyrillic "н" at 32px in Figma until x-heights align within 1px. Re-calibrate any time the branded font changes.

**4. Weight parity.** Cyrillic at weight 400 in many system fonts reads visibly heavier than Latin at 400 (Segoe UI is a known offender). When mixed-script text sits in one paragraph, verify at 16px / weight 400 that neither script dominates. If Cyrillic reads bold, drop the Cyrillic source's weight to 350 via `font-weight` on a language-scoped element: `:lang(mn) { font-weight: 380; }`. Weight 600 is the emphasis weight across both scripts.

**5. Line-height for mixed-script blocks.** Mongolian Cyrillic has taller diacritics (й, ү, ө, ё) than Latin ascenders. Body blocks containing Mongolian use `line-height: 1.65` (up from the 1.6 default) to prevent diacritic collision on wrapped lines. Single-language Latin blocks keep 1.6. Enforce via `:lang(mn) { line-height: 1.65; }` on body copy, or apply per-block on the `<p>` when the copy is Mongolian.

**6. Letter-spacing parity.** The 0.22em tracking on uppercase labels is calibrated for Latin. Mongolian Cyrillic uppercase (СУРГАЛТ, ТҮВШИН) over-spaces visibly at 0.22em due to wider Cyrillic glyphs. Language-scoped tracking: `:lang(mn) .label-kicker { letter-spacing: 0.18em; }`. Confirmed visually against `НЭВТРЭХ` and `ENTER` side-by-side.

**7. OpenType features must be scoped to fonts that support them.** `ss01 cv11 calt` are Inter-specific stylistic sets. Applying them via `font-feature-settings` on a block where the rendered font is `Segoe UI` is a silent no-op — the features advertised in DESIGN.md (Mongolian Cyrillic clarity via `ss01 cv11 calt`) *only apply when Inter is actually rendering the Cyrillic*, which requires loading Inter with the `cyrillic` subset. Verify via DevTools → Computed → `font-feature-settings` *and* Rendered Fonts agreeing on the font name. If they don't agree, either load the Cyrillic subset of the branded font or remove the feature claim.

**8. Minimum size floor.** Both scripts ≥14px body; inputs ≥16px (iOS auto-zoom block, already enforced in `globals.css`). Older learners (presbyopia) are a primary audience; do not compromise the floor for aesthetic density.

## 4. Elevation

The system uses **layered structural shadows + ambient gold glow**. Surfaces are not flat-by-default; they carry depth from the room's lighting. But shadows are never decorative: every elevation choice corresponds to a real role (default, achievement, primary action).

### Shadow Vocabulary
- **shadow-editorial** (default card depth):
  ```
  box-shadow:
    0 1px 0 0 rgba(255,255,255,0.03) inset,
    0 2px 4px rgba(0,0,0,0.3),
    0 16px 40px -12px rgba(0,0,0,0.5);
  ```
  Neutral depth. No gold. Locked level cards, surface menus, any elevated surface without achievement.
- **shadow-gold-sm** (primary CTA, small achievement):
  ```
  box-shadow:
    0 1px 0 0 rgba(255,255,255,0.08) inset,
    0 2px 6px rgba(0,0,0,0.3),
    0 0 24px rgba(245,158,11,0.25);
  ```
  Close warm glow. The lamp is *this close* to the surface.
- **shadow-gold** (large achievement, hover-elevated level card):
  ```
  box-shadow:
    0 1px 0 0 rgba(255,255,255,0.04) inset,
    0 1px 2px rgba(0,0,0,0.4),
    0 12px 28px -8px rgba(0,0,0,0.5),
    0 8px 24px -12px rgba(245,158,11,0.35);
  ```
  Full structural depth + gold ambient halo. Unlocked level cards, level-card hover state.

### Ambient Scene Glows (not shadows, but depth)
- **`.orb-pulse`** radial gradient, 820×460 at hero center: `rgba(245,158,11,0.14) 0%, rgba(245,158,11,0.04) 40%, transparent 70%`, animated 6s ease-in-out. This is the lamp's light spilling into the room.
- **`body::before` grain**: SVG fractal noise at 3.5% opacity, `mix-blend-mode: overlay`. The paper-texture signature. Subtle enough to miss, present enough to feel.
- **`body` radial gradient**: a soft amber wash from the top, plus a navy-to-midnight-ink-deep falloff. The room has a ceiling.

### Named Rules

**The Gold-Glow = Achievement Rule.** Any shadow containing a gold channel is a *state statement*, never a decoration. `shadow-gold` on a neutral card that means nothing is a violation. Use `shadow-editorial` for default depth; promote to `shadow-gold-sm` or `shadow-gold` only when the element has earned it.

**The Layered-Inset-Highlight Rule.** Every premium shadow starts with a 1px inset white highlight (0.03–0.08 alpha). This is the top-edge catch-light that makes the surface read as *physical*, not as a CSS rectangle. Don't omit it.

## 5. Components

### Buttons

- **Shape:** `rounded-xl` (16px) for primary CTAs, `rounded-lg` (12px) for small actions, `rounded-full` for pill chips. No sharp corners, no heavy over-rounding.
- **Primary CTA (gradient gold):** `linear-gradient(135deg, #F59E0B 0%, #D97706 100%)` background, Midnight Ink (`#0B1222`) text, 16px font-weight 600, padding 16px 28px, `shadow-gold-sm`, hover `-translate-y-0.5` with 200ms transition. The only button variant that uses gold as background.
- **Ghost / Secondary:** transparent background, Text Secondary (`#CBD5E1`) label, padding 16px 24px, hover switches label color to Candlelight Gold. No background fill, no border. Used for the IELTS secondary action next to the primary "Сургалт эхлэх".
- **Focus:** all interactive elements receive `outline: 2px solid #F59E0B; outline-offset: 2px;` (set globally on `*:focus-visible`). Focus ring is gold, not blue.

### Chips (stat pills)

- **Style:** `rgba(245,158,11,0.04)` background, `rgba(245,158,11,0.18)` 1px border, Vellum Champagne text, `rounded-full`, padding 6px 14px, `backdrop-blur-sm`.
- **Typography:** Inter 500, 12px, with leading icon (14px).
- **Use:** meta-stat badges under the hero ("5 Түвшин · 50+ Хичээл · IELTS Бэлтгэл"). Never used as filters or toggles.

### Cards / Containers

- **Corner Style:** `rounded-xl` (16px) on surface cards, `rounded-2xl` on featured grids.
- **Background:** Midnight Ink Surface (`#141C30`) at rest. On achievement states, swap the border to a gold-gradient `padding-box / border-box` trick: `background: linear-gradient(#141C30, #141C30) padding-box, linear-gradient(135deg, #F59E0B, #E4C08A, #D97706) border-box; border: 1px solid transparent;`.
- **Shadow Strategy:** `shadow-editorial` default, promote to `shadow-gold` on achievement (unlocked / completed) or on hover.
- **Border:** `1px solid rgba(255,255,255,0.06)` (hairline) default; gold-gradient border on achievement. Never a thick border, never a colored full-weight border.
- **Internal Padding:** 20–28px (`p-5` to `p-7`). Never below 16px; never above 32px. Variation across the system is intentional rhythm.

### Feature Grid (signature)

The three-tile "Философи" grid on the landing is a **hairline-separated gap grid**, not individual cards:
```
grid-cols-3 gap-px bg-white/[0.04] rounded-2xl overflow-hidden border hairline
```
The 1px gap is the shared background leaking through. Inside each tile: Playfair italic folio number (01 / 02 / 03) at Candlelight Gold 50% alpha in the top-left, icon in a gold-tinted rounded-lg square in the top-right, Title in white, body in `#94A3B8`. Hover swaps tile bg from `midnight-ink-surface` to `midnight-ink-elevated`.

### Inputs / Fields

- **Style:** Midnight Ink Surface (`#141C30`) background, hairline 1px border, `rounded-lg` (12px), padding 12px 16px.
- **Font:** Inter 16px (enforced, iOS auto-zoom prevention).
- **Focus:** gold 2px outline via `*:focus-visible` global rule, `outline-offset: 2px`.
- **Error / Disabled:** not yet consolidated in the codebase; when added, error uses `rgba(239, 68, 68, 0.18)` border + Text Secondary copy + error icon (never red background, never red text).

### Navigation

- **Style:** `rgba(20,28,48,0.92)` background with `backdrop-filter: blur(8px)`, 1px hairline bottom border. Full-width, sticky-ready.
- **Wordmark:** Playfair bold at 18–20px, Candlelight Gold.
- **Link typography:** Label style (Inter 600, 11px, uppercase, 0.18em tracking), Vellum Champagne at rest, Candlelight Gold on hover.
- **Mobile:** hamburger icon in 44×44 tap target, dropdown uses `shadow-editorial` and 1px hairline-gold border. Dropdown items are 56px min-height (`min-h-14`) for thumb reach.
- **Streak indicator:** FlameIcon 20px + tabular-num count in Candlelight Gold, "STREAK" kicker in Vellum Champagne on desktop only.

### Chat Bubble (signature)

- **AI message:** Ink-raised surface (`#1E293B`), rounded-2xl with asymmetric top-left corner (`rounded-tl-sm`), padding 12px 16px, max-width 75–85%, 36px gold-gradient avatar circle to the left.
- **User message:** Candlelight Gold gradient (`linear-gradient(135deg, #F59E0B, #D97706)`) background, Midnight Ink text, rounded-2xl with asymmetric top-right corner (`rounded-tr-sm`), font-weight 500 for legibility against gold.
- **Streaming cursor:** `▋` pseudo-element blinking at 1s, Candlelight Gold.
- **Correction highlights:** Candlelight Gold background at 15% alpha, rounded 4px, for grammar errors. Mongolian-language explanation renders in `prose` below.

### Speaking Orb (signature)

The IELTS speaking interface uses a three-ring gold orb with four state animations: `orb-idle` (2–3s breathing), `orb-speaking` (1.5–2.5s gold ripple), `orb-recording` / `orb-listening` (1.2–1.5s blue pulse), `orb-thinking` (rotating purple ring). Each state swaps keyframes on `.orb-ring-outer / -middle / -inner`. Do not reuse this pattern for non-AI-tutor affordances: the orb *is* the tutor's presence.

## 6. Do's and Don'ts

### Do:
- **Do** use Candlelight Gold as a ceremony. Primary CTAs, achievement borders, focus rings, the streak flame, the wordmark. ≤10% of any screen. If you want more gold, you want Vellum Champagne instead.
- **Do** use hairline dividers (`rgba(255,255,255,0.06)`) instead of boxed cards wherever possible. The "Философи" feature grid is the template: shared hairline background, 1px gap, tiles lay atop.
- **Do** use Playfair italic for editorial accents only. Section titles, pulled phrases, folio numbers (01/02/03), hero wordmarks. Never for body, never for buttons.
- **Do** tab-number every counter. Score, streak, progress, question index, quiz result. `nums-tabular` utility, always.
- **Do** honor `prefers-reduced-motion`. Pulse, orbPulse, pageFadeInUp, streak popup entrance: all must short-circuit to static when the user requests it.
- **Do** layer shadows with inset white highlights (0.03–0.08 alpha on the top edge). That's what makes the surface read as physical.
- **Do** pair uppercase kickers with hairline segments. The hero eyebrow is `[hairline][label][hairline]`: the hairlines are what make it editorial.
- **Do** keep body font-size ≥16px. Enforced globally for inputs. Mongolian Cyrillic at 14px is hard to read for older learners.

### Don't:
- **Don't** use side-stripe borders greater than 1px. The current `ChatBubble.tsx` AI variant uses `borderLeft: '3px solid #F59E0B'`: that is a violation of the absolute-ban rule. Refactor to: full 1px hairline-gold border + the 36px gold avatar carries the AI identity. The leading accent stripe is never the right answer.
- **Don't** use gradient-clipped text (`background-clip: text` with a gradient). Currently present on the hero "Core" wordmark and the level-code digit: both violations. Replace with a single solid Candlelight Gold and achieve emphasis through Playfair italic weight and display scale. Gradient text is decorative, never meaningful.
- **Don't** use `#000` or `#fff`. Every neutral tints toward Midnight Ink (hue ~260). `#F8FAFC` is the lightest allowed; `#070C18` is the darkest.
- **Don't** glassmorph by default. The nav's `backdrop-filter: blur(8px)` is purposeful (lets the ambient orb-pulse glow through). Don't replicate it on cards, modals, or chips: that's decoration, not function.
- **Don't** repeat identical card grids. Icon + heading + body triplets that march across the screen are the SaaS tell. The "Философи" grid works because it's hairline-separated and folio-numbered; it has one composition, not three.
- **Don't** write exclamation-point CTAs or urgency copy. No "Get Started!", no "Limited time!", no "Join 10,000+ learners". The CTA reads "Сургалт эхлэх" ("Begin training"). Confident, not pleading.
- **Don't** animate layout properties. Never transition width, height, margin, padding. Use transform (translate, scale) and opacity. Pulses use `box-shadow` with 0 blur-radius changes, not size changes.
- **Don't** use bounce or elastic easing. The system uses `ease-out` exponentials (standard, quart-ish). No `cubic-bezier(0.68, -0.55, 0.265, 1.55)` overshoot.
- **Don't** apply Candlelight Gold to body text. It's reserved. For emphasis in body, use Text Primary (`#F8FAFC`) at weight 600 or Vellum Champagne. Gold body is a slop tell.
- **Don't** introduce a third font. Playfair + Inter is the pairing. No Mongolian-specific serif, no mono, no decorative third weight. Inter handles Cyrillic cleanly with `ss01 cv11 calt`; trust it.
- **Don't** cartoonify gamification. No mascots, no combo multipliers, no punishment "hearts," no celebration confetti. The streak popup fades; it does not bounce.

### Known Violations (to remediate, not preserve)

The three entries below are contract violations against PRODUCT.md or the Bilingual Typography Rules that are currently live in the codebase. They are documented here so that future design work knows these are bugs-on-the-schedule, not canonical choices. The typography token frontmatter still lists Inter because the code still uses Inter; the frontmatter tracks reality, not aspiration. When the migrations land, update both this section and the frontmatter in the same PR.

**Violation 1: ChatBubble AI side-stripe.** `src/components/ChatBubble.tsx:37` renders the AI bubble with `borderLeft: '3px solid #F59E0B'`. A >1px colored side-stripe is an absolute-ban per shared design laws. *Remediation:* remove the `borderLeft`, add a full 1px `hairline-gold` border on all four sides, and let the existing 36px gold-gradient avatar carry the AI identity. The avatar is already there; the stripe is redundant.

**Violation 2: Gradient-clipped text.** `background-clip: text` with a gradient fill appears on: (a) the landing hero "Core" wordmark (`src/components/LandingPage.tsx:67–72`) and (b) the level-code digit in the LevelSelector card (`src/components/LevelSelector.tsx`). Gradient text is an absolute-ban: decorative, never meaningful, and poisons accessibility (color is not a reliable carrier). *Remediation:* replace both with a single solid Candlelight Gold fill. Emphasis is already carried by Playfair italic at display scale; the gradient adds nothing.

**Violation 3: Inter as canonical body font.** PRODUCT.md's anti-references explicitly name "Inter-everywhere Notion/Linear productivity aesthetic" as a direction to avoid. `src/app/layout.tsx:2,5` loads Inter via `next/font/google` with `subsets: ['latin']` and applies `inter.className` to `<body>`, making Inter the canonical body font for every route. This is a contract violation on two axes:
  - **Brand contradiction.** The system should not advertise its productivity-SaaS lineage typographically. The product voice is editorial-magazine, not Linear-dashboard. Inter is technically competent but carries the wrong association.
  - **Bilingual failure.** `subsets: ['latin']` ships no Cyrillic glyphs. Every Mongolian character in the UI is rendered by the browser's fallback (`system-ui` → Segoe UI / San Francisco / Roboto), which means the `ss01 cv11 calt` feature claim in body typography is a silent no-op on Cyrillic and the weight/x-height parity between Latin and Cyrillic is unmanaged. See *Bilingual Typography Rules* §7.
  - *Remediation path (preferred):* drop `next/font/google` for the body font. Use a native-OS system-sans stack (`-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`) as the canonical body font. System sans ships with full Cyrillic on every target OS, eliminates the font-loading FOUT, and sidesteps the Inter-aesthetic association. Calibrate `size-adjust` / `ascent-override` / `descent-override` per *Bilingual Typography Rules* §3 so cross-OS parity holds. Update the `typography.body`, `typography.title`, and `typography.label` frontmatter entries to `"-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"`. Remove the `ss01 cv11 calt` feature from body (those are Inter stylistic sets, not portable).
  - *Remediation path (alternative, if we keep a loaded font):* if a branded body font is kept for Latin, it must load with `subsets: ['latin', 'cyrillic']` at minimum, and a different font than Inter to avoid the brand contradiction (candidates: Source Sans 3, Work Sans, IBM Plex Sans — all Cyrillic-capable). This path is more work for less brand gain; prefer system-sans.

**Violation 4: Playfair Display loaded via CSS `@import`.** `src/app/globals.css:1` loads Playfair Display and EB Garamond via `@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400;1,700&family=EB+Garamond:ital,wght@0,400;1,400&display=swap');`. This is render-blocking (the browser must resolve the stylesheet before painting), bypasses Next.js's font optimization (no automatic `font-display`, no self-hosting, no preload hints), and leaks the user's IP to Google Fonts on every pageview. *Remediation:* migrate to `next/font/google` in `src/app/layout.tsx`, matching the existing Inter pattern:

```ts
import { Playfair_Display } from 'next/font/google'

const playfair = Playfair_Display({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '700'],
  style: ['normal', 'italic'],
  variable: '--font-playfair',
  display: 'swap',
})
```

Apply `playfair.variable` to the `<html>` className, then reference `var(--font-playfair)` from the `.font-serif-display` utility in `globals.css`. Delete the `@import` line. EB Garamond is a fallback only and does not require self-hosting. After the migration, verify no FOUT on the hero wordmark via a throttled-network reload.

## 7. Certificate Sub-System (Documented Exception)

The certificate is the only ceremonial artifact in Core English — it is a downloadable PNG users keep, screenshot, and share. It uses a deliberately distinct visual register from the working product surfaces: vintage-bullion gold on royal-navy with cream paper, designed as a printed diploma rather than a UI element. This sub-system applies ONLY to `CertificateModal` and any future downloadable achievement artifacts. It does NOT apply to in-app moments, transient states, streak popups, level-up animations, or working product screens.

### Sub-system tokens

| Token | Hex | Role |
|-------|-----|------|
| `certificate-navy` | `#0F1E3D` | Primary navy ground (deeper, more saturated than midnight-ink for printed-artifact contrast) |
| `certificate-navy-deep` | `#081230` | Shadow navy (corner accents, ribbon depth) |
| `certificate-gold` | `#C9A55C` | Vintage-bullion gold (primary metallic accent — distinct from candlelight-gold's bright UI hue) |
| `certificate-gold-deep` | `#8B6F2E` | Antique brass (deepest gold for shadow/depth) |
| `certificate-gold-light` | `#E8D29A` | Warm gold highlight |
| `certificate-gold-pale` | `#F5E7C2` | Pale gold tint (background washes, gradient stops) |
| `certificate-ivory` | `#FDFCF5` | Cream paper ground (warm off-white, never pure white) |

### Typography

The certificate sub-system uses BOTH display fonts:
- Playfair Display (`var(--serif)`) for headers, wordmark, name display
- EB Garamond (`var(--serif-garamond)`) for body text, dates, formal copy — chosen for its old-style figures and traditional book-typography register that reinforces the printed-diploma feel

Both fonts are loaded via `next/font/google` in `src/app/layout.tsx`.

### Rule

The certificate sub-system applies ONLY to artifacts the user downloads and keeps. It does NOT apply to in-app UI. Any new ceremonial artifact (future achievement downloads, etc.) may opt into this sub-system. Working product screens, transient celebration states, and modals that don't produce a downloadable artifact MUST use the main design system tokens (midnight-ink, candlelight-gold, etc.), not `certificate-*` tokens.
