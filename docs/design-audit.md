# Design Token Audit — Core English

**Scope:** Read-only inventory of design-token usage across the codebase vs. `DESIGN.md`.
**Produced:** 2026-04-25 on branch `audit/design-tokens` (off `origin/master` @ `2c97f5f`).
**Constraint:** Inventory only. No code changes. No refactor plan. Uncertain mappings are marked `NEEDS DECISION`.

---

## §1. Current Token Definitions

### §1a. Tailwind tokens — [tailwind.config.ts](tailwind.config.ts)

| Kind | Name | Value | Line |
|------|------|-------|------|
| color | `navy` | `#0B1222` | [tailwind.config.ts:12](tailwind.config.ts:12) |
| color | `navy-deep` | `#070C18` | [tailwind.config.ts:13](tailwind.config.ts:13) |
| color | `navy-surface` | `#141C30` | [tailwind.config.ts:14](tailwind.config.ts:14) |
| color | `navy-surface-2` | `#1F2940` | [tailwind.config.ts:15](tailwind.config.ts:15) |
| color | `gold` | `#F59E0B` | [tailwind.config.ts:16](tailwind.config.ts:16) |
| color | `gold-light` | `#FCD34D` | [tailwind.config.ts:17](tailwind.config.ts:17) |
| color | `gold-dark` | `#D97706` | [tailwind.config.ts:18](tailwind.config.ts:18) |
| color | `champagne` | `#E4C08A` | [tailwind.config.ts:19](tailwind.config.ts:19) |
| color | `text-primary` | `var(--text-primary)` | [tailwind.config.ts:20](tailwind.config.ts:20) |
| color | `text-secondary` | `var(--text-secondary)` | [tailwind.config.ts:21](tailwind.config.ts:21) |
| font | `serif` | `var(--font-playfair), EB Garamond, Georgia, serif` | [tailwind.config.ts:24](tailwind.config.ts:24) |
| font | `display` | `var(--font-playfair), Georgia, serif` | [tailwind.config.ts:25](tailwind.config.ts:25) |
| animation | `fade-in` | `fadeIn 0.3s ease-in-out` | [tailwind.config.ts:28](tailwind.config.ts:28) |
| animation | `slide-up` | `slideUp 0.3s ease-out` | [tailwind.config.ts:29](tailwind.config.ts:29) |
| animation | `pulse-gold` | `pulseGold 2s infinite` | [tailwind.config.ts:30](tailwind.config.ts:30) |

### §1b. CSS custom properties — [src/app/globals.css](src/app/globals.css) `:root`

| Variable | Value | Line |
|----------|-------|------|
| `--navy` | `#0B1222` | [src/app/globals.css:6](src/app/globals.css:6) |
| `--navy-deep` | `#070C18` | [src/app/globals.css:7](src/app/globals.css:7) |
| `--gold` | `#F59E0B` | [src/app/globals.css:8](src/app/globals.css:8) |
| `--gold-light` | `#FCD34D` | [src/app/globals.css:9](src/app/globals.css:9) |
| `--gold-dark` | `#D97706` | [src/app/globals.css:10](src/app/globals.css:10) |
| `--champagne` | `#E4C08A` | [src/app/globals.css:11](src/app/globals.css:11) |
| `--navy-surface` | `#141C30` | [src/app/globals.css:12](src/app/globals.css:12) |
| `--navy-surface-2` | `#1F2940` | [src/app/globals.css:13](src/app/globals.css:13) |
| `--hairline` | `rgba(255, 255, 255, 0.06)` | [src/app/globals.css:14](src/app/globals.css:14) |
| `--hairline-gold` | `rgba(245, 158, 11, 0.18)` | [src/app/globals.css:15](src/app/globals.css:15) |
| `--text-primary` | `#F8FAFC` | [src/app/globals.css:16](src/app/globals.css:16) |
| `--text-secondary` | `#CBD5E1` | [src/app/globals.css:17](src/app/globals.css:17) |
| `--text-muted` | `#64748B` | [src/app/globals.css:18](src/app/globals.css:18) |
| `--serif` | `var(--font-playfair), 'EB Garamond', Georgia, serif` | [src/app/globals.css:19](src/app/globals.css:19) |

Named shadow utilities: `.shadow-gold` [src/app/globals.css:115](src/app/globals.css:115), `.shadow-gold-sm` [src/app/globals.css:123](src/app/globals.css:123), `.shadow-editorial` [src/app/globals.css:130](src/app/globals.css:130).
Named border utilities: `.hairline` [src/app/globals.css:71](src/app/globals.css:71), `.hairline-gold` [src/app/globals.css:74](src/app/globals.css:74).
Named card: `.card-gold-border` [src/app/globals.css:138](src/app/globals.css:138).

### §1c. Font loader — [src/app/layout.tsx](src/app/layout.tsx)

- `Playfair_Display` loaded via `next/font/google` at [src/app/layout.tsx:5-10](src/app/layout.tsx:5) with `subsets: ['latin']`, `weight: ['400', '700']`, `variable: '--font-playfair'`, `display: 'swap'`.
- Attached: `<html lang="mn" className={playfair.variable}>` at [src/app/layout.tsx:26](src/app/layout.tsx:26).
- **Gap:** `style: 'italic'` is not explicitly requested — italic glyphs may be synthesized. `subsets` does not include `cyrillic`. EB Garamond is referenced in `--serif` fallback stack but is never loaded.

### §1d. Token-name mapping (code ↔ DESIGN.md)

| Code token | DESIGN.md name | DESIGN.md line |
|-----------|---------------|----------------|
| `navy` `#0B1222` | `midnight-ink` `#0B1222` | [DESIGN.md:16](DESIGN.md:16) |
| `navy-deep` `#070C18` | `ink-shadow` `#070C18` | [DESIGN.md:17](DESIGN.md:17) |
| `navy-surface` `#141C30` | `ink-surface` `#141C30` | [DESIGN.md:18](DESIGN.md:18) |
| `navy-surface-2` `#1F2940` | `ink-elevated` `#1F2940` | [DESIGN.md:19](DESIGN.md:19) |
| `gold` `#F59E0B` | `candlelight-gold` `#F59E0B` | [DESIGN.md:21](DESIGN.md:21) |
| `gold-light` `#FCD34D` | `ember-glow` `#FCD34D` | [DESIGN.md:22](DESIGN.md:22) |
| `gold-dark` `#D97706` | `deep-brass` `#D97706` | [DESIGN.md:23](DESIGN.md:23) |
| `champagne` `#E4C08A` | `vellum-champagne` `#E4C08A` | [DESIGN.md:24](DESIGN.md:24) |

---

## §2. Color Literal Inventory (grouped by visual family)

All sites below use raw hex/rgb values rather than tokens/utilities. Grouping is by perceptual similarity, not by component.

### §2a. Gold base `#F59E0B` (= `--gold` / `gold`) — raw usages bypass the token

Representative hits (not exhaustive; the pattern repeats across nearly every component):
- [src/app/globals.css:228](src/app/globals.css:228) — `.prose strong { color: #F59E0B; }`
- [src/app/globals.css:242](src/app/globals.css:242) — `.streaming-cursor::after { color: #F59E0B; }`
- [src/app/globals.css:257](src/app/globals.css:257), [src/app/globals.css:266](src/app/globals.css:266) — `*:focus-visible { outline: 2px solid #F59E0B; }` and scoped variant
- [src/components/ChatBubble.tsx:26](src/components/ChatBubble.tsx:26), [src/components/ChatBubble.tsx:37](src/components/ChatBubble.tsx:37), [src/components/ChatBubble.tsx:41](src/components/ChatBubble.tsx:41)
- [src/components/ChatInterface.tsx:208](src/components/ChatInterface.tsx:208), [src/components/ChatInterface.tsx:283](src/components/ChatInterface.tsx:283)
- [src/components/FreeChatInterface.tsx:179](src/components/FreeChatInterface.tsx:179), [src/components/FreeChatInterface.tsx:248](src/components/FreeChatInterface.tsx:248)
- [src/components/DailyChallenge.tsx:217](src/components/DailyChallenge.tsx:217)
- [src/components/ielts/IELTSListening.tsx:13](src/components/ielts/IELTSListening.tsx:13), [:93](src/components/ielts/IELTSListening.tsx:93), [:105](src/components/ielts/IELTSListening.tsx:105), [:113](src/components/ielts/IELTSListening.tsx:113), [:115](src/components/ielts/IELTSListening.tsx:115), [:121](src/components/ielts/IELTSListening.tsx:121), [:130](src/components/ielts/IELTSListening.tsx:130), [:138](src/components/ielts/IELTSListening.tsx:138), [:158](src/components/ielts/IELTSListening.tsx:158), [:174](src/components/ielts/IELTSListening.tsx:174), [:189](src/components/ielts/IELTSListening.tsx:189), [:199](src/components/ielts/IELTSListening.tsx:199)
- [src/components/ielts/IELTSReading.tsx:44](src/components/ielts/IELTSReading.tsx:44), [:46](src/components/ielts/IELTSReading.tsx:46), [:103](src/components/ielts/IELTSReading.tsx:103), [:110](src/components/ielts/IELTSReading.tsx:110), [:132](src/components/ielts/IELTSReading.tsx:132), [:154](src/components/ielts/IELTSReading.tsx:154), [:159](src/components/ielts/IELTSReading.tsx:159), [:179](src/components/ielts/IELTSReading.tsx:179), [:180](src/components/ielts/IELTSReading.tsx:180), [:187](src/components/ielts/IELTSReading.tsx:187), [:188](src/components/ielts/IELTSReading.tsx:188)
- [src/components/ielts/IELTSWriting.tsx:25](src/components/ielts/IELTSWriting.tsx:25), [:81](src/components/ielts/IELTSWriting.tsx:81), [:177](src/components/ielts/IELTSWriting.tsx:177), [:267](src/components/ielts/IELTSWriting.tsx:267)
- [src/components/ielts/ielts-shared.tsx:37](src/components/ielts/ielts-shared.tsx:37), [:39](src/components/ielts/ielts-shared.tsx:39), [:113](src/components/ielts/ielts-shared.tsx:113)
- [src/components/IELTSTest.tsx:115](src/components/IELTSTest.tsx:115), [:185](src/components/IELTSTest.tsx:185), [:1151](src/components/IELTSTest.tsx:1151), [:1223](src/components/IELTSTest.tsx:1223), [:1269](src/components/IELTSTest.tsx:1269), [:1402](src/components/IELTSTest.tsx:1402), [:1443](src/components/IELTSTest.tsx:1443), [:1447](src/components/IELTSTest.tsx:1447), [:1470](src/components/IELTSTest.tsx:1470), [:1491](src/components/IELTSTest.tsx:1491), [:1586](src/components/IELTSTest.tsx:1586), [:1821](src/components/IELTSTest.tsx:1821)
- [src/components/IELTSSpeakingRealtime.tsx:75](src/components/IELTSSpeakingRealtime.tsx:75), [:590](src/components/IELTSSpeakingRealtime.tsx:590), [:599](src/components/IELTSSpeakingRealtime.tsx:599), [:618](src/components/IELTSSpeakingRealtime.tsx:618), [:643](src/components/IELTSSpeakingRealtime.tsx:643), [:647](src/components/IELTSSpeakingRealtime.tsx:647)
- [src/components/LandingPage.tsx:68](src/components/LandingPage.tsx:68), [:119](src/components/LandingPage.tsx:119)
- [src/components/LevelPage.tsx:46](src/components/LevelPage.tsx:46), [:89](src/components/LevelPage.tsx:89)
- [src/components/LevelSelector.tsx:32](src/components/LevelSelector.tsx:32), [:75](src/components/LevelSelector.tsx:75), [:115](src/components/LevelSelector.tsx:115)
- [src/components/MistakeDiary.tsx:44](src/components/MistakeDiary.tsx:44)
- [src/components/QuizMode.tsx:421](src/components/QuizMode.tsx:421), [:477](src/components/QuizMode.tsx:477)
- [src/components/StreakPopup.tsx:76](src/components/StreakPopup.tsx:76)
- [src/app/profile/page.tsx:109](src/app/profile/page.tsx:109), [:138](src/app/profile/page.tsx:138), [:369](src/app/profile/page.tsx:369)
- [src/components/CertificateModal.tsx:555](src/components/CertificateModal.tsx:555)

### §2b. Gold bright `#FCD34D` (= `--gold-light`)
- [src/app/globals.css:140](src/app/globals.css:140)
- [src/components/ielts/IELTSListening.tsx:138](src/components/ielts/IELTSListening.tsx:138) (inside gradient), [src/components/ielts/ielts-shared.tsx:37](src/components/ielts/ielts-shared.tsx:37)
- [src/components/IELTSTest.tsx:1151](src/components/IELTSTest.tsx:1151), [:1404](src/components/IELTSTest.tsx:1404), [:1465](src/components/IELTSTest.tsx:1465), [:1478](src/components/IELTSTest.tsx:1478), [:1491](src/components/IELTSTest.tsx:1491), [:1586](src/components/IELTSTest.tsx:1586)
- [src/components/IELTSSpeakingRealtime.tsx:635](src/components/IELTSSpeakingRealtime.tsx:635), [:647](src/components/IELTSSpeakingRealtime.tsx:647)
- [src/components/LandingPage.tsx:68](src/components/LandingPage.tsx:68), [src/components/LevelPage.tsx:46](src/components/LevelPage.tsx:46), [:89](src/components/LevelPage.tsx:89)
- [src/components/LevelSelector.tsx:75](src/components/LevelSelector.tsx:75), [:115](src/components/LevelSelector.tsx:115)
- [src/components/MistakeDiary.tsx:44](src/components/MistakeDiary.tsx:44), [src/components/QuizMode.tsx:477](src/components/QuizMode.tsx:477), [src/components/StreakPopup.tsx:76](src/components/StreakPopup.tsx:76)
- [src/app/profile/page.tsx:109](src/app/profile/page.tsx:109), [:144](src/app/profile/page.tsx:144), [:286](src/app/profile/page.tsx:286)

### §2c. Gold deep `#D97706` (= `--gold-dark`)
Used pervasively as the terminal stop of the 135° gold gradient alongside `#F59E0B`. Representative: [src/components/ChatBubble.tsx:26](src/components/ChatBubble.tsx:26), [src/components/ChatBubble.tsx:41](src/components/ChatBubble.tsx:41), all IELTS CTAs, profile tile backgrounds, LandingPage CTA, CertificateModal CTA.

### §2d. Champagne `#E4C08A` (= `--champagne`)
- [src/components/ielts/ielts-shared.tsx:39](src/components/ielts/ielts-shared.tsx:39)
- [src/components/IELTSTest.tsx:1151](src/components/IELTSTest.tsx:1151), [:1586](src/components/IELTSTest.tsx:1586)
- [src/components/LandingPage.tsx:68](src/components/LandingPage.tsx:68), [src/components/LevelPage.tsx:46](src/components/LevelPage.tsx:46)
- [src/components/LevelSelector.tsx:32](src/components/LevelSelector.tsx:32), [:75](src/components/LevelSelector.tsx:75)
- [src/components/MistakeDiary.tsx:44](src/components/MistakeDiary.tsx:44), [src/components/QuizMode.tsx:477](src/components/QuizMode.tsx:477)
- [src/app/profile/page.tsx:109](src/app/profile/page.tsx:109), [:138](src/app/profile/page.tsx:138)

### §2e. Navy surface `#141C30` (= `--navy-surface`)
Nearly 20 sites use the literal instead of `bg-navy-surface` / `var(--navy-surface)`:
- [src/app/profile/page.tsx:138](src/app/profile/page.tsx:138), [:191](src/app/profile/page.tsx:191), [:277](src/app/profile/page.tsx:277), [:418](src/app/profile/page.tsx:418)
- [src/components/ChatInterface.tsx:257](src/components/ChatInterface.tsx:257), [src/components/FreeChatInterface.tsx:221](src/components/FreeChatInterface.tsx:221)
- [src/components/DailyChallenge.tsx:67](src/components/DailyChallenge.tsx:67)
- [src/components/IELTSTest.tsx:1194](src/components/IELTSTest.tsx:1194), [:1240](src/components/IELTSTest.tsx:1240), [:1610](src/components/IELTSTest.tsx:1610), [:1671](src/components/IELTSTest.tsx:1671), [:1724](src/components/IELTSTest.tsx:1724), [:1772](src/components/IELTSTest.tsx:1772)
- [src/components/LevelPage.tsx:103](src/components/LevelPage.tsx:103), [:153](src/components/LevelPage.tsx:153), [:208](src/components/LevelPage.tsx:208)
- [src/components/LevelSelector.tsx:32](src/components/LevelSelector.tsx:32), [:33](src/components/LevelSelector.tsx:33)
- [src/components/MistakeDiary.tsx:68](src/components/MistakeDiary.tsx:68), [:86](src/components/MistakeDiary.tsx:86), [:103](src/components/MistakeDiary.tsx:103), [:131](src/components/MistakeDiary.tsx:131)
- [src/components/NavBar.tsx:155](src/components/NavBar.tsx:155)
- [src/components/QuizMode.tsx:421](src/components/QuizMode.tsx:421), [:509](src/components/QuizMode.tsx:509), [:539](src/components/QuizMode.tsx:539)
- [src/components/StreakPopup.tsx:28](src/components/StreakPopup.tsx:28)

### §2f. Near-navy drift — undeclared dark values near the ink ramp

These hexes sit *between* `--navy-deep` (`#070C18`), `--navy` (`#0B1222`), `--navy-surface` (`#141C30`), and `--navy-surface-2` (`#1F2940`) but are not declared as tokens:

| Hex | Approx. role | Sites |
|-----|---|---|
| `#050D1A` | Darker-than-`navy-deep` speaking background | [src/components/IELTSSpeakingRealtime.tsx:545](src/components/IELTSSpeakingRealtime.tsx:545), [src/components/IELTSTest.tsx:1408](src/components/IELTSTest.tsx:1408) |
| `#0F1729` | Secondary card surface | [src/app/profile/page.tsx:386](src/app/profile/page.tsx:386), [src/components/DailyChallenge.tsx:131](src/components/DailyChallenge.tsx:131), [:195](src/components/DailyChallenge.tsx:195), [src/components/IELTSTest.tsx:1631](src/components/IELTSTest.tsx:1631), [src/components/ielts/IELTSWriting.tsx:87](src/components/ielts/IELTSWriting.tsx:87), [:148](src/components/ielts/IELTSWriting.tsx:148), [:237](src/components/ielts/IELTSWriting.tsx:237), [src/components/StreakPopup.tsx:28](src/components/StreakPopup.tsx:28) |
| `#0F172A` | Text-on-gold + passage surface | [src/components/ChatBubble.tsx:42](src/components/ChatBubble.tsx:42), [src/components/ChatInterface.tsx:284](src/components/ChatInterface.tsx:284), [src/components/FreeChatInterface.tsx:249](src/components/FreeChatInterface.tsx:249), [src/components/ielts/IELTSListening.tsx:94](src/components/ielts/IELTSListening.tsx:94), [:138](src/components/ielts/IELTSListening.tsx:138), [:174](src/components/ielts/IELTSListening.tsx:174), [:181](src/components/ielts/IELTSListening.tsx:181), [:189](src/components/ielts/IELTSListening.tsx:189), [:199](src/components/ielts/IELTSListening.tsx:199), [src/components/ielts/IELTSReading.tsx:88](src/components/ielts/IELTSReading.tsx:88), [:173](src/components/ielts/IELTSReading.tsx:173), [:208](src/components/ielts/IELTSReading.tsx:208), [src/components/IELTSSpeakingRealtime.tsx:643](src/components/IELTSSpeakingRealtime.tsx:643), [src/components/IELTSTest.tsx:1447](src/components/IELTSTest.tsx:1447), [:1487](src/components/IELTSTest.tsx:1487), [:1502](src/components/IELTSTest.tsx:1502) |
| `#0F1E3D` | CertificateModal local NAVY | [src/components/CertificateModal.tsx:16](src/components/CertificateModal.tsx:16) |
| `#081230` | CertificateModal NAVY_DEEP | [src/components/CertificateModal.tsx:17](src/components/CertificateModal.tsx:17) |
| `#162032` | IELTSWriting alternating-row background | [src/components/ielts/IELTSWriting.tsx:27](src/components/ielts/IELTSWriting.tsx:27) |
| `#182038` | Body radial-gradient inner stop | [src/app/globals.css:37](src/app/globals.css:37) |
| `#1E293B` | Chat tutor bubble, tables, card-gold-border, .prose code bg | [src/app/globals.css:139](src/app/globals.css:139), [src/components/ChatBubble.tsx:36](src/components/ChatBubble.tsx:36), [src/components/ChatInterface.tsx:216](src/components/ChatInterface.tsx:216), [src/components/FreeChatInterface.tsx:187](src/components/FreeChatInterface.tsx:187), [src/components/ielts/IELTSListening.tsx:93](src/components/ielts/IELTSListening.tsx:93), [:105](src/components/ielts/IELTSListening.tsx:105), [src/components/ielts/IELTSReading.tsx:50](src/components/ielts/IELTSReading.tsx:50), [src/components/ielts/IELTSWriting.tsx:27](src/components/ielts/IELTSWriting.tsx:27), [src/components/ielts/ielts-shared.tsx:87](src/components/ielts/ielts-shared.tsx:87), [src/components/IELTSSpeakingRealtime.tsx:624](src/components/IELTSSpeakingRealtime.tsx:624), [src/components/IELTSTest.tsx:1470](src/components/IELTSTest.tsx:1470) |

### §2g. Slate border `#334155` (undeclared)
Used as neutral borders & progress bars: [src/components/ielts/ielts-shared.tsx:75](src/components/ielts/ielts-shared.tsx:75), [:113](src/components/ielts/ielts-shared.tsx:113); [src/components/ielts/IELTSListening.tsx:120](src/components/ielts/IELTSListening.tsx:120), [:181](src/components/ielts/IELTSListening.tsx:181), [:189](src/components/ielts/IELTSListening.tsx:189); [src/components/ielts/IELTSReading.tsx:91](src/components/ielts/IELTSReading.tsx:91), [:159](src/components/ielts/IELTSReading.tsx:159); [src/components/ielts/IELTSWriting.tsx:28](src/components/ielts/IELTSWriting.tsx:28); [src/components/IELTSSpeakingRealtime.tsx:624](src/components/IELTSSpeakingRealtime.tsx:624); [src/components/IELTSTest.tsx:1502](src/components/IELTSTest.tsx:1502).

### §2h. Muted text `#94A3B8` (undeclared midpoint)
Sits between `--text-secondary` (`#CBD5E1`) and `--text-muted` (`#64748B`) — 14 sites:
- [src/components/LandingPage.tsx:82](src/components/LandingPage.tsx:82), [:226](src/components/LandingPage.tsx:226)
- [src/components/ielts/ielts-shared.tsx:90](src/components/ielts/ielts-shared.tsx:90)
- [src/components/ielts/IELTSListening.tsx:160](src/components/ielts/IELTSListening.tsx:160), [:163](src/components/ielts/IELTSListening.tsx:163), [:181](src/components/ielts/IELTSListening.tsx:181)
- [src/components/ielts/IELTSReading.tsx:133](src/components/ielts/IELTSReading.tsx:133)
- [src/components/IELTSSpeakingRealtime.tsx:601](src/components/IELTSSpeakingRealtime.tsx:601), [:638](src/components/IELTSSpeakingRealtime.tsx:638)
- [src/components/IELTSTest.tsx:1387](src/components/IELTSTest.tsx:1387), [:1481](src/components/IELTSTest.tsx:1481)
- (14 total across file)

### §2i. Text-on-gold `#0B1222` (= `--navy`)
Gold CTAs render navy text via literal: [src/app/profile/page.tsx:287](src/app/profile/page.tsx:287), [:370](src/app/profile/page.tsx:370), [src/components/ChatInterface.tsx:209](src/components/ChatInterface.tsx:209), [src/components/DailyChallenge.tsx:218](src/components/DailyChallenge.tsx:218), [src/components/FreeChatInterface.tsx:180](src/components/FreeChatInterface.tsx:180), [src/components/ielts/IELTSWriting.tsx:82](src/components/ielts/IELTSWriting.tsx:82), [:178](src/components/ielts/IELTSWriting.tsx:178), [:268](src/components/ielts/IELTSWriting.tsx:268), [src/components/IELTSTest.tsx:1224](src/components/IELTSTest.tsx:1224), [:1270](src/components/IELTSTest.tsx:1270), [:1822](src/components/IELTSTest.tsx:1822), [src/components/LandingPage.tsx:120](src/components/LandingPage.tsx:120), [src/components/CertificateModal.tsx:556](src/components/CertificateModal.tsx:556).

### §2j. Slate-muted `#475569` — text on disabled/ghost (undeclared)
Single site: [src/components/ielts/IELTSListening.tsx:94](src/components/ielts/IELTSListening.tsx:94).

### §2k. Validation colors (undeclared)

| Role | Hex | Sites |
|------|-----|-------|
| Success | `#34D399` | [src/components/DailyChallenge.tsx:138](src/components/DailyChallenge.tsx:138), [:233](src/components/DailyChallenge.tsx:233), [:250](src/components/DailyChallenge.tsx:250); [src/components/ErrorCorrection.tsx:136](src/components/ErrorCorrection.tsx:136); [src/components/ielts/ielts-shared.tsx:75](src/components/ielts/ielts-shared.tsx:75), [:76](src/components/ielts/ielts-shared.tsx:76), [:91](src/components/ielts/ielts-shared.tsx:91), [:113](src/components/ielts/ielts-shared.tsx:113), [:114](src/components/ielts/ielts-shared.tsx:114); [src/components/ielts/IELTSListening.tsx:134](src/components/ielts/IELTSListening.tsx:134); [src/components/ielts/IELTSWriting.tsx:168](src/components/ielts/IELTSWriting.tsx:168), [:257](src/components/ielts/IELTSWriting.tsx:257); [src/components/IELTSTest.tsx:115](src/components/IELTSTest.tsx:115); [src/components/LevelPage.tsx:251](src/components/LevelPage.tsx:251); [src/components/MistakeDiary.tsx:171](src/components/MistakeDiary.tsx:171) |
| Success alt | `#34D39988` | [src/components/ielts/IELTSReading.tsx:159](src/components/ielts/IELTSReading.tsx:159) (same hue, alpha 0.53) |
| Success bright | `#10B981` | [src/components/QuizMode.tsx:502](src/components/QuizMode.tsx:502) |
| Success deep | `#059669` | [src/components/QuizMode.tsx:502](src/components/QuizMode.tsx:502) |
| Danger | `#F87171` | [src/components/DailyChallenge.tsx:142](src/components/DailyChallenge.tsx:142), [:233](src/components/DailyChallenge.tsx:233); [src/components/ErrorCorrection.tsx:118](src/components/ErrorCorrection.tsx:118); [src/components/ielts/ielts-shared.tsx:75](src/components/ielts/ielts-shared.tsx:75), [:76](src/components/ielts/ielts-shared.tsx:76), [:113](src/components/ielts/ielts-shared.tsx:113), [:114](src/components/ielts/ielts-shared.tsx:114); [src/components/IELTSSpeakingRealtime.tsx:609](src/components/IELTSSpeakingRealtime.tsx:609); [src/components/IELTSTest.tsx:115](src/components/IELTSTest.tsx:115), [:1175](src/components/IELTSTest.tsx:1175); [src/components/MistakeDiary.tsx:158](src/components/MistakeDiary.tsx:158) |
| Danger alt | `#FCA5A5` | [src/components/IELTSSpeakingRealtime.tsx:552](src/components/IELTSSpeakingRealtime.tsx:552); [src/components/IELTSTest.tsx:1416](src/components/IELTSTest.tsx:1416); [src/components/LevelPage.tsx:21](src/components/LevelPage.tsx:21) |
| Danger bright | `#EF4444` | [src/components/IELTSSpeakingRealtime.tsx:552](src/components/IELTSSpeakingRealtime.tsx:552), [:567](src/components/IELTSSpeakingRealtime.tsx:567); [src/components/IELTSTest.tsx:1416](src/components/IELTSTest.tsx:1416), [:1426](src/components/IELTSTest.tsx:1426) |
| Danger scrim | `rgba(239,68,68,0.2)` / `rgba(239,68,68,0.9)` / `rgba(239,68,68,0.4)` | same files as above |
| Danger-text | `#FFF5F5` | [src/components/IELTSSpeakingRealtime.tsx:568](src/components/IELTSSpeakingRealtime.tsx:568); [src/components/IELTSTest.tsx:1426](src/components/IELTSTest.tsx:1426) |
| Rose progress | `#E11D48`, `#F43F5E` | [src/components/QuizMode.tsx:503](src/components/QuizMode.tsx:503) |

### §2l. Orb state colors (undeclared)

| State | Hex | Sites |
|-------|-----|-------|
| idle (blue) | `#1E40AF` | [src/components/IELTSSpeakingRealtime.tsx:74](src/components/IELTSSpeakingRealtime.tsx:74); [src/components/IELTSTest.tsx:184](src/components/IELTSTest.tsx:184) |
| listening (cyan) | `#38BDF8` | [src/components/IELTSSpeakingRealtime.tsx:76](src/components/IELTSSpeakingRealtime.tsx:76); [src/components/IELTSTest.tsx:186](src/components/IELTSTest.tsx:186), [:1403](src/components/IELTSTest.tsx:1403), [:1509](src/components/IELTSTest.tsx:1509), [:1515](src/components/IELTSTest.tsx:1515) |
| listening panel scrim | `#38BDF808`, `#38BDF822` | [src/components/IELTSTest.tsx:1509](src/components/IELTSTest.tsx:1509) |
| thinking (violet) | `#8B5CF6` | [src/components/IELTSSpeakingRealtime.tsx:77](src/components/IELTSSpeakingRealtime.tsx:77); [src/components/IELTSTest.tsx:187](src/components/IELTSTest.tsx:187), [:1405](src/components/IELTSTest.tsx:1405) |

### §2m. CertificateModal disjoint palette — [src/components/CertificateModal.tsx](src/components/CertificateModal.tsx)

A wholly distinct luxury-warm palette, declared as module-local `const`s, disconnected from the system tokens:

| const | Hex | Line |
|-------|-----|------|
| `NAVY` | `#0F1E3D` | [src/components/CertificateModal.tsx:16](src/components/CertificateModal.tsx:16) |
| `NAVY_DEEP` | `#081230` | [src/components/CertificateModal.tsx:17](src/components/CertificateModal.tsx:17) |
| `GOLD` | `#C9A55C` | [src/components/CertificateModal.tsx:18](src/components/CertificateModal.tsx:18) |
| `GOLD_DARK` | `#8B6F2E` | [src/components/CertificateModal.tsx:19](src/components/CertificateModal.tsx:19) |
| `GOLD_LIGHT` | `#E8D29A` | [src/components/CertificateModal.tsx:20](src/components/CertificateModal.tsx:20) |
| `GOLD_PALE` | `#F5E7C2` | [src/components/CertificateModal.tsx:21](src/components/CertificateModal.tsx:21) |
| `IVORY` | `#FDFCF5` | [src/components/CertificateModal.tsx:22](src/components/CertificateModal.tsx:22) |
| SVG stop | `#FFF4D6` | [src/components/CertificateModal.tsx:171](src/components/CertificateModal.tsx:171) |
| CTA background/color | `#F59E0B` / `#D97706` / `#0B1222` (system gold reappears here only) | [src/components/CertificateModal.tsx:555](src/components/CertificateModal.tsx:555), [:556](src/components/CertificateModal.tsx:556) |

### §2n. Gold alpha ladder (15+ distinct alphas of `#F59E0B` / `245,158,11`)

Usages are a mix of hex-with-alpha (`#F59E0B33`, `#F59E0B55`, `#F59E0B66`) and rgba (`rgba(245,158,11,0.N)`). Only `--hairline-gold` (`rgba(245,158,11,0.18)`) is tokenized.

| Alpha | Usage | Sample sites |
|-------|-------|--------------|
| 0.04 | – | (unseen) |
| 0.06 | – | (unseen) |
| 0.08 | body hero-glow background | [src/app/globals.css:36](src/app/globals.css:36) |
| 0.15 | `.prose code` background | [src/app/globals.css:231](src/app/globals.css:231) |
| 0.18 | `--hairline-gold` (tokenized) | [src/app/globals.css:15](src/app/globals.css:15) |
| 0.20 (`F59E0B33`) | badge border | [src/components/ielts/IELTSListening.tsx:105](src/components/ielts/IELTSListening.tsx:105); [src/components/IELTSTest.tsx:1470](src/components/IELTSTest.tsx:1470) |
| 0.25 | `.shadow-gold-sm` outer glow | [src/app/globals.css:127](src/app/globals.css:127) |
| 0.33 (`F59E0B55`) | part-2 countdown card border | [src/components/IELTSSpeakingRealtime.tsx:643](src/components/IELTSSpeakingRealtime.tsx:643); [src/components/IELTSTest.tsx:1487](src/components/IELTSTest.tsx:1487) |
| 0.35 | `.shadow-gold` outer glow | [src/app/globals.css:120](src/app/globals.css:120) |
| 0.40 (`F59E0B66`) | active option glow | [src/components/ielts/IELTSListening.tsx:95](src/components/ielts/IELTSListening.tsx:95) |
| 0.40 (`rgba(...,0.4)`) | card-gold-border gradient (dimmed) | [src/components/QuizMode.tsx:421](src/components/QuizMode.tsx:421) |

**Champagne alpha ladder (`rgba(228,192,138,N)`):** 0.2 — [src/components/QuizMode.tsx:421](src/components/QuizMode.tsx:421) (only site).

### §2o. Other isolated hexes

| Hex | Role | Site |
|-----|-----|------|
| `#F8FAFC` | Plain white body text (= `--text-primary`) | [src/components/ChatBubble.tsx:38](src/components/ChatBubble.tsx:38); [src/components/ielts/ielts-shared.tsx:76](src/components/ielts/ielts-shared.tsx:76), [:114](src/components/ielts/ielts-shared.tsx:114); [src/components/ielts/IELTSListening.tsx:189](src/components/ielts/IELTSListening.tsx:189) |
| `#CBD5E1` | = `--text-secondary` (literal) | [src/components/IELTSSpeakingRealtime.tsx:624](src/components/IELTSSpeakingRealtime.tsx:624) |
| `#64748B` | = `--text-muted` (literal) | [src/components/ielts/ielts-shared.tsx:114](src/components/ielts/ielts-shared.tsx:114); [src/components/ielts/IELTSListening.tsx:142](src/components/ielts/IELTSListening.tsx:142), [:153](src/components/ielts/IELTSListening.tsx:153); [src/components/ielts/IELTSReading.tsx:155](src/components/ielts/IELTSReading.tsx:155), [:179](src/components/ielts/IELTSReading.tsx:179), [:187](src/components/ielts/IELTSReading.tsx:187); [src/components/IELTSSpeakingRealtime.tsx:584](src/components/IELTSSpeakingRealtime.tsx:584); [src/components/IELTSTest.tsx:133](src/components/IELTSTest.tsx:133), [:1440](src/components/IELTSTest.tsx:1440) |
| `#FFFFFF` alpha (`rgba(255,255,255,0.03/0.04/0.06/0.08)`) | Inset-highlight shadows + hairline + hover bg | [src/app/globals.css:14](src/app/globals.css:14), [:117](src/app/globals.css:117), [:125](src/app/globals.css:125), [:132](src/app/globals.css:132); [src/components/QuizMode.tsx:570](src/components/QuizMode.tsx:570) (`white/[0.03]`) |
| `#000000` alpha (`rgba(0,0,0,0.3/0.4/0.5)`) | Layered shadow ladders | [src/app/globals.css:118-134](src/app/globals.css:118) |

---

## §3. Font Literal Inventory

### §3a. Utility: `.font-serif-display` — [src/app/globals.css:59-63](src/app/globals.css:59) → `var(--serif)` = `Playfair Display, EB Garamond, Georgia, serif`

Used at 28 sites (all intended editorial display text):
- [src/app/profile/page.tsx:86](src/app/profile/page.tsx:86), [:107](src/app/profile/page.tsx:107), [:143](src/app/profile/page.tsx:143), [:148](src/app/profile/page.tsx:148), [:284](src/app/profile/page.tsx:284)
- [src/components/ChatInterface.tsx:180](src/components/ChatInterface.tsx:180), [:186](src/components/ChatInterface.tsx:186)
- [src/components/FreeChatInterface.tsx:153](src/components/FreeChatInterface.tsx:153), [:159](src/components/FreeChatInterface.tsx:159)
- [src/components/DailyChallenge.tsx:97](src/components/DailyChallenge.tsx:97), [:172](src/components/DailyChallenge.tsx:172), [:256](src/components/DailyChallenge.tsx:256), [:263](src/components/DailyChallenge.tsx:263)
- [src/components/ErrorCorrection.tsx:69](src/components/ErrorCorrection.tsx:69), [:152](src/components/ErrorCorrection.tsx:152)
- [src/components/IELTSTest.tsx:1149](src/components/IELTSTest.tsx:1149), [:1199](src/components/IELTSTest.tsx:1199), [:1205](src/components/IELTSTest.tsx:1205), [:1253](src/components/IELTSTest.tsx:1253), [:1583](src/components/IELTSTest.tsx:1583)
- [src/components/LandingPage.tsx:66](src/components/LandingPage.tsx:66), [:85](src/components/LandingPage.tsx:85), [:164](src/components/LandingPage.tsx:164), [:204](src/components/LandingPage.tsx:204), [:244](src/components/LandingPage.tsx:244), [:271](src/components/LandingPage.tsx:271)
- [src/components/LevelPage.tsx:44](src/components/LevelPage.tsx:44), [:56](src/components/LevelPage.tsx:56), [:116](src/components/LevelPage.tsx:116), [:129](src/components/LevelPage.tsx:129), [:166](src/components/LevelPage.tsx:166), [:179](src/components/LevelPage.tsx:179), [:232](src/components/LevelPage.tsx:232)
- [src/components/LevelSelector.tsx:73](src/components/LevelSelector.tsx:73)
- [src/components/MistakeDiary.tsx:42](src/components/MistakeDiary.tsx:42), [:115](src/components/MistakeDiary.tsx:115), [:140](src/components/MistakeDiary.tsx:140), [:184](src/components/MistakeDiary.tsx:184)
- [src/components/NavBar.tsx:47](src/components/NavBar.tsx:47)
- [src/components/QuizMode.tsx:475](src/components/QuizMode.tsx:475)
- [src/components/StreakPopup.tsx:93](src/components/StreakPopup.tsx:93)
- [src/components/CertificateModal.tsx:567](src/components/CertificateModal.tsx:567), [:573](src/components/CertificateModal.tsx:573)

### §3b. Raw inline fontFamily — bypasses next/font entirely

Exclusively in [src/components/CertificateModal.tsx](src/components/CertificateModal.tsx):

| Family string | Lines |
|---|---|
| `"Playfair Display", Georgia, serif` | [:156](src/components/CertificateModal.tsx:156), [:206](src/components/CertificateModal.tsx:206), [:372](src/components/CertificateModal.tsx:372), [:405](src/components/CertificateModal.tsx:405), [:434](src/components/CertificateModal.tsx:434), [:479](src/components/CertificateModal.tsx:479), [:516](src/components/CertificateModal.tsx:516) |
| `"EB Garamond", Georgia, "Times New Roman", serif` | [:302](src/components/CertificateModal.tsx:302) |
| `"EB Garamond", Georgia, serif` | [:387](src/components/CertificateModal.tsx:387), [:418](src/components/CertificateModal.tsx:418), [:458](src/components/CertificateModal.tsx:458), [:502](src/components/CertificateModal.tsx:502), [:539](src/components/CertificateModal.tsx:539) |

**Total: 13 Playfair refs + 6 EB Garamond refs = 19 hard-coded fontFamily strings in one file.**

### §3c. `font-sans` utility

Tailwind's default; resolves to body stack at [src/app/globals.css:39](src/app/globals.css:39): `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif`. Used ~25 times in [src/app/profile/page.tsx](src/app/profile/page.tsx) and 7 times in [src/components/IELTSTest.tsx](src/components/IELTSTest.tsx).

### §3d. Tailwind-class font references that never trigger

- `font-serif` and `font-display` are declared in `theme.extend.fontFamily` ([tailwind.config.ts:24-25](tailwind.config.ts:24)) but never appear as classNames anywhere in `src/`.

### §3e. Body font (system stack)

[src/app/globals.css:39](src/app/globals.css:39). No declared token. DESIGN.md frontmatter still lists Inter (see §6.2).

### §3f. Font-feature-settings

- Body: `'ss01', 'cv11', 'calt'` at [src/app/globals.css:41](src/app/globals.css:41) — **these are Inter-specific features**; with Inter removed, they silently no-op on the system stack (no breakage, but misleading).
- `.font-serif-display`: `'liga', 'dlig'` at [src/app/globals.css:61](src/app/globals.css:61) — valid for Playfair.

---

## §4. Spacing / Radius / Shadow Literals

### §4a. Arbitrary Tailwind size/tracking values (occurrence counts across `src/`)

| Class | Count (approx.) | Intent |
|-------|-----------------|--------|
| `text-[10px]` | 22+ | Tiny eyebrow label |
| `text-[11px]` | 35+ | Eyebrow label / metadata |
| `text-[12px]` | 3 | Mid-metadata |
| `text-[13px]` | 14+ | Body small |
| `text-[14px]` | 2 | ErrorCorrection strike-through |
| `text-[15px]` | 4 | Body medium |
| `text-[16px]` | 2 | Input zoom-prevention |
| `text-[9px]` | 1 | [src/components/ielts/IELTSListening.tsx:189](src/components/ielts/IELTSListening.tsx:189) |
| `tracking-[0.15em]` | 6 | |
| `tracking-[0.18em]` | 30+ | Eyebrow & CTA letter-spacing |
| `tracking-[0.2em]` | 5 | |
| `tracking-[0.22em]` | 15+ | Dominant eyebrow tracking |
| `tracking-[0.24em]` | 1 | [src/components/IELTSTest.tsx:1600](src/components/IELTSTest.tsx:1600) |
| `tracking-[0.28em]` | 2 | [src/components/IELTSTest.tsx:1577](src/components/IELTSTest.tsx:1577), [src/components/StreakPopup.tsx:86](src/components/StreakPopup.tsx:86) |
| `tracking-[0.3em]` | 1 | [src/components/QuizMode.tsx:472](src/components/QuizMode.tsx:472) |
| `leading-[0.95]` | 1 | [src/components/LandingPage.tsx:62](src/components/LandingPage.tsx:62) |
| `min-h-[36px]` | 1 | Nav pill |
| `min-h-[44px]` | 10+ | Secondary buttons |
| `min-h-[48px]` | 20+ | Primary CTA |
| `min-h-14` | 3 | Dropdown items |
| `max-w-[60%]` | 2 | Writing prompt caption |
| `max-w-[75%] / [85%]` | 1 | ChatBubble |
| `max-w-[120px] / [200px] / [240px] / [280px] / [880px]` | 5 distinct | |
| `max-h-[120px]` | 2 | Textarea |
| `w-[240px]` | 1 | NavBar dropdown |
| `min-w-[280px]` | 1 | IELTS writing table |
| `min-h-[88vh]` | 1 | Landing hero |
| `h-[3px]` / `gap-[3px]` | 2 | Progress pip |
| `py-3.5` | 10+ | Primary CTA padding |
| `py-2.5` | 10+ | Secondary button padding |
| `px-3.5` | 1 | Nav pill |

### §4b. Font-size clamp

- `fontSize: 'clamp(72px, 18vw, 112px)'` — [src/components/QuizMode.tsx:475](src/components/QuizMode.tsx:475) (1 site, no token).

### §4c. Border-radius literals

All via Tailwind utilities: `rounded`, `rounded-lg`, `rounded-xl` (ubiquitous), `rounded-2xl` (~20 sites), `rounded-full`. No arbitrary `rounded-[Npx]`.
Raw CSS: `border-radius: 16px` at [src/app/globals.css:142](src/app/globals.css:142) (`.card-gold-border`), `border-radius: 3px` at [src/app/globals.css:81](src/app/globals.css:81) (scrollbar thumb), `border-radius: 4px` at [src/app/globals.css:233](src/app/globals.css:233) (`.prose code`), `border-radius: 4px` at [src/app/globals.css:268](src/app/globals.css:268) (focus-visible). The inline-SVG `borderRadius: 2` at [src/components/ielts/IELTSListening.tsx:13](src/components/ielts/IELTSListening.tsx:13) is a wave-bar.

### §4d. Custom shadow literals (non-utility)

- `box-shadow: 0 0 12px #F59E0B66` — [src/components/ielts/IELTSListening.tsx:95](src/components/ielts/IELTSListening.tsx:95)
- `boxShadow: '0 8px 24px rgba(239,68,68,0.4)'` — [src/components/IELTSTest.tsx:1426](src/components/IELTSTest.tsx:1426)
- `shadow-editorial` (named) at [src/components/NavBar.tsx:153](src/components/NavBar.tsx:153); `shadow-gold-sm` (named) at [src/components/QuizMode.tsx:330](src/components/QuizMode.tsx:330), [:400](src/components/QuizMode.tsx:400), [:454](src/components/QuizMode.tsx:454), [:553](src/components/QuizMode.tsx:553) — these are correct token-based use.

### §4e. Gradient-angle literals

Exclusively `135deg` (30+ sites) and `90deg` (6 sites) and `180deg` (1 site, [src/components/StreakPopup.tsx:28](src/components/StreakPopup.tsx:28)). No other angles.

---

## §5. Near-Duplicate Detection

### §5a. Navy/ink cluster — 8 distinct values in a ~ΔE 6 band

| # | Hex | Role observed |
|---|------|---|
| 1 | `#050D1A` | Speaking fullscreen bg |
| 2 | `#070C18` | `--navy-deep` (token) |
| 3 | `#0B1222` | `--navy` (token) |
| 4 | `#0F1729` | "Off-card" secondary bg |
| 5 | `#0F172A` | Passage surface / text-on-gold |
| 6 | `#141C30` | `--navy-surface` (token) |
| 7 | `#162032` | Writing row-alt |
| 8 | `#1E293B` | Tutor bubble / card-gold-border base / code bg |
| 9 | `#1F2940` | `--navy-surface-2` (token) |
| 10 | `#0F1E3D` (CertModal) | CertModal local NAVY |

ΔE76 pairwise estimates (sRGB → Lab, approximate, within ≤3 = perceptual near-duplicate):

| Pair | ΔE~ | Note |
|------|-----|------|
| `#050D1A` ↔ `#070C18` | ~1.0 | Visually same |
| `#070C18` ↔ `#0B1222` | ~2.3 | Near-duplicate |
| `#0B1222` ↔ `#0F1729` | ~2.6 | Near-duplicate |
| `#0F1729` ↔ `#0F172A` | ~0.3 | Visually same |
| `#0F172A` ↔ `#141C30` | ~2.8 | Near-duplicate |
| `#141C30` ↔ `#162032` | ~1.1 | Visually same |
| `#162032` ↔ `#1F2940` | ~3.3 | Borderline |
| `#1E293B` ↔ `#1F2940` | ~0.9 | Visually same |

**Conclusion:** at least four of the non-token hexes (`#050D1A`, `#0F1729`, `#0F172A`, `#1E293B`) collide with a defined token within ΔE ≤ 3.

### §5b. Muted text cluster (ΔE < 3)

- `#CBD5E1` (token `--text-secondary`) ↔ `#94A3B8` (undeclared, 14 sites) — ΔE ≈ 7 (*not* a near-duplicate; genuinely missing middle token).
- `#94A3B8` ↔ `#64748B` (token `--text-muted`) — ΔE ≈ 6 (genuinely missing middle token).

### §5c. Gold alpha ladder (see §2n)

15 distinct intensities of the same base hue (`#F59E0B` / `rgba(245,158,11,·)`). The semantic split is unclear: `0.20`/`0.33` are both used as borders, `0.35` vs `0.25` as outer glows, `0.40` as both border-gradient and box-shadow. **NEEDS DECISION:** collapse to a 3–4 step ladder vs. keep multi-step.

### §5d. Spacing/tracking drift

- `tracking-[0.18em]` vs `tracking-[0.2em]` — ΔLetter-spacing 0.02em = 0.32px @ 16px. These cluster as near-duplicates across `.text-[10px]`/`.text-[11px]` eyebrow labels. The 0.22em vs 0.24em cluster is similar.
- `min-h-[44px]` vs `min-h-[48px]` → used for "secondary" vs "primary CTA" but intermixed on same components (e.g. [src/components/ielts/IELTSReading.tsx:102](src/components/ielts/IELTSReading.tsx:102) vs [:177](src/components/ielts/IELTSReading.tsx:177)).

### §5e. Radius drift

`4px` (focus-visible, prose code) and `3px` (scrollbar) both used as "very small" radius — difference below perceptual threshold. `16px` (`.card-gold-border`) and `rounded-2xl` (`1rem` = 16px) are duplicates.

### §5f. Gold base `#C9A55C` (CertModal) vs `#F59E0B` (system)

ΔE ≈ 22 — **not** a near-duplicate. They are intentionally different hues but the roles overlap (both "gold brand color"). See §6 divergence.

---

## §6. Divergence from DESIGN.md

### §6.1. Token-name divergence (naming layer)

DESIGN.md ([DESIGN.md:16-24](DESIGN.md:16)) canonicalizes editorial names (`midnight-ink`, `ink-shadow`, `ink-surface`, `ink-elevated`, `candlelight-gold`, `ember-glow`, `deep-brass`, `vellum-champagne`). The code uses generic SaaS names (`navy`, `navy-deep`, `navy-surface`, `navy-surface-2`, `gold`, `gold-light`, `gold-dark`, `champagne`). All hex values match, but the semantic vocabulary is not shared between spec and code. **NEEDS DECISION:** rename to DESIGN.md canonicals, or update DESIGN.md frontmatter to match code.

### §6.2. Body font still references Inter in spec

DESIGN.md frontmatter `typography.bodyFontFamily` — review verbatim required; the token file lists Inter-based OpenType features despite Inter being removed in PR #4. Body stack in code is the system sans ladder ([src/app/globals.css:39](src/app/globals.css:39)). `font-feature-settings: 'ss01', 'cv11', 'calt'` ([src/app/globals.css:41](src/app/globals.css:41)) targets Inter's stylistic sets — silently inactive on system fonts. **NEEDS DECISION:** update DESIGN.md to state "system-sans for body" and remove Inter OT features from globals.css.

### §6.3. Playfair `subsets`

DESIGN.md bilingual rules require Playfair-quality Latin and acceptable Cyrillic. Code loads `subsets: ['latin']` only ([src/app/layout.tsx:7](src/app/layout.tsx:7)). Mongolian Cyrillic text in display headings therefore falls through to `EB Garamond` → `Georgia` → system serif. (EB Garamond itself is not loaded — §3.e.)

### §6.4. Playfair `style`

Italic glyphs appear throughout display text (LandingPage italic "Core", [src/components/LandingPage.tsx:271](src/components/LandingPage.tsx:271); StreakPopup italic, [src/components/StreakPopup.tsx:93](src/components/StreakPopup.tsx:93); etc.). `next/font` config does not declare `style: ['normal', 'italic']` — so italic may synthesize rather than load the true italic face.

### §6.5. Live violation sites of DESIGN.md Known Violations

- **Known Violation #1 (3px gold side-stripe on ChatBubble):** still present at [src/components/ChatBubble.tsx:37](src/components/ChatBubble.tsx:37), [src/components/ChatInterface.tsx:216](src/components/ChatInterface.tsx:216), [src/components/FreeChatInterface.tsx:187](src/components/FreeChatInterface.tsx:187).
- **Known Violation #2 (gradient-clipped text):** sites still present — [src/components/LandingPage.tsx:68](src/components/LandingPage.tsx:68) (hero wordmark), [src/components/LevelPage.tsx:46](src/components/LevelPage.tsx:46), [src/components/LevelSelector.tsx:75](src/components/LevelSelector.tsx:75), [src/components/MistakeDiary.tsx:44](src/components/MistakeDiary.tsx:44), [src/components/IELTSTest.tsx:1151](src/components/IELTSTest.tsx:1151), [:1586](src/components/IELTSTest.tsx:1586), [src/components/QuizMode.tsx:477](src/components/QuizMode.tsx:477), [src/app/profile/page.tsx:109](src/app/profile/page.tsx:109). These 8 sites all apply `background: linear-gradient(... gold ...)` + `-webkit-background-clip: text` — the pattern the violation note targets.
- **Known Violation #3 (Inter as body font):** resolved by PR #4. DESIGN.md note should be updated.
- **Known Violation #4 (Playfair `@import`):** resolved by PR #4.

### §6.6. CertificateModal palette divergence

CertModal locals (`GOLD = #C9A55C`, `NAVY = #0F1E3D`, etc.) are *not* in DESIGN.md's palette. This is either (a) an intentional certificate-specific palette (paper-luxe warm-gold on royal-navy) or (b) legacy drift. DESIGN.md §5 Components does not define a "certificate" sub-palette. **NEEDS DECISION.**

### §6.7. `--text-muted` + undeclared `#94A3B8`

DESIGN.md exposes `text-primary`, `text-secondary`, `text-muted`. Code introduces a fourth level `#94A3B8` (14 sites, §2h) with no token. This is a genuine functional gap between spec and code.

---

## §7. Proposed Token Names + Migration Table

> **Convention:** All proposed names use DESIGN.md editorial vocabulary. Items marked `NEEDS DECISION` resist confident mapping — human review required.

### §7a. Ink / surface ramp

| Literal | Proposed token | Rationale | Notes |
|---|---|---|---|
| `#070C18` | `ink-shadow` (= existing `navy-deep`) | Exact match | Rename only |
| `#0B1222` | `midnight-ink` (= existing `navy`) | Exact match | Rename only |
| `#141C30` | `ink-surface` (= existing `navy-surface`) | Exact match | Rename only |
| `#1F2940` | `ink-elevated` (= existing `navy-surface-2`) | Exact match | Rename only |
| `#050D1A` | `ink-abyss` (new, below `ink-shadow`) | Speaking fullscreen darker-than-navy-deep | **NEEDS DECISION:** merge into `ink-shadow` or introduce new step? |
| `#0F1729` | **NEEDS DECISION** — fold into `ink-surface` (ΔE ≈ 2.6) *or* introduce `ink-sunken`? | Used as "beneath card" subtle contrast | |
| `#0F172A` | **NEEDS DECISION** — fold into `ink-surface` (ΔE ≈ 2.8) *or* introduce `ink-passage`? | Text-on-gold *and* passage surface — two different intents confusingly sharing one hex | |
| `#162032` | Fold into `ink-surface` (ΔE ≈ 1.1) | Alternating-row should be `ink-surface` with `/80` alpha, not a separate hex | |
| `#1E293B` | **NEEDS DECISION** — new `ink-card` / merge into `ink-elevated` (ΔE ≈ 0.9) | Used for tutor bubble, code background, card-gold-border base | |
| `#0F1E3D` | CertModal-local: **NEEDS DECISION** — keep scoped or promote to global `certificate-navy`? | |

### §7b. Gold / ember ramp

| Literal | Proposed token | Rationale |
|---|---|---|
| `#F59E0B` | `candlelight-gold` (= existing `gold`) | Exact match |
| `#FCD34D` | `ember-glow` (= existing `gold-light`) | Exact match |
| `#D97706` | `deep-brass` (= existing `gold-dark`) | Exact match |
| `#E4C08A` | `vellum-champagne` (= existing `champagne`) | Exact match |
| `#C9A55C` (CertModal) | **NEEDS DECISION** — `certificate-gold` (scoped) or remove? | Certificate luxury-gold hue (distinct from candlelight) |
| `#8B6F2E` (CertModal) | **NEEDS DECISION** — `certificate-gold-deep` | |
| `#E8D29A` (CertModal) | **NEEDS DECISION** — `certificate-gold-light` | |
| `#F5E7C2` (CertModal) | **NEEDS DECISION** — `certificate-gold-pale` | |
| `#FFF4D6` (SVG) | Fold into certificate-gold-pale | |
| `#FDFCF5` (CertModal IVORY) | **NEEDS DECISION** — `certificate-ivory` | |

### §7c. Gold alpha ladder → tokenization

**NEEDS DECISION:** settle on 3–4 named alphas. Proposal:

| Alpha | Proposed token | Current sites |
|-------|---------------|----------------|
| 0.08 | `gold-wash` | globals body hero |
| 0.15 | `gold-soft` | `.prose code` bg |
| 0.18 | `hairline-gold` (existing) | — |
| 0.20 | Fold into `hairline-gold` (ΔE imperceptible) | IELTSListening/IELTSTest badge border |
| 0.25 / 0.35 | `gold-shadow-sm` / `gold-shadow-strong` | `.shadow-gold*` — already absorbed in named utilities |
| 0.33 | **NEEDS DECISION** — fold into `gold-shadow-sm` or keep as `gold-border-strong`? | |
| 0.40 | `gold-glow` (new) | `#F59E0B66` outer glow |

### §7d. Text ladder

| Literal | Proposed token |
|---|---|
| `#F8FAFC` | `text-primary` (= existing) |
| `#CBD5E1` | `text-secondary` (= existing) |
| `#94A3B8` | **NEEDS DECISION** — new `text-quiet` *or* tighten spec to force use of `text-secondary`/`text-muted`? | 14-site consistent usage suggests real intent; treat as missing token |
| `#64748B` | `text-muted` (= existing) |
| `#475569` | **NEEDS DECISION** — fold into `text-muted` (ΔE ≈ 4) or new `text-disabled`? | 1 site only ([src/components/ielts/IELTSListening.tsx:94](src/components/ielts/IELTSListening.tsx:94)) |

### §7e. Validation

**NEEDS DECISION throughout — none of these are declared in DESIGN.md.**

| Role | Literal(s) | Proposed token |
|---|---|---|
| Success base | `#34D399` | `success` |
| Success alpha | `#34D39988` | `success/53` (alpha utility) |
| Success bright | `#10B981` | `success-strong` |
| Success deep | `#059669` | `success-deep` |
| Danger base | `#F87171` | `danger` |
| Danger alt | `#FCA5A5` | `danger-soft` |
| Danger bright | `#EF4444` | `danger-strong` |
| Danger scrim | `rgba(239,68,68,{0.2,0.4,0.9})` | `danger/{20,40,90}` |
| Danger-text | `#FFF5F5` | `danger-text` |
| Rose (quiz fail progress) | `#E11D48`, `#F43F5E` | **NEEDS DECISION** — merge into `danger-*` or keep rose? |

### §7f. Orb states

| Role | Literal | Proposed token |
|---|---|---|
| Orb idle | `#1E40AF` | `orb-idle` |
| Orb listening | `#38BDF8` | `orb-listen` |
| Orb thinking | `#8B5CF6` | `orb-think` |
| Orb panel scrim cyan | `#38BDF808`, `#38BDF822` | `orb-listen/3`, `orb-listen/13` |

### §7g. Slate/border

| Literal | Proposed token |
|---|---|
| `#334155` | **NEEDS DECISION** — new `border-slate` (structural border) vs fold into `hairline` | `hairline` is 0.06α-white and visually very different; `#334155` is a solid slate used for progress tracks and option borders |

### §7h. Spacing / tracking / sizing

| Literals | Proposed scale |
|---|---|
| `tracking-[0.15em/0.18em/0.2em/0.22em/0.24em/0.28em/0.3em]` | **NEEDS DECISION** — collapse to `tracking-label` (0.18), `tracking-eyebrow` (0.22), `tracking-caps` (0.28) |
| `text-[9px..16px]` custom sizes | **NEEDS DECISION** — define typography scale in DESIGN.md and Tailwind `fontSize` extend |
| `min-h-[36/44/48]px` | **NEEDS DECISION** — `touch-pill` (36), `touch-secondary` (44), `touch-primary` (48) |

### §7i. Shadows

| Literal | Token |
|---|---|
| `.shadow-gold` | Keep (= `shadow-gold-strong`) |
| `.shadow-gold-sm` | Keep |
| `.shadow-editorial` | Keep |
| `0 0 12px #F59E0B66` | Fold into `shadow-gold-sm` — **NEEDS DECISION** |
| `0 8px 24px rgba(239,68,68,0.4)` | `shadow-danger` (new) — **NEEDS DECISION** |

### §7j. Font tokens

| Literal | Proposed token |
|---|---|
| `'"Playfair Display", Georgia, serif'` (CertModal ×13) | Replace with `var(--serif)` or remove inline + use `.font-serif-display` |
| `'"EB Garamond", Georgia, serif'` (CertModal ×6) | **NEEDS DECISION** — either load EB Garamond via `next/font` and keep, or collapse all to Playfair body variant |
| `'"EB Garamond", Georgia, "Times New Roman", serif'` (×1) | Merge with previous |

---

## §8. Gaps (not currently covered by any token)

1. **Muted text band `#94A3B8`** — 14 sites, no token. [See §2h, §7d.]
2. **Structural borders `#334155`** — 10+ sites, no token. Distinct from `--hairline` (which is a 0.06α white overlay). [See §2g, §7g.]
3. **Overlay / scrim alphas** — red scrims (`rgba(239,68,68,{0.2,0.4,0.9})`), cyan scrims (`#38BDF8{08,22}`), gold glows (`#F59E0B{33,55,66}`). None tokenized.
4. **Focus-ring** — hard-coded `#F59E0B` at [src/app/globals.css:257](src/app/globals.css:257), [:266](src/app/globals.css:266). Should resolve via `var(--gold)` or a `--focus-ring` token.
5. **Validation states (success / danger / rose)** — entirely undeclared. [See §7e.]
6. **Orb-state colors (idle / listening / thinking)** — entirely undeclared. [See §7f.]
7. **Near-navy ink drift** — `#050D1A`, `#0F1729`, `#0F172A`, `#162032`, `#1E293B` are consumed as surface variants but none exist in `--navy-*` ramp. [See §5a, §7a.]
8. **EB Garamond is referenced as fallback in `--serif` ([src/app/globals.css:19](src/app/globals.css:19)) and inline in CertModal (×6) but is never loaded via `next/font` or `@import`.** Typography gap.
9. **Tailwind `theme.extend.fontFamily.serif` and `.display` are declared but `font-serif`/`font-display` classNames are never used in `src/`.** Dead config.
10. **Body font-feature-settings target Inter (`ss01 cv11 calt`) on a system-sans stack — features silently no-op.** [src/app/globals.css:41](src/app/globals.css:41).
11. **Font-display:swap is set for Playfair but italic is not explicitly requested and `subsets` does not include `cyrillic`.** [src/app/layout.tsx:5-10](src/app/layout.tsx:5).
12. **CertificateModal luxury palette** is disjoint from system tokens and undocumented in DESIGN.md.
13. **Spacing / radius scale** — arbitrary Tailwind values (`text-[10px..16px]`, `tracking-[0.15em..0.3em]`, `min-h-[36/44/48]px`) with no declared semantic scale. [See §7h.]
14. **Champagne `#E4C08A` alpha ladder** only has one observed alpha (0.2) but no tokenization path.
15. **Card-gold-border** inlines literal `#1E293B` and literal `#F59E0B`/`#FCD34D` at [src/app/globals.css:139-140](src/app/globals.css:139) — utility bypasses the token layer it exists to enforce.
16. **`prose strong { color: #F59E0B }`** and **`.streaming-cursor::after { color: #F59E0B }`** at [src/app/globals.css:228](src/app/globals.css:228), [:242](src/app/globals.css:242) duplicate `var(--gold)`.

---

## §9. `lang` Attribute Audit (vs DESIGN.md §3 Bilingual Typography Rules)

### §9a. All `lang` attribute occurrences in `src/`

| File:line | Attribute | Value |
|---|---|---|
| [src/app/layout.tsx:26](src/app/layout.tsx:26) | `<html lang="mn">` | `mn` (Mongolian Cyrillic) |

**Total: 1 occurrence.** No `:lang()` CSS selectors exist in [src/app/globals.css](src/app/globals.css).

### §9b. DESIGN.md §3 bilingual rules — enforceability

DESIGN.md §3 (Typography) declares bilingual-parity rules targeting `:lang(mn)` vs `:lang(en)` scoping (weight parity, size-adjust, letter-spacing, caps behavior). These rules require *per-element* `lang` attributes to trigger correctly when Mongolian and English text coexist inside the same tree.

**Audit result:**

| Rule (per DESIGN.md §3) | Enforceable today? | Why |
|---|---|---|
| §3.1 Display-font stack parity | Partial | Playfair Cyrillic not loaded (§6.3); Latin is correct. |
| §3.2 Body-font size parity | No | Body uses system stack — no per-lang override possible. |
| §3.3 Line-height parity | No | No `:lang()` CSS exists. |
| §3.4 Letter-spacing lock for Cyrillic caps | **No — critical gap** | All `tracking-[0.NNem]` utilities apply globally regardless of script. Mongolian caps therefore get the same Latin-calibrated tracking. |
| §3.5 Weight-parity (Cyrillic often reads heavier at same weight) | **No** | No lang-scoped weight adjustments. |
| §3.6 `size-adjust` for fallback fonts | **No** | `next/font` config does not set `adjustFontFallback`; globals.css has no `@font-face size-adjust`. |
| §3.7 English-within-Mongolian inline tokens | **No** | No component wraps English fragments with `lang="en"`. Searching `lang=` in `src/` returns only the `<html>` root. |
| §3.8 Numerals (tabular + parity) | Partial | `.nums-tabular` utility exists at [src/app/globals.css:66-68](src/app/globals.css:66), used ~20 sites, but not language-scoped. |

**Key finding:** bilingual typography rules §3.4–§3.7 are *not enforceable* because the DOM contains no language-scoped elements below `<html lang="mn">`. Any future refactor that aims to satisfy DESIGN.md §3 needs to:

1. Introduce per-element `lang="en"` wrappers around English display text (e.g. "Core English" wordmark at [src/components/LandingPage.tsx:271](src/components/LandingPage.tsx:271); "IELTS Mock Test" at [src/app/profile/page.tsx:295](src/app/profile/page.tsx:295); all `uppercase` eyebrow labels in Mongolian vs English copy).
2. Add `:lang(en)` / `:lang(mn)` CSS scoping in globals.css — currently zero such rules.
3. Load Playfair `subsets: ['latin', 'cyrillic']` (and an explicit `style: ['normal', 'italic']`) in [src/app/layout.tsx:5-10](src/app/layout.tsx:5).
4. Either load EB Garamond via `next/font` or drop it from the `--serif` fallback stack.

---

*End of audit. This report is inventory-only. No migration plan, no code changes, no token renames. NEEDS DECISION items require product-design human review before any refactor.*
