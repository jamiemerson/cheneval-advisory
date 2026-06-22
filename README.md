# Cheneval Advisory — Landing Page

A single, self-contained premium landing page for **Cheneval Advisory**, an AI &
technology advisory firm. Vanilla HTML + CSS in one file (`index.html`), with a
tiny inline script for the mobile menu. No frameworks, no build step.

## What's inside

- **One file:** `index.html` — markup, styles, and a small script all inline.
- **Fonts:** Google Fonts — Cormorant Garamond (headings) + Lato (body).
- **Palette:** navy `#0E2240`, gold `#C5A572`, charcoal `#1A1A1A`,
  off-white `#F5F2EC`, slate `#5A6473`.
- **Sections:** sticky header → navy hero → Approach (Assess / Adopt / Embed) →
  Services (6) → navy quote band → contact (form + `mailto:` fallback) → navy footer.
- **Accessibility:** semantic HTML, AA-contrast colours, visible focus styles,
  skip link, `aria-expanded` hamburger, and `prefers-reduced-motion` support.

## Preview locally

No tooling required — just open the file:

```bash
open index.html          # macOS
```

Or serve it (recommended, so anchor scrolling and fonts behave like production):

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Before you ship — fill in the placeholders

1. **`FORM_ENDPOINT`** — the contact form posts to this single placeholder in the
   form's `action`. The page is fully static (no backend), so point it at a hosted
   form service. The form fields (`name`, `email`, `organisation`, `message`) work
   as-is with any of these:
   ```bash
   # Formspree — create a form, then:
   sed -i '' 's|FORM_ENDPOINT|https://formspree.io/f/yourid|g' index.html
   ```
   Other drop-in options: Netlify Forms (add `netlify` to the `<form>` tag and
   drop the endpoint), Basin, Web3Forms, or Google Forms. No JS changes needed.
2. **Contact email** — the "Prefer email?" fallback is already wired to
   `hello@chenevaladvisory.com` via `mailto:`.
3. **Placeholder copy** — the brief supplied the exact eyebrow, H1, quote, section
   names and email; the **hero subhead, the three Approach blurbs, and the six
   Service descriptions are placeholder copy I wrote** to fill the gaps. Swap them
   for your final wording (search the section comments in `index.html`).

## Deploy

It's a static page — host it anywhere. Examples:

**Netlify (drag & drop)**
- Go to app.netlify.com → "Add new site" → "Deploy manually" → drop the folder.

**Netlify / Vercel (CLI)**
```bash
npx netlify-cli deploy --prod --dir .
# or
npx vercel --prod
```

**GitHub Pages**
```bash
git init && git add . && git commit -m "Cheneval Advisory landing page"
git branch -M main
git remote add origin <your-repo-url>
git push -u origin main
# In repo Settings → Pages → deploy from main / root.
```

**Cloudflare Pages / S3 / any static host** — upload `index.html`. Done.

## Customising

- Colours and spacing live in the `:root` CSS variables at the top of the `<style>` block.
- Section backgrounds alternate via the `.section--navy` / `.section--off` /
  `.section--white` classes — reorder or recolour by swapping those.
- Buttons are intentionally sharp (no border-radius); the `--ease` token controls
  transition feel.
