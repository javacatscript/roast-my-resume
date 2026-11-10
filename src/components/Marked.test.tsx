import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Marked } from '@/components/Marked';

describe('Marked', () => {
  const text = 'Responsible for managing the release process';

  it('wraps each span in a pen mark and keeps all the text', () => {
    const { container } = render(<Marked text={text} spans={[{ start: 0, end: 15 }]} />);
    const marks = container.querySelectorAll('mark');
    expect(marks).toHaveLength(1);
    expect(marks[0]).toHaveTextContent('Responsible for');
    expect(marks[0].className).toContain('pen');
    expect(container.textContent).toBe(text);
  });

  it('renders plain text when there are no spans', () => {
    const { container } = render(<Marked text={text} spans={[]} />);
    expect(container.querySelector('mark')).toBeNull();
    expect(container.textContent).toBe(text);
  });

  it('handles several spans in order', () => {
    const { container } = render(
      <Marked text="one two three four" spans={[{ start: 0, end: 3 }, { start: 8, end: 13 }]} />,
    );
    expect([...container.querySelectorAll('mark')].map((m) => m.textContent)).toEqual(['one', 'three']);
    expect(container.textContent).toBe('one two three four');
  });
});
