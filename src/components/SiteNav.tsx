import { Flame } from '@/components/Flame';
import { ThemeToggle } from '@/components/ThemeToggle';

export const REPO_URL = 'https://github.com/javacatscript/roast-my-resume';

const LINKS = [
  { href: '#how', label: 'How it works' },
  { href: '#checks', label: 'What it checks' },
  { href: '#heat', label: 'Roast levels' },
];

export function SiteNav({ showLinks = false, children }: { showLinks?: boolean; children?: React.ReactNode }) {
  return (
    <header className="border-b border-line bg-bg">
      <nav aria-label="Main" className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
        {/* A full reload is intended here: it also resets a game in progress. */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a href="/" className="flex items-center gap-2 text-lg font-bold tracking-tight focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-fire">
          <Flame />
          Resume Roast
        </a>
        <div className="flex items-center gap-1 sm:gap-2">
          {showLinks && (
            <ul className="hidden items-center gap-1 md:flex">
              {LINKS.map((l) => (
                <li key={l.href}>
                  <a href={l.href} className="rounded-lg px-3 py-2 text-sm text-muted transition hover:text-text focus-visible:outline-2 focus-visible:outline-fire">
                    {l.label}
                  </a>
                </li>
              ))}
              <li>
                <a href={REPO_URL} className="rounded-lg px-3 py-2 text-sm text-muted transition hover:text-text focus-visible:outline-2 focus-visible:outline-fire">
                  GitHub
                </a>
              </li>
            </ul>
          )}
          {children}
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}
