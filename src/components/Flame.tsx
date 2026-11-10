export function Flame({ size = 22 }: { size?: number }) {
  return (
    <svg aria-hidden width={size} height={size} viewBox="0 0 24 24">
      <defs>
        <linearGradient id="flame-g" x1="0" y1="1" x2="0.4" y2="0">
          <stop offset="0" stopColor="var(--fire-b)" />
          <stop offset="1" stopColor="var(--fire-a)" />
        </linearGradient>
      </defs>
      <path
        fill="url(#flame-g)"
        d="M12.6 1.5c.5 3.2-1.2 4.9-2.7 6.7-1.5 1.8-2.9 3.6-2.9 6.2A5.9 5.9 0 0 0 12 20.3a5.9 5.9 0 0 0 5-5.9c0-2.1-.9-3.6-1.9-4.9.1 1.2-.3 2.2-1.1 2.8.5-3.7-.1-8.3-1.4-10.8z"
      />
    </svg>
  );
}
