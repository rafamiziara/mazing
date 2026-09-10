import Link from 'next/link'
import AmbientMaze from '@/components/AmbientMaze'
import BestStats, { DailyBadge } from '@/components/BestStats'
import { LogoFull } from '@/components/Logo'

export default function Home() {
  return (
    <main className="relative min-h-dvh overflow-hidden">
      {/* Ambient labyrinth behind everything */}
      <AmbientMaze className="absolute inset-0 h-full w-full opacity-70" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-night/30 via-night/55 to-night" />

      <div className="relative mx-auto flex min-h-dvh max-w-3xl flex-col items-center justify-center gap-10 px-6 py-20 text-center">
        <header className="flex flex-col items-center gap-8">
          <LogoFull height={72} className="h-14 w-auto sm:h-[72px]" />
          <div>
            <p className="font-mono text-[11px] tracking-[0.35em] text-gold/70 uppercase">a game of mazes, light and memory</p>
            <h1 className="mt-4 font-display text-3xl leading-tight tracking-wide text-parchment sm:text-4xl">Your light is your life.</h1>
            <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-parchment/70">
              You are an ember in a maze that never ends. The flame burns down with every step, sparks rekindle it, and a red thread
              remembers every corridor you&apos;ve dared. Find the portal before the dark catches you.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/play" className="btn-primary">
              Enter the maze
            </Link>
            <Link href="/play?mode=daily" className="btn-ghost">
              <DailyBadge />
            </Link>
          </div>

          <BestStats />
        </header>

        {/* How to survive */}
        <section aria-label="How to survive" className="mt-6 grid w-full gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-white/8 bg-night-high/50 p-5 text-left backdrop-blur-sm">
            <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true" className="mb-3">
              <circle cx="14" cy="14" r="10" fill="none" stroke="#ffb454" strokeOpacity="0.35" strokeWidth="2" />
              <circle cx="14" cy="14" r="4.5" fill="#ffe3b0" />
            </svg>
            <h2 className="font-display text-sm tracking-[0.2em] text-ember uppercase">The flame</h2>
            <p className="mt-2 text-sm leading-relaxed text-parchment/65">
              The light around you shrinks over time. Collect sparks ✦ to rekindle it — and to see further.
            </p>
          </div>
          <div className="rounded-xl border border-white/8 bg-night-high/50 p-5 text-left backdrop-blur-sm">
            <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true" className="mb-3">
              <path d="M3 22 Q9 22 9 15 T15 8 T25 6" fill="none" stroke="#ff4d6d" strokeWidth="2.5" strokeLinecap="round" />
              <circle cx="25" cy="6" r="2.5" fill="#ff4d6d" />
            </svg>
            <h2 className="font-display text-sm tracking-[0.2em] text-thread uppercase">The thread</h2>
            <p className="mt-2 text-sm leading-relaxed text-parchment/65">
              Like Ariadne, you leave a red thread behind you. What you&apos;ve seen remains in memory, in a dim, distant purple light.
            </p>
          </div>
          <div className="rounded-xl border border-white/8 bg-night-high/50 p-5 text-left backdrop-blur-sm">
            <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true" className="mb-3">
              <circle cx="14" cy="14" r="3" fill="#7fe8d8" />
              <circle cx="14" cy="14" r="7.5" fill="none" stroke="#7fe8d8" strokeOpacity="0.6" strokeWidth="1.8" />
              <circle cx="14" cy="14" r="12" fill="none" stroke="#7fe8d8" strokeOpacity="0.25" strokeWidth="1.8" />
            </svg>
            <h2 className="font-display text-sm tracking-[0.2em] text-portal uppercase">The echo</h2>
            <p className="mt-2 text-sm leading-relaxed text-parchment/65">
              Press space to release an echo that runs along the corridors and shows you, for a moment, the way out. Use it wisely.
            </p>
          </div>
        </section>

        <footer className="mt-4 space-y-3">
          <p className="max-w-lg text-sm leading-relaxed text-parchment/50">
            Every descent is generated on the spot: winding corridors, branching galleries, ever denser weaves. No maze exists twice —
            except the daily one, the same for everyone.
          </p>
          <p className="font-mono text-[11px] tracking-widest text-parchment/35 uppercase">
            arrows / wasd move · space echo · m audio · esc pause
          </p>
        </footer>
      </div>
    </main>
  )
}
