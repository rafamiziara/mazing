/**
 * Canvas renderer for mazing.
 *
 * Layer order each frame:
 *   1. deep-night background with drifting nebula tint
 *   2. memory layer — everything you've ever seen, in faint violet
 *   3. echo-pulse flashes racing along corridors
 *   4. the light: visibility polygon clipped, warm radial gradient,
 *      floor + walls + sparks rendered bright inside it
 *   5. Ariadne's thread (red), portal beacon, wisps, player ember
 *   6. particles, vignette, screen shake
 */
import { Game, GameState } from "./game";
import { Maze, isOpen, idx, N, S, E, W } from "./maze";
import { wallSegments } from "./maze";
import { visibilityPolygon, pointInPolygon, Point } from "./visibility";

export const PALETTE = {
  night: "#0e0b1c",
  nightHigh: "#171230",
  memoryWall: "#3d3268",
  memoryFloor: "#1a1533",
  litWall: "#e8c98a",
  litFloor: "#241c40",
  ember: "#ffb454",
  emberHot: "#ffe3b0",
  thread: "#ff4d6d",
  portal: "#7fe8d8",
  wisp: "#9d7bff",
  flash: "#ffd98a",
};

export interface Camera {
  x: number;
  y: number;
  cell: number; // pixels per cell
}

export class Renderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private camera: Camera = { x: 0, y: 0, cell: 48 };
  private dpr = 1;
  private w = 0;
  private h = 0;
  private poly: Point[] = [];
  private noise: number[] = [];
  reducedMotion = false;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("2d context unavailable");
    this.ctx = ctx;
    for (let i = 0; i < 512; i++) this.noise.push(Math.random());
  }

  resize(w: number, h: number, dpr: number) {
    this.w = w;
    this.h = h;
    this.dpr = dpr;
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    // Show roughly 11–13 cells on the short edge, clamped for readability.
    this.camera.cell = Math.max(34, Math.min(64, Math.floor(Math.min(w, h) / 11)));
  }

  /** Cell-space → screen-space. */
  private sx(x: number) {
    return (x - this.camera.x) * this.camera.cell + this.w / 2;
  }
  private sy(y: number) {
    return (y - this.camera.y) * this.camera.cell + this.h / 2;
  }

  render(game: Game, t: number, dt: number) {
    const s = game.state;
    const ctx = this.ctx;
    const cell = this.camera.cell;

    // Camera eases toward the player.
    const ease = Math.min(1, dt * 5);
    this.camera.x += (s.px - this.camera.x) * ease;
    this.camera.y += (s.py - this.camera.y) * ease;
    // Clamp camera: center small mazes, and keep ~2.5 cells of breathing
    // room at the edges so the player never sits under the HUD.
    const viewW = this.w / cell, viewH = this.h / cell;
    const pad = 2.5;
    if (s.maze.cols + pad * 2 < viewW) this.camera.x = s.maze.cols / 2;
    else this.camera.x = Math.max(viewW / 2 - pad, Math.min(s.maze.cols - viewW / 2 + pad, this.camera.x));
    if (s.maze.rows + pad * 2 < viewH) this.camera.y = s.maze.rows / 2;
    else this.camera.y = Math.max(viewH / 2 - pad, Math.min(s.maze.rows - viewH / 2 + pad, this.camera.y));

    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    // Screen shake.
    if (s.shake > 0 && !this.reducedMotion) {
      const m = s.shake * s.shake * 7;
      ctx.translate((Math.random() - 0.5) * m, (Math.random() - 0.5) * m);
    }

    // --- 1. background
    const bgGrad = ctx.createRadialGradient(
      this.w / 2, this.h / 2, 0,
      this.w / 2, this.h / 2, Math.max(this.w, this.h) * 0.75
    );
    bgGrad.addColorStop(0, PALETTE.nightHigh);
    bgGrad.addColorStop(1, PALETTE.night);
    ctx.fillStyle = bgGrad;
    ctx.fillRect(-20, -20, this.w + 40, this.h + 40);

    // Visible cell range.
    const x0 = Math.max(0, Math.floor(this.camera.x - viewW / 2) - 1);
    const x1 = Math.min(s.maze.cols - 1, Math.ceil(this.camera.x + viewW / 2) + 1);
    const y0 = Math.max(0, Math.floor(this.camera.y - viewH / 2) - 1);
    const y1 = Math.min(s.maze.rows - 1, Math.ceil(this.camera.y + viewH / 2) + 1);

    // --- visibility polygon (light shape)
    const radius = game.lightRadius;
    const segs = wallSegments(
      s.maze,
      Math.floor(s.px - radius) - 1, Math.floor(s.py - radius) - 1,
      Math.ceil(s.px + radius) + 1, Math.ceil(s.py + radius) + 1
    );
    this.poly = visibilityPolygon(s.px, s.py, segs, radius);

    // Mark newly seen cells (cheap: only cells near the player).
    const seeR = Math.ceil(radius);
    for (let y = Math.max(0, s.cy - seeR); y <= Math.min(s.maze.rows - 1, s.cy + seeR); y++) {
      for (let x = Math.max(0, s.cx - seeR); x <= Math.min(s.maze.cols - 1, s.cx + seeR); x++) {
        if (s.seen[idx(s.maze, x, y)]) continue;
        const dx = x + 0.5 - s.px, dy = y + 0.5 - s.py;
        if (dx * dx + dy * dy > radius * radius) continue;
        if (pointInPolygon(x + 0.5, y + 0.5, this.poly)) s.seen[idx(s.maze, x, y)] = 1;
      }
    }

    // --- 2. memory layer
    this.drawMemory(s, x0, y0, x1, y1);

    // --- 3. pulse flashes
    this.drawFlashes(s, x0, y0, x1, y1);

    // --- exit hint (golden path from last pulse)
    if (s.exitHint && s.exitHint.path.length) this.drawExitHint(s, t);

    // --- 4. the light
    this.drawLight(game, s, t);

    // --- 5. thread, portal, wisps, player
    this.drawThread(s);
    this.drawPortal(s, t);
    this.drawWisps(s, t);
    this.drawSparksOutsideLight(s, x0, y0, x1, y1, t);
    if (s.status !== "over") this.drawPlayer(game, s, t);

    // --- 6. particles + vignette
    this.drawParticles(s);
    this.drawVignette(s);

    // Death fade.
    if (s.status === "over") {
      ctx.fillStyle = `rgba(8, 6, 18, ${Math.min(0.85, s.clearT * 0.9)})`;
      ctx.fillRect(-40, -40, this.w + 80, this.h + 80);
    }
  }

  private wallPath(m: Maze, x0: number, y0: number, x1: number, y1: number) {
    // Trace every wall in the window as line segments (cell-space).
    const ctx = this.ctx;
    ctx.beginPath();
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const px = this.sx(x), py = this.sy(y);
        const c = this.camera.cell;
        if (!isOpen(m, x, y, N)) { ctx.moveTo(px, py); ctx.lineTo(px + c, py); }
        if (!isOpen(m, x, y, W)) { ctx.moveTo(px, py); ctx.lineTo(px, py + c); }
        if (y === m.rows - 1 && !isOpen(m, x, y, S)) { ctx.moveTo(px, py + c); ctx.lineTo(px + c, py + c); }
        if (x === m.cols - 1 && !isOpen(m, x, y, E)) { ctx.moveTo(px + c, py); ctx.lineTo(px + c, py + c); }
      }
    }
  }

  private drawMemory(s: GameState, x0: number, y0: number, x1: number, y1: number) {
    const ctx = this.ctx;
    const c = this.camera.cell;
    // Floors.
    ctx.fillStyle = PALETTE.memoryFloor;
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        if (s.seen[idx(s.maze, x, y)]) ctx.fillRect(this.sx(x), this.sy(y), c + 0.5, c + 0.5);
      }
    }
    // Walls of seen cells.
    ctx.strokeStyle = PALETTE.memoryWall;
    ctx.lineWidth = Math.max(1.5, c * 0.06);
    ctx.lineCap = "round";
    ctx.beginPath();
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        if (!s.seen[idx(s.maze, x, y)]) continue;
        const px = this.sx(x), py = this.sy(y);
        if (!isOpen(s.maze, x, y, N)) { ctx.moveTo(px, py); ctx.lineTo(px + c, py); }
        if (!isOpen(s.maze, x, y, W)) { ctx.moveTo(px, py); ctx.lineTo(px, py + c); }
        if (!isOpen(s.maze, x, y, S)) { ctx.moveTo(px, py + c); ctx.lineTo(px + c, py + c); }
        if (!isOpen(s.maze, x, y, E)) { ctx.moveTo(px + c, py); ctx.lineTo(px + c, py + c); }
      }
    }
    ctx.stroke();
  }

  private drawFlashes(s: GameState, x0: number, y0: number, x1: number, y1: number) {
    const ctx = this.ctx;
    const c = this.camera.cell;
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const f = s.flash[idx(s.maze, x, y)];
        if (f <= 0.01) continue;
        const px = this.sx(x), py = this.sy(y);
        ctx.fillStyle = `rgba(255, 217, 138, ${f * 0.16})`;
        ctx.fillRect(px, py, c + 0.5, c + 0.5);
        ctx.strokeStyle = `rgba(255, 217, 138, ${f * 0.75})`;
        ctx.lineWidth = Math.max(1.5, c * 0.07);
        ctx.lineCap = "round";
        ctx.beginPath();
        if (!isOpen(s.maze, x, y, N)) { ctx.moveTo(px, py); ctx.lineTo(px + c, py); }
        if (!isOpen(s.maze, x, y, W)) { ctx.moveTo(px, py); ctx.lineTo(px, py + c); }
        if (!isOpen(s.maze, x, y, S)) { ctx.moveTo(px, py + c); ctx.lineTo(px + c, py + c); }
        if (!isOpen(s.maze, x, y, E)) { ctx.moveTo(px + c, py); ctx.lineTo(px + c, py + c); }
        ctx.stroke();
      }
    }
  }

  private drawExitHint(s: GameState, t: number) {
    const ctx = this.ctx;
    const hint = s.exitHint!;
    const alpha = Math.min(1, (3.2 - hint.age) / 0.8) * 0.85;
    if (alpha <= 0) return;
    const c = this.camera.cell;
    ctx.strokeStyle = `rgba(255, 217, 138, ${alpha * 0.7})`;
    ctx.lineWidth = Math.max(2, c * 0.09);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.setLineDash([c * 0.28, c * 0.34]);
    ctx.lineDashOffset = -t * c * 1.4;
    ctx.beginPath();
    hint.path.forEach((cellIdx, i) => {
      const x = this.sx((cellIdx % s.maze.cols) + 0.5);
      const y = this.sy(Math.floor(cellIdx / s.maze.cols) + 0.5);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.setLineDash([]);
  }

  private drawLight(game: Game, s: GameState, t: number) {
    const ctx = this.ctx;
    const c = this.camera.cell;
    if (this.poly.length < 3 || s.status === "over") return;

    const radius = game.lightRadius;
    // Candle flicker — subtle, seeded from the noise table.
    const flicker = this.reducedMotion
      ? 1
      : 0.96 + 0.04 * this.noise[Math.floor(t * 9) % 512] + 0.02 * Math.sin(t * 17);
    const rPx = radius * c * flicker;
    const px = this.sx(s.px), py = this.sy(s.py);

    ctx.save();
    ctx.beginPath();
    this.poly.forEach((p, i) => {
      const x = this.sx(p.x), y = this.sy(p.y);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.clip();

    // Warm pool of light over the floor.
    const g = ctx.createRadialGradient(px, py, 0, px, py, rPx);
    const warmth = 0.5 + 0.5 * s.light;
    g.addColorStop(0, `rgba(255, 190, 110, ${0.34 * warmth})`);
    g.addColorStop(0.45, `rgba(255, 170, 90, ${0.17 * warmth})`);
    g.addColorStop(1, "rgba(255, 150, 70, 0)");
    ctx.fillStyle = PALETTE.litFloor;
    ctx.fillRect(px - rPx, py - rPx, rPx * 2, rPx * 2);
    ctx.fillStyle = g;
    ctx.fillRect(px - rPx, py - rPx, rPx * 2, rPx * 2);

    // Walls inside the light, warm-lit and fading with distance.
    const wx0 = Math.max(0, Math.floor(s.px - radius) - 1);
    const wy0 = Math.max(0, Math.floor(s.py - radius) - 1);
    const wx1 = Math.min(s.maze.cols - 1, Math.ceil(s.px + radius) + 1);
    const wy1 = Math.min(s.maze.rows - 1, Math.ceil(s.py + radius) + 1);
    ctx.lineCap = "round";
    for (let y = wy0; y <= wy1; y++) {
      for (let x = wx0; x <= wx1; x++) {
        const dx = x + 0.5 - s.px, dy = y + 0.5 - s.py;
        const d = Math.sqrt(dx * dx + dy * dy);
        const fade = Math.max(0, 1 - d / radius);
        if (fade <= 0) continue;
        const pxc = this.sx(x), pyc = this.sy(y);
        ctx.strokeStyle = `rgba(232, 201, 138, ${0.25 + fade * 0.75})`;
        ctx.lineWidth = Math.max(2, c * 0.085);
        ctx.beginPath();
        if (!isOpen(s.maze, x, y, N)) { ctx.moveTo(pxc, pyc); ctx.lineTo(pxc + c, pyc); }
        if (!isOpen(s.maze, x, y, W)) { ctx.moveTo(pxc, pyc); ctx.lineTo(pxc, pyc + c); }
        if (!isOpen(s.maze, x, y, S)) { ctx.moveTo(pxc, pyc + c); ctx.lineTo(pxc + c, pyc + c); }
        if (!isOpen(s.maze, x, y, E)) { ctx.moveTo(pxc + c, pyc); ctx.lineTo(pxc + c, pyc + c); }
        ctx.stroke();
      }
    }

    // Sparks inside the light: bright twinkling diamonds.
    for (const sp of s.sparks) {
      if (sp.taken) continue;
      const dx = sp.x + 0.5 - s.px, dy = sp.y + 0.5 - s.py;
      if (dx * dx + dy * dy > radius * radius) continue;
      this.drawSpark(sp.x + 0.5, sp.y + 0.5, t + sp.phase, 1);
    }

    ctx.restore();
  }

  private drawSpark(cx: number, cy: number, t: number, intensity: number) {
    const ctx = this.ctx;
    const c = this.camera.cell;
    const x = this.sx(cx), y = this.sy(cy);
    const pulse = 0.75 + 0.25 * Math.sin(t * 3.1);
    const r = c * 0.13 * pulse;
    const glow = ctx.createRadialGradient(x, y, 0, x, y, r * 4.5);
    glow.addColorStop(0, `rgba(255, 227, 176, ${0.85 * intensity})`);
    glow.addColorStop(1, "rgba(255, 180, 84, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(x - r * 4.5, y - r * 4.5, r * 9, r * 9);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(t * 0.8);
    ctx.fillStyle = `rgba(255, 236, 200, ${intensity})`;
    ctx.beginPath();
    ctx.moveTo(0, -r);
    ctx.quadraticCurveTo(r * 0.22, -r * 0.22, r, 0);
    ctx.quadraticCurveTo(r * 0.22, r * 0.22, 0, r);
    ctx.quadraticCurveTo(-r * 0.22, r * 0.22, -r, 0);
    ctx.quadraticCurveTo(-r * 0.22, -r * 0.22, 0, -r);
    ctx.fill();
    ctx.restore();
  }

  private drawSparksOutsideLight(
    s: GameState, x0: number, y0: number, x1: number, y1: number, t: number
  ) {
    // A faint twinkle in the dark for sparks in already-seen cells.
    for (const sp of s.sparks) {
      if (sp.taken || sp.x < x0 || sp.x > x1 || sp.y < y0 || sp.y > y1) continue;
      if (!s.seen[idx(s.maze, sp.x, sp.y)]) continue;
      const tw = 0.5 + 0.5 * Math.sin((t + sp.phase) * 2.2);
      this.drawSpark(sp.x + 0.5, sp.y + 0.5, t + sp.phase, 0.12 + tw * 0.12);
    }
  }

  private drawThread(s: GameState) {
    if (s.thread.length < 2) return;
    const ctx = this.ctx;
    const c = this.camera.cell;
    ctx.strokeStyle = "rgba(255, 77, 109, 0.5)";
    ctx.lineWidth = Math.max(1.5, c * 0.055);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(this.sx(s.thread[0].x), this.sy(s.thread[0].y));
    for (let i = 1; i < s.thread.length; i++) {
      ctx.lineTo(this.sx(s.thread[i].x), this.sy(s.thread[i].y));
    }
    // Connect to the ember itself.
    ctx.lineTo(this.sx(s.px), this.sy(s.py));
    ctx.stroke();
  }

  private drawPortal(s: GameState, t: number) {
    const ctx = this.ctx;
    const c = this.camera.cell;
    const x = this.sx(s.portal.x + 0.5), y = this.sy(s.portal.y + 0.5);
    if (x < -c * 3 || x > this.w + c * 3 || y < -c * 3 || y > this.h + c * 3) return;

    const breathe = 0.85 + 0.15 * Math.sin(t * 1.7);
    // Beacon glow — visible through the dark, guiding you.
    const halo = ctx.createRadialGradient(x, y, 0, x, y, c * 2.4 * breathe);
    halo.addColorStop(0, "rgba(127, 232, 216, 0.34)");
    halo.addColorStop(0.5, "rgba(127, 232, 216, 0.1)");
    halo.addColorStop(1, "rgba(127, 232, 216, 0)");
    ctx.fillStyle = halo;
    ctx.fillRect(x - c * 2.5, y - c * 2.5, c * 5, c * 5);

    // Swirling rings.
    for (let i = 0; i < 3; i++) {
      const rr = c * (0.16 + i * 0.09) * breathe;
      const a = t * (1.1 - i * 0.25) + (i * Math.PI * 2) / 3;
      ctx.strokeStyle = `rgba(127, 232, 216, ${0.85 - i * 0.22})`;
      ctx.lineWidth = Math.max(1.5, c * 0.045);
      ctx.beginPath();
      ctx.ellipse(x, y, rr, rr * 0.62, a, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.fillStyle = "rgba(213, 255, 248, 0.95)";
    ctx.beginPath();
    ctx.arc(x, y, c * 0.07 * breathe, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawWisps(s: GameState, t: number) {
    const ctx = this.ctx;
    const c = this.camera.cell;
    for (const w of s.wisps) {
      const x = this.sx(w.px), y = this.sy(w.py);
      if (x < -c * 2 || x > this.w + c * 2 || y < -c * 2 || y > this.h + c * 2) continue;
      const stunned = w.stun > 0;
      const wob = Math.sin((t + w.phase) * 5) * c * 0.05;
      const alpha = stunned ? 0.3 : 0.85;
      const glow = ctx.createRadialGradient(x, y + wob, 0, x, y + wob, c * 1.1);
      glow.addColorStop(0, `rgba(157, 123, 255, ${alpha * 0.5})`);
      glow.addColorStop(1, "rgba(157, 123, 255, 0)");
      ctx.fillStyle = glow;
      ctx.fillRect(x - c * 1.1, y + wob - c * 1.1, c * 2.2, c * 2.2);
      ctx.fillStyle = `rgba(209, 190, 255, ${alpha})`;
      ctx.beginPath();
      ctx.arc(x, y + wob, c * 0.13 * (stunned ? 0.7 : 1), 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawPlayer(game: Game, s: GameState, t: number) {
    const ctx = this.ctx;
    const c = this.camera.cell;
    const x = this.sx(s.px), y = this.sy(s.py);
    const blink = s.invuln > 0 && Math.floor(t * 12) % 2 === 0;
    if (blink) return;

    const flick = this.reducedMotion ? 1 : 0.9 + 0.1 * this.noise[Math.floor(t * 13) % 512];
    const r = c * 0.16 * flick * (0.75 + 0.25 * s.light);

    const glow = ctx.createRadialGradient(x, y, 0, x, y, r * 5);
    glow.addColorStop(0, "rgba(255, 227, 176, 0.9)");
    glow.addColorStop(0.4, "rgba(255, 180, 84, 0.35)");
    glow.addColorStop(1, "rgba(255, 180, 84, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(x - r * 5, y - r * 5, r * 10, r * 10);

    // Ember body: teardrop flame leaning into the direction of travel.
    ctx.save();
    ctx.translate(x, y);
    const lean = { up: 0, right: Math.PI / 2, down: Math.PI, left: -Math.PI / 2 }[s.facing];
    ctx.rotate(lean);
    ctx.fillStyle = PALETTE.emberHot;
    ctx.beginPath();
    ctx.moveTo(0, -r * 1.7);
    ctx.quadraticCurveTo(r, -r * 0.4, r * 0.72, r * 0.45);
    ctx.arc(0, r * 0.45, r * 0.72, 0, Math.PI);
    ctx.quadraticCurveTo(-r, -r * 0.4, 0, -r * 1.7);
    ctx.fill();
    ctx.fillStyle = PALETTE.ember;
    ctx.beginPath();
    ctx.arc(0, r * 0.4, r * 0.45, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  private drawParticles(s: GameState) {
    const ctx = this.ctx;
    const c = this.camera.cell;
    const colors: Record<string, string> = {
      ember: "255, 180, 84",
      thread: "255, 77, 109",
      portal: "127, 232, 216",
      wisp: "157, 123, 255",
    };
    for (const p of s.particles) {
      const a = Math.max(0, 1 - p.life / p.max);
      ctx.fillStyle = `rgba(${colors[p.hue]}, ${a * 0.9})`;
      ctx.beginPath();
      ctx.arc(this.sx(p.x), this.sy(p.y), Math.max(0.5, p.size * c * a), 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawVignette(s: GameState) {
    const ctx = this.ctx;
    const g = ctx.createRadialGradient(
      this.w / 2, this.h / 2, Math.min(this.w, this.h) * 0.32,
      this.w / 2, this.h / 2, Math.max(this.w, this.h) * 0.72
    );
    // The vignette closes in as your light fades — the dark leaning closer.
    const press = 0.42 + (1 - s.light) * 0.3;
    g.addColorStop(0, "rgba(8, 6, 18, 0)");
    g.addColorStop(1, `rgba(8, 6, 18, ${press})`);
    ctx.fillStyle = g;
    ctx.fillRect(-40, -40, this.w + 80, this.h + 80);
  }
}
