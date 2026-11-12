/** A small ring loader. Decorative: pair it with visible or screen-reader text that says what is loading. */
export function Spinner({ className = '' }: { className?: string }) {
  return (
    <span
      aria-hidden
      data-spinner
      className={`inline-block size-[1em] shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent ${className}`}
    />
  );
}
