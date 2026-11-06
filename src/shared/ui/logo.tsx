// The package, not the @/shared/lib barrel: the global error page draws the
// logo and must not pull in env or i18n modules that may be what failed.
import { cn } from 'cn';

/**
 * The app mark: an "M" in a rounded square (the design, 2026-11-04). Drawn
 * from the `foreground`/`background` tokens, so dark mode inverts it: a
 * dark square in light mode, a light one in dark. Decorative; the app name
 * next to it is the text.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        'inline-flex size-8 shrink-0 items-center justify-center rounded-sm bg-foreground text-background',
        className,
      )}
    >
      <svg viewBox="0 0 24 24" className="size-5" fill="none">
        <path
          d="M5.5 18V6.5L12 13l6.5-6.5V18"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
