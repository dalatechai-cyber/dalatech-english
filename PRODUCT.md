# Product

## Register

product

## Users

Mongolian native speakers learning English, ranging from absolute beginners (A1) through advanced (C1), including IELTS candidates preparing for university admission, migration, or professional qualification. Primary usage context: self-directed study on personal devices (phone and laptop), often in short sessions between work or classes, in Mongolian-language mental mode. The job-to-be-done is "become fluent enough to pass a real-world English bar (IELTS band, university, job interview)" — not casual dabbling. They arrive skeptical of another app and wary of cartoon-style edtech; they want to feel they're studying with something serious.

Secondary audience: parents and professionals evaluating the product on the landing page before committing to the learning app.

## Product Purpose

Core English is an AI-powered English tutor for Mongolian speakers. It replaces the loop of "textbook → tutor → practice test" with a single streaming chat interface backed by Claude, delivering per-lesson feedback, grammar corrections in Mongolian, and IELTS-grade speaking and writing evaluation. Success looks like: a learner completes 50+ lessons across five CEFR levels, unlocks IELTS prep after C1, and walks into an actual IELTS test prepared — not as a gamer grinding streaks, but as a student who used a world-class tutor for months.

Progress is tracked client-side (localStorage) so the product works without accounts, which matters for the target audience's low willingness to sign up for yet another service.

## Brand Personality

**Three words:** editorial · premium · confident.

**Voice and tone:** quietly authoritative, like a Mongolian-language prestige magazine writing about language learning. Bilingual by default — Mongolian copy for UI, English for drilled content — never apologetic or translated-sounding. No exclamation points, no motivational-poster energy, no "let's go!" cheerleading. The product does not chase the user; the user chooses the product.

**Emotional goals:** the learner should feel *respected* (this app assumes intelligence), *calm* (no urgency manipulation), and *proud* (finishing a lesson feels like finishing a chapter of a serious book, not unlocking a cartoon badge).

**Reference feel:** Financial Times reading experience, Stripe docs restraint, Apple's learning app editorial treatment, Cambridge Press hardcover aesthetic — but delivered in dark mode with Mongolian typography.

## Anti-references

These are explicitly forbidden directions. Match-and-refuse:

- **Duolingo / cartoon gamification.** No mascots, no cartoon rewards, no childish illustration style, no combo-multiplier UI, no "heart lives" punishment mechanics. Streak tracking exists, but as a quiet editorial stat, not a character shouting at the user.
- **Generic SaaS dashboard template.** No blue-gradient hero with three identical metric cards. No "trusted by logos" strip. No icon-in-tinted-square + heading + supporting-text card grid repeated to fill the page.
- **Corporate test-prep (Kaplan / ETS / traditional textbook).** No beige institutional palette, no stock-photo students-with-laptops, no "Pearson-style" stiff hierarchy, no textbook-reprint feel.
- **AI-startup aesthetic.** No purple-to-pink gradients, no glassmorphism by default, no "Inter-everywhere Notion/Linear productivity" visual language. The product is AI-powered but does not visually advertise that fact.
- **Bootcamp urgency tactics.** No countdown timers, no "limited seats," no testimonial carousels, no aggressive "Start Now" pressure CTAs, no fake scarcity, no social-proof popups.
- **Crypto / neon maximalism.** No neon-on-black, no glitch effects, no meme energy, no 3D holographic renders.

## Design Principles

1. **Editorial over utilitarian.** Treat every screen as a page in a serious magazine. Use serif italics (Playfair Display) for emphasis, uppercase kickers with wide tracking for section intros, hairline dividers instead of boxed cards wherever possible. The UI should reward the user for looking at it, not just using it.

2. **Respect the learner's intelligence.** Never explain what a competent adult already knows. Copy is dense and assumes context; the tutorial tone belongs inside the chat, not in the chrome. Errors are shown with dignity (Mongolian-language grammar notes, yellow highlight, no shame).

3. **Calm over loud.** Motion is rare and purposeful — `page-enter-up` on content load, subtle orb-pulse on ambient glows, streak popups that fade rather than bounce. No bounce easing, no elastic, no attention-grabbing pulses. Reduced-motion must be honored.

4. **Mongolian-first bilingualism.** Mongolian is the interface language, English is the content being learned. The two must coexist typographically — Inter handles Mongolian Cyrillic cleanly for UI, Playfair carries the editorial English accents. Never treat Mongolian as a translation afterthought.

5. **Localstorage-honest.** Because all progress is local, the UI must be honest about state (clear "resumed from device X" cues where relevant) and must degrade gracefully when storage is cleared. No fake cloud-sync polish the product does not have.

## Accessibility & Inclusion

**Target:** WCAG 2.1 AA.

**Specific requirements:**
- Body text contrast ≥ 4.5:1 against dark navy ground; large text ≥ 3:1. Champagne (#E4C08A) and text-secondary (#CBD5E1) have been chosen for this.
- All interactive elements reachable by keyboard with visible focus rings (not the browser default — custom gold-tinted ring).
- `prefers-reduced-motion` respected for orb pulses, page enters, streak popups, and any transform-based transitions.
- Input font-size ≥ 16px already enforced in `globals.css` to prevent iOS auto-zoom.
- Mongolian Cyrillic rendered with Inter's `ss01 cv11 calt` features to preserve letter clarity at small sizes.
- Screen-reader labels on icon-only buttons; `aria-live` for streaming chat updates and grammar-correction highlights.
- Color is never the sole carrier of meaning (lesson lock state, quiz correctness, IELTS band delta all use icon + text + color together).

**Known user needs:** older learners with presbyopia (parents evaluating for their kids, working professionals 30+) — err on the side of slightly larger type, never dip below 14px for body.
