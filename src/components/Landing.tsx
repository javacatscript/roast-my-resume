import { HeatPicker } from '@/components/HeatPicker';
import { HeroDemo } from '@/components/HeroDemo';
import { REPO_URL, SiteNav } from '@/components/SiteNav';
import { UploadScreen } from '@/components/UploadScreen';
import { SCANNER_CHECKS, STEPS } from '@/data/checks';
import type { Intensity } from '@/lib/types';

const section = 'mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-24';
const h2 = 'text-3xl font-extrabold tracking-tight sm:text-4xl';

function Highlighted({ text, hit }: { text: string; hit: string }) {
  const i = text.indexOf(hit);
  if (i === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <mark className="pen">{hit}</mark>
      {text.slice(i + hit.length)}
    </>
  );
}

export function Landing({
  onStart,
  reducedMotion,
  message,
}: {
  onStart: (text: string, i: Intensity) => void;
  reducedMotion: boolean;
  message?: string;
}) {
  return (
    <>
      <SiteNav showLinks />
      <main>
        <section className="hero">
          <div className="mx-auto grid max-w-6xl gap-12 px-5 py-10 sm:px-8 sm:py-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-16">
            <div>
              <h1 className="text-5xl font-extrabold leading-[0.98] tracking-tight sm:text-6xl lg:text-[4.25rem]">
                <span className="block">Your resume, roasted.</span>
                <span className="block">Then rewritten.</span>
              </h1>
              <p className="mt-5 max-w-[34rem] text-lg leading-relaxed" style={{ color: 'var(--hero-muted)' }}>
                <span className="sm:hidden">Weak bullets get roasted live, rewritten with metrics you were too shy to add.</span>
                <span className="hidden sm:inline">
                  Each weak bullet gets roasted live, rewritten with a placeholder for the metrics you were too shy to include.
                </span>
              </p>
              <div className="mt-6">
                <UploadScreen onStart={onStart} message={message} />
              </div>
            </div>
            <HeroDemo reducedMotion={reducedMotion} />
          </div>
        </section>

        <section id="how" className={section} aria-labelledby="how-h">
          <h2 id="how-h" className={h2}>
            How it works
          </h2>
          <ol aria-label="How it works" className="mt-10 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <li key={s.title} className="relative border-t-2 border-line pt-5">
                <span aria-hidden className="fire-fill absolute -top-0.5 left-0 h-0.5 w-12" />
                <span aria-hidden className="text-sm font-bold text-fire">
                  {i + 1}
                </span>
                <h3 className="mt-1 text-xl font-bold tracking-tight">{s.title}</h3>
                <p className="mt-2 max-w-[18rem] text-[15px] leading-relaxed text-muted">{s.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section id="checks" className="border-y-2 border-edge bg-surface" aria-labelledby="checks-h">
          <div className={section}>
            <h2 id="checks-h" className={h2}>
              What it checks
            </h2>
            <p className="mt-3 max-w-xl text-muted">
              Five rules run in your browser before any AI is involved. Each one is a real check, shown here on a real example.
            </p>
            <ul className="mt-10">
              {SCANNER_CHECKS.map((c) => (
                <li key={c.rule} className="grid gap-4 border-t border-line py-7 lg:grid-cols-[15rem_1fr_1fr] lg:gap-10">
                  <div>
                    <h3 className="text-lg font-bold tracking-tight">{c.name}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted">{c.tip}</p>
                  </div>
                  <p className="doc text-[17px] leading-snug text-muted">
                    <span className="sr-only">Before: </span>
                    <Highlighted text={c.before} hit={c.hit} />
                  </p>
                  <p className="doc text-[17px] leading-snug text-rewrite">
                    <span className="sr-only">After: </span>
                    {c.after}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section id="heat" className={section} aria-labelledby="heat-h">
          <h2 id="heat-h" className={h2}>
            Pick how hard it hits
          </h2>
          <p className="mt-3 max-w-xl text-muted">The same bullet at each level. High is the default, and it does swear a little.</p>
          <HeatPicker />
        </section>

        <section className="border-t border-line" aria-labelledby="priv-h">
          <div className={`${section} grid gap-10 md:grid-cols-2`}>
            <div>
              <h2 id="priv-h" className="text-2xl font-extrabold tracking-tight">
                What happens to your resume
              </h2>
              <p className="mt-3 max-w-md leading-relaxed text-muted">
                The text is sent to Groq to write the roast. This site does not store it or log it, and nothing is kept between visits.
              </p>
            </div>
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight">What it can&apos;t do</h2>
              <p className="mt-3 max-w-md leading-relaxed text-muted">
                Scanned PDFs have no text to read, so paste those instead. It reads English only, and multi-column layouts can come out jumbled.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-8 text-sm text-muted sm:px-8">
          <p>Built by javacatscript. MIT licensed.</p>
          <a href={REPO_URL} className="font-medium text-text underline underline-offset-4 hover:text-fire focus-visible:outline-2 focus-visible:outline-fire">
            Source on GitHub
          </a>
        </div>
      </footer>
    </>
  );
}
