# Cheneval Advisory — Landing Page Build Brief (for Claude Code)

A single-page, super-simple marketing site. No build step, no framework, no backend.
Goal: look premium, explain what Cheneval does in 5 seconds, and drive one action — **book a call**.

---

## 1. Stack & constraints
- **One file:** `index.html` with a `<style>` block (vanilla CSS, no Tailwind/React/build tools).
- Fonts via Google Fonts `<link>`: **Cormorant Garamond** (headings) + **Lato** (body).
- Fully responsive, mobile-first. No JavaScript except a tiny smooth-scroll + mobile nav toggle.
- Deployable as-is to Netlify / Vercel / GitHub Pages (just drop the file).
- Accessible: semantic HTML, alt text, colour contrast AA, focus styles, `prefers-reduced-motion` respected.

## 2. Brand tokens (use exactly)
```css
:root{
  --navy:   #0E2240;  /* primary bg / headings */
  --gold:   #C5A572;  /* accent, rules, CTA */
  --char:   #1A1A1A;  /* body text */
  --off:    #F5F2EC;  /* light section bg */
  --slate:  #5A6473;  /* muted text */
  --white:  #FFFFFF;
}
```
- Headings: `'Cormorant Garamond', serif` (weight 600), generous letter-spacing on the wordmark.
- Body / labels / buttons: `'Lato', sans-serif`. Sub-labels = uppercase, letter-spacing ~3px.
- Logo lockup in HTML/CSS (no image needed): `CHENEVAL` in Cormorant + a short gold rule + `ADVISORY` in spaced Lato caps.

## 3. Page structure (top to bottom)

**Sticky header** — transparent over hero, navy once scrolled. Left: text logo lockup. Right: anchor links (Approach · Services · Contact) + a small gold "Book a call" button. Collapses to a hamburger on mobile.

**Hero** (navy background, full viewport-ish, centered)
- Eyebrow (gold, spaced caps): `AI & TECHNOLOGY ADVISORY`
- H1: **Clarity at the pace of change.**
- Subhead (off-white/slate): `Cheneval Advisory helps leaders adopt AI with confidence — turning emerging technology into practical, measurable advantage.`
- Primary button (gold, navy text): `Book a call`
- Secondary text link (off-white, underlined gold on hover): `See how we work →`
- Thin gold rule motif echoing the logo.

**Approach** (off-white background) — short intro line + 3 columns:
1. **Assess** — `We map where AI creates real value in your business — and where it doesn't.`
2. **Adopt** — `Practical pilots and rollouts that fit your teams, tools and risk appetite.`
3. **Embed** — `Governance, training and systems so the capability sticks after we leave.`
- Each column: small gold number/icon, Cormorant subhead, Lato body.

**Services** (white background) — heading `What we help with`, then a clean list/grid of 4–6 items, each one line:
- AI strategy & roadmap
- Use-case discovery & prioritisation
- Pilot design & delivery
- AI governance & risk
- Team enablement & training
- Automation & workflow design

**Credibility / quote band** (navy background) — one strong line, centered, Cormorant:
> `"Most organisations don't have an AI problem. They have a clarity problem."`
- Small attribution line in gold/slate (optional).

**Contact / CTA** (off-white) — heading `Let's talk`, one line: `Tell us where you're stuck. We'll tell you what's worth doing.`
- Primary action = email link button `hello@chenevaladvisory.com` (mailto) **or** a Calendly/booking link (leave a clearly-marked placeholder `BOOKING_LINK`).
- Keep it link-based — no form/backend for v1.

**Footer** (navy) — logo lockup, `chenevaladvisory.com`, email, `© 2026 Cheneval Advisory`, subtle gold top rule.

## 4. Visual / interaction notes
- Lots of whitespace; max content width ~1080px, centered.
- Alternate section backgrounds: navy → off-white → white → navy → off-white → navy.
- Buttons: gold fill, navy text, subtle hover (slight darken + 1px lift). Rounded 2–4px max (keep it sharp/premium, not bubbly).
- Use the gold short-rule motif as a recurring divider above section headings.
- Smooth-scroll for anchor links. Fade-up on scroll is optional and must respect `prefers-reduced-motion`.

## 5. Placeholders to fill in
- `BOOKING_LINK` (Calendly or similar) — or keep mailto only.
- `hello@chenevaladvisory.com` — replace with the real address.
- Confirm/adjust the six services and the three Approach steps to match the real offer.
- Add real testimonial/attribution if available; otherwise keep the quote unattributed.

## 6. Deliverable
- `index.html` (self-contained). 
- A 3-line `README.md`: how to preview locally (`open index.html`) and how to deploy (drag the file into Netlify, or push to GitHub Pages).

---

## 7. Paste this prompt into Claude Code
> Build a single self-contained `index.html` premium landing page for "Cheneval Advisory", an AI & technology advisory firm. Use vanilla HTML + CSS in one file, no frameworks or build step. Load Google Fonts Cormorant Garamond (headings) and Lato (body). Use these colours: navy #0E2240, gold #C5A572, charcoal #1A1A1A, off-white #F5F2EC, slate #5A6473. Build a text-based logo lockup (CHENEVAL in Cormorant + short gold rule + ADVISORY in spaced Lato caps). Sections, in order: sticky header with nav + "Book a call" button; navy hero with eyebrow "AI & TECHNOLOGY ADVISORY", H1 "Clarity at the pace of change.", subhead, gold CTA; an "Approach" section with 3 columns (Assess / Adopt / Embed); a "Services" grid of 6 items; a navy quote band ("Most organisations don't have an AI problem. They have a clarity problem."); a "Let's talk" contact section with a mailto button to hello@chenevaladvisory.com and a BOOKING_LINK placeholder; a navy footer. Mobile-first responsive, AA contrast, semantic HTML, focus styles, smooth-scroll, hamburger nav on mobile, and respect prefers-reduced-motion. Alternate section backgrounds navy/off-white/white. Keep buttons sharp and minimal. Also output a short README with preview + deploy steps. Use the exact copy from the brief I'm pasting below.

*(Paste sections 2–5 of this brief underneath that prompt so Claude Code has the tokens and copy.)*
