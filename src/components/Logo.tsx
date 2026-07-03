/**
 * The mazing identity, inline as React components.
 *
 * The mark is a square labyrinth drawn as a single golden line; the red
 * thread (Ariadne's) completes the final approach, and the red dot is the
 * heart of the maze — the same red thread the player unwinds in the game.
 * Standalone SVG copies live in /public (logo.svg, logo-mark.svg).
 */

const GOLD = "#e9c57e";
const THREAD = "#ff4d6d";
const PARCHMENT = "#f2ead9";

export function LogoMark({
  size = 40,
  dim = false,
  className,
}: {
  size?: number;
  dim?: boolean;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
      className={className}
      style={dim ? { filter: "grayscale(0.7)", opacity: 0.7 } : undefined}
    >
      <path
        d="M59 5 L13 5 Q5 5 5 13 L5 51 Q5 59 13 59 L51 59 Q59 59 59 51 L59 29 Q59 21 51 21 L29 21 Q21 21 21 29 L21 35 Q21 43 29 43 L37 43 Q43 43 43 37 L43 34"
        stroke={GOLD}
        strokeWidth="6.5"
        strokeLinecap="round"
      />
      <path
        d="M31 43 L37 43 Q43 43 43 37 L43 34"
        stroke={THREAD}
        strokeWidth="6.5"
        strokeLinecap="round"
      />
      <circle cx="31" cy="32" r="4" fill={THREAD} />
    </svg>
  );
}

export function LogoFull({
  height = 48,
  className,
}: {
  height?: number;
  className?: string;
}) {
  return (
    <svg
      height={height}
      viewBox="0 0 242 64"
      fill="none"
      role="img"
      aria-label="mazing"
      className={className}
    >
      {/* mark */}
      <path
        d="M59 5 L13 5 Q5 5 5 13 L5 51 Q5 59 13 59 L51 59 Q59 59 59 51 L59 29 Q59 21 51 21 L29 21 Q21 21 21 29 L21 35 Q21 43 29 43 L37 43 Q43 43 43 37 L43 34"
        stroke={GOLD}
        strokeWidth="6.5"
        strokeLinecap="round"
      />
      <path
        d="M31 43 L37 43 Q43 43 43 37 L43 34"
        stroke={THREAD}
        strokeWidth="6.5"
        strokeLinecap="round"
      />
      <circle cx="31" cy="32" r="4" fill={THREAD} />
      {/* wordmark: monoline letters, drawn like corridors */}
      <g stroke={PARCHMENT} strokeWidth="6.5" strokeLinecap="round" strokeLinejoin="round">
        {/* m */}
        <path d="M80 46 V29 A7 7 0 0 1 94 29 V46" />
        <path d="M94 29 A7 7 0 0 1 108 29 V46" />
        {/* a */}
        <circle cx="130" cy="34" r="12" />
        <path d="M142 22 V46" />
        {/* z */}
        <path d="M152 25 H168 L152 43 H168" />
        {/* i */}
        <path d="M178 25.5 V46" />
        {/* n */}
        <path d="M188 46 V29 A7 7 0 0 1 202 29 V46" />
        {/* g */}
        <circle cx="224" cy="34" r="12" />
        <path d="M236 22 V51 A9 9 0 0 1 218 51" />
      </g>
      {/* i dot in thread red — the ember you play as */}
      <circle cx="178" cy="15" r="4" fill={THREAD} />
    </svg>
  );
}
