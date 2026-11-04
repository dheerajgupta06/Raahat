import { useId } from 'react';

const SIZES = {
  sm: { mark: 'h-8 w-8', text: 'text-lg', sub: 'text-[8px]' },
  md: { mark: 'h-10 w-10', text: 'text-xl', sub: 'text-[9px]' },
  lg: { mark: 'h-14 w-14', text: 'text-3xl', sub: 'text-[10px]' },
};

export function Logo({ size = 'md', tagline = false, className = '' }) {
  const gradientId = useId();
  const scale = SIZES[size] || SIZES.md;

  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg
        viewBox="0 0 48 48"
        role="img"
        aria-label="Raahat"
        className={`logo-mark shrink-0 ${scale.mark}`}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#e9fdff" />
            <stop offset="45%" stopColor="#2de2e6" />
            <stop offset="100%" stopColor="#0891b2" />
          </linearGradient>
        </defs>
        <rect
          x="2"
          y="2"
          width="44"
          height="44"
          rx="13"
          fill="currentColor"
          fillOpacity="0.06"
          stroke="currentColor"
          strokeOpacity="0.35"
          strokeWidth="1.5"
        />
        <path
          d="M24 7.5c-7.2 0-13 5.7-13 12.8 0 9.3 13 20.2 13 20.2s13-10.9 13-20.2c0-7.1-5.8-12.8-13-12.8Z"
          fill={`url(#${gradientId})`}
        />
        <path
          d="M24 28.4c-.4 0-.7-.1-1-.4-2.6-2.2-5-4.4-5-7.3 0-2.2 1.7-3.9 3.8-3.9 1 0 1.6.3 2.2.9.6-.6 1.2-.9 2.2-.9 2.1 0 3.8 1.7 3.8 3.9 0 2.9-2.4 5.1-5 7.3-.3.3-.6.4-1 .4Z"
          fill="#03111a"
        />
        <circle cx="24" cy="20.4" r="1.6" fill="#7df5f7" opacity="0.85" />
      </svg>
      <span className="flex flex-col leading-none">
        <span className={`logo-text font-black uppercase tracking-[0.18em] ${scale.text}`}>
          Raahat
        </span>
        {tagline ? (
          <span className={`mt-1 font-semibold uppercase tracking-[0.22em] text-muted ${scale.sub}`}>
            Emergency Me Sabse Pehle
          </span>
        ) : null}
      </span>
    </span>
  );
}
