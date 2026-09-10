'use client'

/**
 * Ambient hero canvas for the landing page: a faint golden labyrinth in
 * which a red thread endlessly wanders, led by a small ember. Purely
 * decorative — pointer-events none, dimmed, and static under
 * prefers-reduced-motion.
 */
import { useEffect, useRef } from 'react'
import { E, generateMaze, isOpen, type Maze, N, S, shortestPath, W } from '@/lib/maze'
import { mulberry32 } from '@/lib/rng'

export default function AmbientMaze({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const rng = mulberry32((Math.random() * 2 ** 31) | 0)

    let maze: Maze
    let cell = 44
    let cols = 10,
      rows = 10
    let w = 0,
      h = 0,
      dpr = 1
    // The thread: a trail of visited points (cell centers) with a moving head.
    let trail: { x: number; y: number }[] = []
    let path: number[] = []
    let pathPos = 0 // fractional index along path
    let headX = 0,
      headY = 0

    const rebuild = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = canvas.clientWidth
      h = canvas.clientHeight
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      cell = Math.max(38, Math.min(64, Math.floor(w / 18)))
      cols = Math.max(6, Math.ceil(w / cell))
      rows = Math.max(6, Math.ceil(h / cell))
      maze = generateMaze(cols, rows, rng, 'backtracker', 0.1)
      const sx = Math.floor(rng() * cols),
        sy = Math.floor(rng() * rows)
      trail = [{ x: sx + 0.5, y: sy + 0.5 }]
      headX = sx + 0.5
      headY = sy + 0.5
      path = []
      pathPos = 0
    }
    rebuild()

    const pickNewPath = () => {
      const cx = Math.floor(headX),
        cy = Math.floor(headY)
      const tx = Math.floor(rng() * cols),
        ty = Math.floor(rng() * rows)
      path = shortestPath(maze, cx, cy, tx, ty)
      pathPos = 0
    }
    pickNewPath()

    const drawWalls = () => {
      ctx.strokeStyle = 'rgba(233, 197, 126, 0.14)'
      ctx.lineWidth = Math.max(1, cell * 0.045)
      ctx.lineCap = 'round'
      ctx.beginPath()
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const px = x * cell,
            py = y * cell
          if (!isOpen(maze, x, y, N)) {
            ctx.moveTo(px, py)
            ctx.lineTo(px + cell, py)
          }
          if (!isOpen(maze, x, y, W)) {
            ctx.moveTo(px, py)
            ctx.lineTo(px, py + cell)
          }
          if (y === rows - 1 && !isOpen(maze, x, y, S)) {
            ctx.moveTo(px, py + cell)
            ctx.lineTo(px + cell, py + cell)
          }
          if (x === cols - 1 && !isOpen(maze, x, y, E)) {
            ctx.moveTo(px + cell, py)
            ctx.lineTo(px + cell, py + cell)
          }
        }
      }
      ctx.stroke()
    }

    const drawFrame = (t: number) => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, w, h)
      drawWalls()

      // Thread.
      if (trail.length > 1) {
        ctx.strokeStyle = 'rgba(255, 77, 109, 0.4)'
        ctx.lineWidth = Math.max(1.2, cell * 0.05)
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.beginPath()
        ctx.moveTo(trail[0].x * cell, trail[0].y * cell)
        for (let i = 1; i < trail.length; i++) ctx.lineTo(trail[i].x * cell, trail[i].y * cell)
        ctx.lineTo(headX * cell, headY * cell)
        ctx.stroke()
      }

      // Ember head with warm halo.
      const hx = headX * cell,
        hy = headY * cell
      const flick = reduced ? 1 : 0.9 + 0.1 * Math.sin(t * 11)
      const r = cell * 0.09 * flick
      const glow = ctx.createRadialGradient(hx, hy, 0, hx, hy, r * 9)
      glow.addColorStop(0, 'rgba(255, 210, 140, 0.5)')
      glow.addColorStop(1, 'rgba(255, 180, 84, 0)')
      ctx.fillStyle = glow
      ctx.fillRect(hx - r * 9, hy - r * 9, r * 18, r * 18)
      ctx.fillStyle = 'rgba(255, 227, 176, 0.95)'
      ctx.beginPath()
      ctx.arc(hx, hy, r, 0, Math.PI * 2)
      ctx.fill()
    }

    if (reduced) {
      // Static composition: pre-walk a path, draw once.
      for (let i = 0; i < path.length; i++) {
        trail.push({ x: (path[i] % cols) + 0.5, y: Math.floor(path[i] / cols) + 0.5 })
      }
      if (trail.length) {
        headX = trail[trail.length - 1].x
        headY = trail[trail.length - 1].y
      }
      drawFrame(0)
      const onResize = () => {
        rebuild()
        pickNewPath()
        drawFrame(0)
      }
      window.addEventListener('resize', onResize)
      return () => window.removeEventListener('resize', onResize)
    }

    let raf = 0
    let last = performance.now()
    const SPEED = 3.2 // cells per second

    const frame = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now

      pathPos += dt * SPEED
      while (path.length && pathPos >= 1 && path.length > 1) {
        path.shift()
        pathPos -= 1
        const i = path[0]
        trail.push({ x: (i % cols) + 0.5, y: Math.floor(i / cols) + 0.5 })
        if (trail.length > 260) trail.shift()
      }
      if (path.length <= 1) {
        pickNewPath()
      } else {
        const a = path[0],
          b = path[1]
        const ax = (a % cols) + 0.5,
          ay = Math.floor(a / cols) + 0.5
        const bx = (b % cols) + 0.5,
          by = Math.floor(b / cols) + 0.5
        const t = Math.min(pathPos, 1)
        headX = ax + (bx - ax) * t
        headY = ay + (by - ay) * t
      }

      drawFrame(now / 1000)
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)

    const onResize = () => {
      rebuild()
      pickNewPath()
    }
    window.addEventListener('resize', onResize)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  return (
    // biome-ignore lint/a11y/noAriaHiddenOnFocusable: a bare <canvas> is not in the tab order, and this one is a decorative backdrop with pointer-events-none — aria-hidden is what correctly keeps it out of the accessibility tree
    <canvas ref={ref} aria-hidden="true" className={`pointer-events-none ${className ?? ''}`} />
  )
}
