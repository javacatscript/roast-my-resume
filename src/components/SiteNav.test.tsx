import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { render } from '@testing-library/react';
import { SiteNav } from '@/components/SiteNav';

describe('section dividers around the hero', () => {
  it('draws the line under the navbar thin and grey', () => {
    const { container } = render(<SiteNav />);
    const cls = container.querySelector('header')!.className;
    expect(cls).toMatch(/\bborder-b\b/);
    expect(cls).not.toMatch(/border-b-2/);
    expect(cls).toMatch(/border-rule/);
  });

  it('draws the line under the hero thin and grey', () => {
    const css = readFileSync('src/app/globals.css', 'utf8');
    const hero = css.match(/\.hero\s*\{[^}]*\}/)![0];
    expect(hero).toMatch(/border-bottom:\s*1px solid var\(--rule\)/);
  });

  it('defines a grey rule colour for both themes', () => {
    const css = readFileSync('src/app/globals.css', 'utf8');
    expect(css).toMatch(/:root,\s*:root\[data-theme='dark'\]\s*\{[^}]*--rule:\s*#[0-9a-f]{6}/i);
    expect(css).toMatch(/:root\[data-theme='light'\]\s*\{[^}]*--rule:\s*#[0-9a-f]{6}/i);
  });
});
