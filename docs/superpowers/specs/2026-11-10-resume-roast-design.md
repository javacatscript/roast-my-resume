# Resume Roast — Design

Date: 2026-11-10
Status: draft, awaiting owner approval (builder check done, answers folded in)

## Intent and why

A portfolio piece for the owner's resume, meant to be shown to recruiters. It must demonstrate three things at a glance: **frontend craft, animation skill, and real AI integration**. A recruiter should understand it in under 30 seconds and be able to try it from a live link.

The product: a user drops in their resume and gets it "roasted" as a game. Each weak bullet becomes a card, the roast streams in live, then the card flips to a rewrite. Relevant to recruiters (they read resumes all day), funny enough to be shared, and actually useful.

## Goals

- Dark-themed, game-like experience with strong, deliberate animation (spring-physics cards, live typewriter streaming, card flips, shake/flinch on brutal lines, boss-fight-style progress bar, "bullet N of M" level counter).
- Real AI integration: streamed roasts and rewrites from an LLM, with structured (JSON) output, validation, and graceful failure handling.
- **Zero paid services.** Hosting, AI and everything else must be free.
- Hybrid analysis: a deterministic, in-browser rule-based scanner finds weak bullets (instant, offline, always works); the LLM does the roast and rewrite.
- Live public demo link plus a public GitHub repo (see Publishing).
- A README that explains how everything works, in the owner's voice (see README).

## Non-goals

- Not a full resume builder or ATS optimizer. No accounts, no saved history, no database.
- No server-side storage of resumes. Resume text is sent to the LLM for processing and not stored by the app.
- No in-browser LLM / WebGPU "private mode" in v1 (possible later stretch).
- No multi-language resumes in v1; English only.

## Anti-goals (a failure even if it technically works)

- The roast targets a person (name, gender, age, ethnicity, school, background, appearance). It targets **only the writing**: buzzwords, vague claims, padding, passive voice, missing numbers.
- Rewrites that invent facts or metrics. If a number is missing, the rewrite uses a placeholder such as `[X%]` and asks the user to fill it in.
- A demo that looks broken when the free API quota runs out or the network fails.
- Animation that is janky, blocks interaction, or ignores `prefers-reduced-motion`.
- Reads as generic AI-template UI.

## The experience

1. **Input.** User uploads a PDF or pastes text. PDF text is extracted in the browser. A sample resume button lets a recruiter try it with no setup.
2. **Scan.** Screen goes dark and a scan line sweeps the resume while the rule-based scanner flags weak bullets (e.g. "responsible for", "helped with", no numbers, passive voice, repeated verbs, overlong bullets).
3. **Game.** Each flagged bullet becomes a card. Card enters; the roast streams in live; worst lines trigger a shake/flinch; the card then flips to the rewrite (also streamed). A boss-fight-style bar shows progress; counter reads "Bullet 3 of 14".
4. **Choices per card.** Keep the rewrite, keep the original (the app mocks the user for it), or edit inline.
5. **Finish.** Final screen shows before/after resume and a copy/download of the result.

## Roast voice

High-heat, sarcastic, funny, mildly humiliating — about the *writing*. Style inspired by Bill Burr (exasperated, ranting, incredulous) and Daniel Sloss (dry, deadpan, darker punchline). The prompt describes the *style*, never names or impersonates either comedian, and the model writes original lines.

A **roast intensity** control (Mild / Medium / High) exists; **High is the default**. The owner wants this at high heat; the toggle lets it be toned down in front of a hiring manager.

## Technical decisions

Decided by the owner:
- **LLM provider: Groq** (free tier).
- **Hybrid approach:** in-browser rule-based scanner + Groq for roast/rewrite.
- **Dark theme** throughout.
- Free only, no paid APIs.

Defaults chosen by me (the owner has not confirmed these; flag if unwanted):
- Next.js (App Router) + TypeScript + Tailwind CSS.
- Framer Motion (or `motion`) for animation; GSAP only if a specific effect needs it.
- A Next.js route handler as a thin proxy to Groq so the API key stays server-side, with streaming responses to the client.
- Per-IP rate limiting on the proxy so a public link cannot drain the free quota.
- Client-side PDF text extraction with `pdf.js`.
- Deploy on Vercel's free tier.
- Structured JSON output per bullet: `{ roast, rewrite, tags }`, validated (e.g. with zod) before display.
- Fallback: if Groq errors or the quota is exhausted, the app still runs the rule-based scanner, shows canned roast lines per rule, and tells the user plainly that AI mode is unavailable.

## Constraints

- Free tiers only; rate limits are real and the design must live within them.
- Resume text is personal data. Don't log it, don't store it, and say so in the README and UI.
- Must work well on desktop; should degrade acceptably on mobile.
- Accessibility basics: keyboard operable, sensible contrast on dark theme, `prefers-reduced-motion` honored.

## Publishing

- New standalone repo (its own folder, separate from the `rupank` repo), published **public** to the owner's personal GitHub.
- Repo name, which GitHub account, and the live URL are to be confirmed with the owner before publishing. Nothing is pushed without explicit go-ahead.
- Includes `.gitignore` (covering `.env*`, `.superpowers/`), an MIT license, and `.env.example` documenting `GROQ_API_KEY`. No secrets committed.

## README

Explains how everything works: the hybrid architecture, the scanner rules, how prompts and structured output work, streaming, rate limiting, the fallback, and how to run it locally. It must read as written by the owner: first person, casual, plain, specific about real tradeoffs and problems hit, no marketing gloss, no AI-sounding filler (no "leverage", "seamless", "delve", rule-of-three lists, emoji bullet spam, or tidy "In conclusion"). Written at the end from what was actually built. The owner's own writing sample, if provided, is used to match voice.

## Answers from the owner (after review)

- **Profanity:** mild swearing allowed at High ("damn", "hell", "crap"); no f-bombs or slurs. Medium has no swearing; Mild is gentle teasing.
- **GitHub account:** `javacatscript` (the `gh` CLI is currently logged in as `rupanksquare`, so it needs `gh auth login` / account switch before publishing). Repo name still to be confirmed before push.
- **README voice:** the owner will paste a writing sample; the README is written at the end to match it.

## Calls I made (owner should check these)

- **Call budget:** one Groq call per flagged bullet returning roast and rewrite together (not two). Cap at the **8 worst-scoring bullets** per resume to respect free-tier limits. Per-IP limit of roughly one resume per few minutes plus a global daily cap, numbers tuned by the builder.
- **Rate-limit store:** use a free-tier Upstash Redis for per-IP limiting if the owner is fine with one extra free service; otherwise best-effort in-memory limiting. Default: Upstash, since "can't drain the quota" matters for a public link.
- **Streaming + JSON:** stream the roast text as it arrives for the typewriter effect, using a delimited format (roast, separator, rewrite, separator, tags). Validate the full result at the end; if it fails validation, retry once, then fall back to the canned roast for that card. Nothing invalid is shown as a final rewrite.
- **Scanner extremes:** 0 flagged bullets triggers a single "annoyingly good" praise card with a light roast on something minor; max 8 cards. Bullet segmentation handles common bullet characters and line breaks. Image-only (no text layer) PDFs show a clear error asking for pasted text. Multi-column PDFs are best-effort.
- **Prompt injection / abuse:** resume text is treated as untrusted data in the prompt, with input size caps (total characters, bullet length) and a request cap enforced server-side.
- **Fallback mid-game:** the game continues. Remaining cards get canned roast lines per rule, and the back of the card shows the rule's tip ("add a number: how many?") instead of an AI rewrite. The final screen marks which bullets were AI-rewritten.
- **Content safety:** prompt-level rules only (writing only, no personal attributes); no extra moderation call in v1.
- **Scope of the plan:** plan up to a local, deployable build, plus the README draft and publish steps, with the actual push and deploy gated on explicit owner go-ahead.
- **Stack:** Next.js, Framer Motion, Vercel, pdf.js and zod remain defaults the owner hasn't explicitly confirmed.
- **Minor:** sample resume is a fictional one written for the demo; final result is downloadable as plain text; mobile is acceptable but desktop-first.

## Left to the builder

Visual details (exact palette, typography, motion curves), scanner rule set and thresholds, prompt wording, JSON schema fields, component structure, rate-limit numbers, choice of Groq model, test strategy (scanner rules and JSON validation should have unit tests).
