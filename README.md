# Resume Roast

Paste your resume (or drop in a PDF) and it roasts your weakest bullets one card at a time, then flips each card to a better version. Dark theme, a boss-fight health bar, and a roast that streams in live. I built it to show off frontend, animation and AI work in one place, and because resumes are funny when you read enough of them.

Next.js, TypeScript, Tailwind, Motion, Groq. No paid services anywhere.

## How it works

It's two layers on purpose.

**1. A dumb scanner runs in your browser.** It splits the text into bullets and flags the usual problems: "responsible for" and "helped with" type phrases, no number anywhere, passive voice, the same opening verb again and again, and bullets that run too long. Each flag has a weight, and the 8 worst bullets become cards. This part is instant, works offline and can't fail, so the app always has something to show.

**2. Groq does the funny part.** For each card the app makes one call that returns the roast and the rewrite together. I stream the roast into the card as it arrives, then flip to the rewrite. Calls happen one card at a time, only when you reach that card, so quitting halfway doesn't burn the quota.

A few decisions worth knowing about:

- **Not JSON.** The model replies in a plain text format with two markers (`===REWRITE===` and `===TAGS===`). JSON can't be shown until it's complete, and I wanted the typewriter effect. When the stream ends I validate it with zod. If it's bad, the card retries once, then falls back.
- **Fallback.** If Groq errors, rate limits or the key is missing, the game keeps going. Remaining cards get built-in roasts, and the back of the card shows a tip ("add a number: how many?") instead of an AI rewrite. A small label says AI is unavailable. It never shows a fake rewrite.
- **Rewrites stay honest.** The prompt says never invent facts or numbers. If a number would help, it writes a placeholder like `[X%]` for you to fill in.
- **The roast hits the writing, not you.** No jokes about your name, school, age or anything personal. At High it can say "damn" and "hell". No f-bombs.
- **Resume text is untrusted.** It goes into the prompt inside tags with a note to ignore any instructions in it, and the endpoint caps bullet length and the number of flags.
- **Rate limiting.** The `/api/roast` route limits requests per IP and has a daily cap. With a free Upstash Redis it uses that. Without one it falls back to in-memory counters, which are weak on serverless since each instance has its own memory.
- **Intensity.** Mild, Medium or High. High is the default. If you're showing this to a hiring manager, maybe pick Medium.

## Privacy

Your resume text is sent to Groq to generate the roast. The app doesn't store it or log it. Nothing is saved between visits.

## Run it

```bash
npm install
cp .env.example .env.local   # then add your GROQ_API_KEY
npm run dev
```

Get a free key at [console.groq.com](https://console.groq.com). The default model is `llama-3.3-70b-versatile`. Groq's free-tier model list changes, so if it errors, set `GROQ_MODEL` to one that's currently available.

Upstash is optional: set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` to get proper rate limiting.

```bash
npm test
npm run lint
npm run build
```

## What's where

- `src/lib/segment.ts`, `scanner.ts`: bullet splitting and the rules
- `src/lib/prompt.ts`, `streamFormat.ts`: the prompt and the stream format
- `src/app/api/roast/route.ts`: the Groq proxy
- `src/lib/game.ts`, `src/hooks/useRoastGame.ts`: the game state machine and the fallback logic
- `src/components/`: the cards, boss bar, upload and result screens

## Limits

- Free-tier models are a bit weaker than paid ones, and the free quota is small. A busy public demo can run out, which is what the fallback is for.
- PDF text extraction is best effort. Scanned PDFs have no text, so the app asks you to paste instead. Multi-column layouts can come out jumbled.
- English only, and it's built desktop-first.
- One thing that bit me: Next 16 with cache components on rejects the old `runtime` export in route handlers. Unit tests didn't catch it. I only saw it when I ran the app in a browser.

## License

MIT
