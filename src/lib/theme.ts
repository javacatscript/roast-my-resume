export type Theme = 'light' | 'dark';
export const THEME_KEY = 'rr-theme';
export const DEFAULT_THEME: Theme = 'dark';

export function resolveTheme(stored: string | null | undefined): Theme {
  return stored === 'light' || stored === 'dark' ? stored : DEFAULT_THEME;
}

/** Runs in <head> before first paint so the page never flashes the wrong theme. */
export const THEME_INIT_SCRIPT = `try {
  var t = localStorage.getItem('${THEME_KEY}');
  document.documentElement.dataset.theme = (t === 'light' || t === 'dark') ? t : '${DEFAULT_THEME}';
} catch (e) {
  document.documentElement.dataset.theme = '${DEFAULT_THEME}';
}`;

export function storeTheme(theme: Theme): void {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    /* private mode or blocked storage: the choice just won't persist */
  }
}
