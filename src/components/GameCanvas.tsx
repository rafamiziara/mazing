'use client'

import Link from 'next/link'
/**
 * Client shell for the game: owns the engine + renderer, translates input
 * (keyboard, swipe, buttons) into engine calls, and renders the HUD and
 * overlays in React at a throttled cadence so the canvas keeps 60fps.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { LogoMark } from '@/components/Logo'
import { audio } from '@/lib/audio'
import { type Dir, Game, type Mode, type Status } from '@/lib/game'
import { Renderer } from '@/lib/render'
import { dailyKey, dailyNumber } from '@/lib/rng'
import { storage } from '@/lib/storage'

const KEY_DIRS: Record<string, Dir> = {
  ArrowUp: 'up',
  KeyW: 'up',
  ArrowDown: 'down',
  KeyS: 'down',
  ArrowLeft: 'left',
  KeyA: 'left',
  ArrowRight: 'right',
  KeyD: 'right',
}

interface Hud {
  level: number
  score: number
  light: number
  pulses: number
  sparksTaken: number
  sparksTotal: number
  status: Status
  time: number
  algorithm: string
}

function fmtTime(s: number) {
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${String(sec).padStart(2, '0')}`
}

export default function GameCanvas({ mode }: { mode: Mode }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameRef = useRef<Game | null>(null)
  const rendererRef = useRef<Renderer | null>(null)
  const pausedRef = useRef(false)
  const [hud, setHud] = useState<Hud | null>(null)
  const [paused, setPaused] = useState(false)
  const [muted, setMuted] = useState(false)
  const [runKey, setRunKey] = useState(0)
  const [copied, setCopied] = useState(false)
  const touchStart = useRef<{ x: number; y: number } | null>(null)

  const seedLabel = mode === 'daily' ? `daily:${dailyKey()}` : `journey:${Date.now().toString(36)}`

  useEffect(() => {
    pausedRef.current = paused
  }, [paused])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const game = new Game(mode, seedLabel)
    const renderer = new Renderer(canvas)
    gameRef.current = game
    rendererRef.current = renderer
    if (process.env.NODE_ENV === 'development') {
      // Dev hook: drive the engine from the console / test tooling.
      ;(window as unknown as { __mazing?: Game }).__mazing = game
    }

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
    renderer.reducedMotion = reduced.matches
    const onReduced = () => (renderer.reducedMotion = reduced.matches)
    reduced.addEventListener?.('change', onReduced)

    const initialMuted = storage.muted()
    setMuted(initialMuted)
    audio.setMuted(initialMuted)

    game.onEvent = (e) => {
      switch (e) {
        case 'step':
          audio.step()
          break
        case 'spark':
          audio.spark()
          break
        case 'charge':
          audio.charge()
          break
        case 'pulse':
          audio.pulse()
          break
        case 'hit':
          audio.hit()
          audio.resetCombo()
          break
        case 'portal':
          audio.portal()
          break
        case 'death':
          audio.death()
          break
        case 'lowlight':
          audio.lowLight()
          break
        case 'levelstart':
          audio.resetCombo()
          break
      }
      if (e === 'portal' || e === 'death') syncHud()
    }

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      renderer.resize(window.innerWidth, window.innerHeight, dpr)
    }
    resize()
    window.addEventListener('resize', resize)

    let raf = 0
    let last = performance.now()
    let hudTimer = 0

    const syncHud = () => {
      const s = game.state
      setHud({
        level: s.level,
        score: s.score,
        light: s.light,
        pulses: s.pulses,
        sparksTaken: s.sparksTaken,
        sparksTotal: s.sparksTotal,
        status: s.status,
        time: s.mode === 'daily' ? s.time : s.totalTime + s.time,
        algorithm: s.algorithm,
      })
    }
    syncHud()

    const frame = (now: number) => {
      const dt = (now - last) / 1000
      last = now
      if (!pausedRef.current) game.update(dt)
      renderer.render(game, now / 1000, dt)

      // Journey: auto-advance shortly after the portal takes you.
      if (game.state.status === 'clear' && game.state.clearT > 1.4) {
        game.nextLevel()
        syncHud()
      }
      hudTimer += dt
      if (hudTimer > 0.15) {
        hudTimer = 0
        syncHud()
      }
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)

    // ---------------- input
    const onKeyDown = (e: KeyboardEvent) => {
      audio.init()
      const dir = KEY_DIRS[e.code]
      if (dir) {
        e.preventDefault()
        game.press(dir)
        return
      }
      if (e.code === 'Space') {
        e.preventDefault()
        if (!pausedRef.current) game.firePulse()
      } else if (e.code === 'Escape' || e.code === 'KeyP') {
        setPaused((p) => !p)
      } else if (e.code === 'KeyM') {
        setMuted((m) => {
          storage.saveMuted(!m)
          audio.setMuted(!m)
          return !m
        })
      }
    }
    const onKeyUp = (e: KeyboardEvent) => {
      const dir = KEY_DIRS[e.code]
      if (dir) game.release(dir)
    }
    const onBlur = () => {
      game.releaseAll()
      if (game.state.status === 'playing') setPaused(true)
    }

    const onTouchStart = (e: TouchEvent) => {
      audio.init()
      if (e.touches.length === 1) {
        touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
      }
    }
    const onTouchMove = (e: TouchEvent) => {
      if (!touchStart.current || e.touches.length !== 1) return
      const dx = e.touches[0].clientX - touchStart.current.x
      const dy = e.touches[0].clientY - touchStart.current.y
      if (Math.abs(dx) < 24 && Math.abs(dy) < 24) return
      const dir: Dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up'
      game.releaseAll()
      game.press(dir)
      touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    }
    const onTouchEnd = () => {
      touchStart.current = null
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('blur', onBlur)
    canvas.addEventListener('touchstart', onTouchStart, { passive: true })
    canvas.addEventListener('touchmove', onTouchMove, { passive: true })
    canvas.addEventListener('touchend', onTouchEnd, { passive: true })

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('blur', onBlur)
      canvas.removeEventListener('touchstart', onTouchStart)
      canvas.removeEventListener('touchmove', onTouchMove)
      canvas.removeEventListener('touchend', onTouchEnd)
      reduced.removeEventListener?.('change', onReduced)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, runKey])

  // Persist results when a run ends.
  useEffect(() => {
    if (!hud) return
    if (hud.status === 'over' && mode === 'journey') {
      storage.saveJourneyBest(hud.level, hud.score)
    }
    if ((hud.status === 'won' || hud.status === 'over') && mode === 'daily') {
      storage.saveDailyResult(dailyKey(), {
        score: hud.score,
        sparks: hud.sparksTaken,
        sparksTotal: hud.sparksTotal,
        timeSeconds: Math.round(hud.time),
        survived: hud.status === 'won',
      })
    }
  }, [hud?.status]) // eslint-disable-line react-hooks/exhaustive-deps

  const restart = useCallback(() => {
    setPaused(false)
    setCopied(false)
    setRunKey((k) => k + 1)
  }, [])

  const shareDaily = useCallback(async () => {
    if (!hud) return
    const n = dailyNumber()
    const line =
      hud.status === 'won'
        ? `✦ ${hud.sparksTaken}/${hud.sparksTotal} · ⏱ ${fmtTime(hud.time)} · ${hud.score} pts`
        : `☄ the dark took me · ✦ ${hud.sparksTaken}/${hud.sparksTotal}`
    const text = `mazing #${n} — daily labyrinth\n${line}\nmazing.game`
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
    } catch {
      // Clipboard blocked — nothing to do.
    }
  }, [hud])

  const togglePulse = useCallback(() => {
    audio.init()
    gameRef.current?.firePulse()
  }, [])

  const overlay = hud && (hud.status === 'over' || hud.status === 'won') ? hud.status : null

  return (
    <div className="fixed inset-0 overflow-hidden bg-night select-none">
      <canvas ref={canvasRef} className="block h-full w-full" aria-label="mazing — the maze" />

      {/* ------------------------------------------------ HUD */}
      {hud && (
        <>
          <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-4 sm:p-6">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                aria-label="Back to home"
                className="pointer-events-auto opacity-70 transition-opacity hover:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ember"
              >
                <LogoMark size={34} />
              </Link>
              <div className="font-mono text-xs tracking-widest text-parchment/60 uppercase">
                {mode === 'daily' ? <span className="text-portal">daily #{dailyNumber()}</span> : <span>level {hud.level}</span>}
                <span className="mx-2 opacity-40">·</span>
                <span>{fmtTime(hud.time)}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="font-mono text-lg font-medium text-parchment tabular-nums">{hud.score.toLocaleString('en-US')}</div>
              <div className="font-mono text-[10px] tracking-widest text-parchment/50 uppercase">
                ✦ {hud.sparksTaken}/{hud.sparksTotal}
              </div>
            </div>
          </div>

          {/* Light meter — the flame that is your life. */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-4 sm:p-6">
            <div className="w-44 sm:w-56">
              <div className="mb-1.5 flex items-center justify-between font-mono text-[10px] tracking-widest uppercase">
                <span className={hud.light < 0.25 ? 'animate-pulse text-thread' : 'text-parchment/50'}>light</span>
                <span className="text-parchment/50">
                  echo {'◆'.repeat(Math.min(hud.pulses, 5))}
                  {hud.pulses > 5 ? `+${hud.pulses - 5}` : ''}
                  {hud.pulses === 0 && <span className="opacity-40">—</span>}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className={`h-full rounded-full transition-[width] duration-200 ${
                    hud.light < 0.25 ? 'bg-thread' : 'bg-gradient-to-r from-ember to-ember-hot'
                  }`}
                  style={{ width: `${Math.round(hud.light * 100)}%` }}
                />
              </div>
            </div>

            {/* Touch pulse button */}
            <button
              type="button"
              onClick={togglePulse}
              aria-label="Echo pulse (Space)"
              className="pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full border border-ember/40 bg-ember/10 font-mono text-xl text-ember backdrop-blur transition active:scale-95 sm:hidden"
            >
              ◉
            </button>
          </div>
        </>
      )}

      {/* ------------------------------------------------ pause */}
      {paused && !overlay && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-night/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-6 text-center">
            <h2 className="font-display text-3xl tracking-[0.3em] text-parchment uppercase">Paused</h2>
            <p className="max-w-xs text-sm text-parchment/60">The maze waits. Your light, for now, does not burn down.</p>
            <div className="flex gap-3">
              <button type="button" onClick={() => setPaused(false)} className="btn-primary">
                Resume
              </button>
              <Link href="/" className="btn-ghost">
                Give up
              </Link>
            </div>
            <p className="font-mono text-[11px] tracking-wider text-parchment/40">esc resume · m {muted ? 'unmute audio' : 'mute'}</p>
          </div>
        </div>
      )}

      {/* ------------------------------------------------ run over */}
      {overlay && hud && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-night/70 p-6 backdrop-blur-sm">
          <div className="flex w-full max-w-sm flex-col items-center gap-5 rounded-2xl border border-white/10 bg-night-high/90 p-8 text-center shadow-2xl shadow-black/60">
            <LogoMark size={44} dim={overlay === 'over'} />
            <div>
              <h2 className="font-display text-2xl tracking-[0.25em] text-parchment uppercase">
                {overlay === 'won' ? 'You made it out' : 'The dark caught you'}
              </h2>
              <p className="mt-2 text-sm text-parchment/60">
                {overlay === 'won'
                  ? 'The thread led you back to the light.'
                  : mode === 'journey'
                    ? `The flame went out at level ${hud.level}.`
                    : 'The flame went out in the corridors.'}
              </p>
            </div>

            <dl className="grid w-full grid-cols-3 gap-2 font-mono text-parchment/80">
              <div className="rounded-lg bg-white/5 p-3">
                <dt className="text-[9px] tracking-widest text-parchment/40 uppercase">score</dt>
                <dd className="mt-1 text-base tabular-nums">{hud.score.toLocaleString('en-US')}</dd>
              </div>
              <div className="rounded-lg bg-white/5 p-3">
                <dt className="text-[9px] tracking-widest text-parchment/40 uppercase">{mode === 'journey' ? 'level' : 'sparks'}</dt>
                <dd className="mt-1 text-base tabular-nums">{mode === 'journey' ? hud.level : `${hud.sparksTaken}/${hud.sparksTotal}`}</dd>
              </div>
              <div className="rounded-lg bg-white/5 p-3">
                <dt className="text-[9px] tracking-widest text-parchment/40 uppercase">time</dt>
                <dd className="mt-1 text-base tabular-nums">{fmtTime(hud.time)}</dd>
              </div>
            </dl>

            <div className="flex flex-wrap justify-center gap-3">
              {mode === 'daily' ? (
                <button type="button" onClick={shareDaily} className="btn-primary">
                  {copied ? 'Copied ✓' : 'Share result'}
                </button>
              ) : (
                <button type="button" onClick={restart} className="btn-primary">
                  Rekindle the flame
                </button>
              )}
              {mode === 'daily' && (
                <button type="button" onClick={restart} className="btn-ghost">
                  Retry
                </button>
              )}
              <Link href="/" className="btn-ghost">
                Home
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* first-run hint */}
      {hud && hud.status === 'playing' && hud.time < 6 && hud.level === 1 && (
        <div className="pointer-events-none absolute inset-x-0 bottom-24 flex justify-center">
          <p className="animate-fade-in-out rounded-full bg-night-high/80 px-5 py-2 font-mono text-[11px] tracking-wider text-parchment/70 backdrop-blur">
            arrows / wasd to move · space for the echo pulse
          </p>
        </div>
      )}
    </div>
  )
}
