/**
 * Game simulation for mazing.
 *
 * The rules in one breath: you are an ember of light in a dark labyrinth.
 * Your light *is* your life — it gutters steadily, and sparks refuel it.
 * A red thread traces everywhere you have walked. The echo pulse floods the
 * corridors with a BFS wavefront that briefly reveals the way. Reach the
 * portal before the dark takes you; each level is deeper, larger, stranger.
 */
import {
  Maze,
  Algorithm,
  generateMaze,
  distanceField,
  farthestCell,
  deadEnds,
  shortestPath,
  isOpen,
  idx,
  DIRS,
  N, S, E, W,
} from "./maze";
import { mulberry32, hashSeed, Rng, shuffle } from "./rng";

export type Dir = "up" | "down" | "left" | "right";
export type Mode = "journey" | "daily";
export type Status = "playing" | "clear" | "over" | "won";

export type GameEvent =
  | "step" | "spark" | "charge" | "pulse" | "hit"
  | "portal" | "death" | "lowlight" | "levelstart";

const DIR_VEC: Record<Dir, { dx: number; dy: number; bit: number }> = {
  up: { dx: 0, dy: -1, bit: N },
  down: { dx: 0, dy: 1, bit: S },
  left: { dx: -1, dy: 0, bit: W },
  right: { dx: 1, dy: 0, bit: E },
};

export interface Spark {
  x: number;
  y: number;
  taken: boolean;
  phase: number;
}

export interface Wisp {
  px: number; py: number;          // continuous position (cell units)
  fx: number; fy: number;          // from cell
  tx: number; ty: number;          // to cell
  t: number;                       // tween progress 0..1
  speed: number;
  stun: number;                    // seconds of stun remaining
  phase: number;
}

export interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  life: number; max: number;
  size: number;
  hue: "ember" | "thread" | "portal" | "wisp";
}

export interface Wave {
  field: Int32Array;
  age: number;      // seconds since fired
  maxDist: number;
  speed: number;    // cells per second
}

export interface GameState {
  mode: Mode;
  seedLabel: string;
  level: number;
  maze: Maze;
  algorithm: Algorithm;

  // Player
  px: number; py: number;          // continuous, cell units (center of cell = +0.5)
  cx: number; cy: number;          // current cell
  moving: boolean;
  moveFrom: { x: number; y: number };
  moveTo: { x: number; y: number };
  moveT: number;
  facing: Dir;

  light: number;                   // 0..1, your life
  drainPerSec: number;
  score: number;
  sparksTotal: number;
  sparksTaken: number;
  pulses: number;
  sparksSincePulse: number;

  sparks: Spark[];
  wisps: Wisp[];
  portal: { x: number; y: number; phase: number };

  thread: { x: number; y: number }[];   // Ariadne's thread — visited cell centers
  seen: Uint8Array;                     // cells ever illuminated
  flash: Float32Array;                  // transient pulse-wave glow per cell
  waves: Wave[];
  exitHint: { path: number[]; age: number } | null;

  particles: Particle[];
  shake: number;
  invuln: number;
  time: number;                    // seconds in current level
  totalTime: number;
  status: Status;
  clearT: number;                  // seconds since clear/death for animations
  deathCause: "dark" | null;
}

export interface LevelSpec {
  cols: number; rows: number;
  algorithm: Algorithm;
  braid: number;
  sparks: number;
  wisps: number;
  lightSeconds: number;
}

export function journeySpec(level: number): LevelSpec {
  const algorithms: Algorithm[] = ["backtracker", "prim", "kruskal"];
  return {
    cols: Math.min(13 + (level - 1) * 2, 35),
    rows: Math.min(9 + (level - 1) * 2, 25),
    algorithm: algorithms[(level - 1) % 3],
    braid: Math.min(0.08 * Math.max(0, level - 2), 0.4),
    sparks: Math.min(5 + level, 16),
    wisps: level >= 3 ? Math.min(level - 2, 6) : 0,
    lightSeconds: Math.max(58 - level * 2, 30),
  };
}

export const DAILY_SPEC: LevelSpec = {
  cols: 27, rows: 19,
  algorithm: "backtracker",
  braid: 0.15,
  sparks: 14,
  wisps: 3,
  lightSeconds: 55,
};

const PLAYER_SPEED = 6.2;          // cells per second
const WAVE_SPEED = 13;
const WAVE_RANGE = 16;
const SPARK_REFILL = 0.24;
const HIT_COST = 0.16;
const SPARKS_PER_CHARGE = 3;
const LIGHT_RADIUS = 5.4;          // in cells — how far your light reaches

export class Game {
  state: GameState;
  private rng: Rng;
  private held: Dir[] = [];        // most recent last
  private queued: Dir | null = null; // buffered tap, consumed by the next move
  private playerField: Int32Array | null = null;
  private playerFieldAge = 0;
  private lowLightWarned = false;
  onEvent: (e: GameEvent) => void = () => {};

  constructor(mode: Mode, seedLabel: string) {
    this.rng = mulberry32(hashSeed(seedLabel));
    this.state = this.buildLevel(mode, seedLabel, 1, 0, 0);
  }

  get lightRadius(): number {
    // The circle of light breathes with your remaining life.
    return LIGHT_RADIUS * (0.45 + 0.55 * this.state.light);
  }

  private buildLevel(
    mode: Mode,
    seedLabel: string,
    level: number,
    carryScore: number,
    carryTime: number
  ): GameState {
    const spec = mode === "daily" ? DAILY_SPEC : journeySpec(level);
    const rng = this.rng ?? mulberry32(hashSeed(seedLabel));
    const maze = generateMaze(spec.cols, spec.rows, rng, spec.algorithm, spec.braid);

    const startX = 0;
    const startY = spec.rows - 1;
    const portal = farthestCell(maze, startX, startY);

    // Sparks live in dead ends and far corners — exploration pays.
    const ends = deadEnds(maze, startX, startY).filter(
      (c) => !(c.x === portal.x && c.y === portal.y) && !(c.x === startX && c.y === startY)
    );
    const sparkCells = ends.slice(0, spec.sparks);
    if (sparkCells.length < spec.sparks) {
      // Braided mazes have few dead ends; fill from random distant cells.
      const dist = distanceField(maze, startX, startY);
      const candidates: { x: number; y: number; dist: number }[] = [];
      for (let y = 0; y < maze.rows; y++) {
        for (let x = 0; x < maze.cols; x++) {
          if ((x === portal.x && y === portal.y) || (x === startX && y === startY)) continue;
          if (sparkCells.some((c) => c.x === x && c.y === y)) continue;
          candidates.push({ x, y, dist: dist[idx(maze, x, y)] });
        }
      }
      shuffle(rng, candidates);
      sparkCells.push(...candidates.slice(0, spec.sparks - sparkCells.length));
    }

    // Wisps spawn far from the player.
    const dist = distanceField(maze, startX, startY);
    const wisps: Wisp[] = [];
    const wispCells: { x: number; y: number; dist: number }[] = [];
    for (let y = 0; y < maze.rows; y++) {
      for (let x = 0; x < maze.cols; x++) {
        const d = dist[idx(maze, x, y)];
        if (d > 8 && !(x === portal.x && y === portal.y)) wispCells.push({ x, y, dist: d });
      }
    }
    shuffle(rng, wispCells);
    for (let i = 0; i < Math.min(spec.wisps, wispCells.length); i++) {
      const c = wispCells[i];
      wisps.push({
        px: c.x + 0.5, py: c.y + 0.5,
        fx: c.x, fy: c.y, tx: c.x, ty: c.y, t: 1,
        speed: 2.1 + Math.min(level, 10) * 0.09,
        stun: 0,
        phase: rng() * Math.PI * 2,
      });
    }

    return {
      mode,
      seedLabel,
      level,
      maze,
      algorithm: spec.algorithm,
      px: startX + 0.5, py: startY + 0.5,
      cx: startX, cy: startY,
      moving: false,
      moveFrom: { x: startX, y: startY },
      moveTo: { x: startX, y: startY },
      moveT: 0,
      facing: "up",
      light: 1,
      drainPerSec: 1 / spec.lightSeconds,
      score: carryScore,
      sparksTotal: sparkCells.length,
      sparksTaken: 0,
      pulses: 2,
      sparksSincePulse: 0,
      sparks: sparkCells.map((c) => ({ x: c.x, y: c.y, taken: false, phase: rng() * Math.PI * 2 })),
      wisps,
      portal: { x: portal.x, y: portal.y, phase: 0 },
      thread: [{ x: startX + 0.5, y: startY + 0.5 }],
      seen: new Uint8Array(maze.cols * maze.rows),
      flash: new Float32Array(maze.cols * maze.rows),
      waves: [],
      exitHint: null,
      particles: [],
      shake: 0,
      invuln: 0,
      time: 0,
      totalTime: carryTime,
      status: "playing",
      clearT: 0,
      deathCause: null,
    };
  }

  nextLevel() {
    const s = this.state;
    this.state = this.buildLevel(
      s.mode, s.seedLabel, s.level + 1, s.score, s.totalTime + s.time
    );
    this.lowLightWarned = false;
    this.playerField = null;
    this.onEvent("levelstart");
  }

  // ------------------------------------------------------------ input

  press(dir: Dir) {
    if (!this.held.includes(dir)) this.held.push(dir);
    // Remember the tap so quick presses still move one cell even if the
    // key is released before the next simulation frame.
    this.queued = dir;
  }

  release(dir: Dir) {
    this.held = this.held.filter((d) => d !== dir);
  }

  releaseAll() {
    this.held = [];
  }

  firePulse() {
    const s = this.state;
    if (s.status !== "playing" || s.pulses <= 0) return;
    s.pulses--;
    const field = distanceField(s.maze, s.cx, s.cy);
    s.waves.push({ field, age: 0, maxDist: WAVE_RANGE, speed: WAVE_SPEED });
    s.exitHint = {
      path: shortestPath(s.maze, s.cx, s.cy, s.portal.x, s.portal.y),
      age: 0,
    };
    this.onEvent("pulse");
  }

  // ------------------------------------------------------------ update

  update(dt: number) {
    const s = this.state;
    dt = Math.min(dt, 0.05);
    s.portal.phase += dt;
    s.shake = Math.max(0, s.shake - dt * 3.2);
    this.updateParticles(dt);

    if (s.status === "clear" || s.status === "won" || s.status === "over") {
      s.clearT += dt;
      this.updateWaves(dt);
      return;
    }

    s.time += dt;
    s.invuln = Math.max(0, s.invuln - dt);

    // The flame gutters.
    s.light = Math.max(0, s.light - s.drainPerSec * dt);
    if (s.light < 0.25 && !this.lowLightWarned) {
      this.lowLightWarned = true;
      this.onEvent("lowlight");
    }
    if (s.light >= 0.3) this.lowLightWarned = false;
    if (s.light <= 0) {
      s.status = "over";
      s.deathCause = "dark";
      s.clearT = 0;
      this.onEvent("death");
      return;
    }

    this.updatePlayer(dt);
    this.updateWisps(dt);
    this.updateWaves(dt);

    if (s.exitHint) {
      s.exitHint.age += dt;
      if (s.exitHint.age > 3.2) s.exitHint = null;
    }

    // Spark pickup.
    for (const sp of s.sparks) {
      if (sp.taken) continue;
      sp.phase += dt;
      const dx = sp.x + 0.5 - s.px, dy = sp.y + 0.5 - s.py;
      if (dx * dx + dy * dy < 0.3) {
        sp.taken = true;
        s.sparksTaken++;
        s.light = Math.min(1, s.light + SPARK_REFILL);
        s.score += (s.mode === "daily" ? 100 : 25 * s.level);
        s.sparksSincePulse++;
        this.emitBurst(sp.x + 0.5, sp.y + 0.5, "ember", 14);
        this.onEvent("spark");
        if (s.sparksSincePulse >= SPARKS_PER_CHARGE) {
          s.sparksSincePulse = 0;
          s.pulses++;
          this.onEvent("charge");
        }
      }
    }

    // Portal.
    {
      const dx = s.portal.x + 0.5 - s.px, dy = s.portal.y + 0.5 - s.py;
      if (dx * dx + dy * dy < 0.22) {
        const lightBonus = Math.round(s.light * 100) * (s.mode === "daily" ? 10 : s.level);
        const clearBonus = s.mode === "daily" ? Math.max(0, 3000 - Math.round(s.time) * 10) : 100 * s.level;
        s.score += lightBonus + clearBonus;
        s.status = s.mode === "daily" ? "won" : "clear";
        s.clearT = 0;
        this.emitBurst(s.px, s.py, "portal", 40);
        this.onEvent("portal");
      }
    }
  }

  private updatePlayer(dt: number) {
    const s = this.state;
    let remaining = dt * PLAYER_SPEED;

    while (remaining > 0) {
      if (!s.moving) {
        const dir = this.chooseDirection();
        if (!dir) break;
        const v = DIR_VEC[dir];
        s.facing = dir;
        s.moveFrom = { x: s.cx, y: s.cy };
        s.moveTo = { x: s.cx + v.dx, y: s.cy + v.dy };
        s.moveT = 0;
        s.moving = true;
        this.onEvent("step");
      }
      const step = Math.min(remaining, 1 - s.moveT);
      s.moveT += step;
      remaining -= step;
      // Ease the tween slightly for weight without losing responsiveness.
      const t = s.moveT;
      s.px = s.moveFrom.x + (s.moveTo.x - s.moveFrom.x) * t + 0.5;
      s.py = s.moveFrom.y + (s.moveTo.y - s.moveFrom.y) * t + 0.5;
      if (s.moveT >= 1) {
        s.cx = s.moveTo.x;
        s.cy = s.moveTo.y;
        s.moving = false;
        const last = s.thread[s.thread.length - 1];
        if (!last || last.x !== s.cx + 0.5 || last.y !== s.cy + 0.5) {
          s.thread.push({ x: s.cx + 0.5, y: s.cy + 0.5 });
          if (s.thread.length > 4000) s.thread.splice(0, 1000);
        }
      }
    }

    // Ember trail while moving.
    if (s.moving && Math.random() < 0.5) {
      s.particles.push({
        x: s.px + (Math.random() - 0.5) * 0.15,
        y: s.py + (Math.random() - 0.5) * 0.15,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4 - 0.2,
        life: 0, max: 0.5 + Math.random() * 0.4,
        size: 0.04 + Math.random() * 0.05,
        hue: "ember",
      });
    }
  }

  private chooseDirection(): Dir | null {
    const s = this.state;
    // A buffered tap wins once, then most recently pressed held key.
    if (this.queued) {
      const dir = this.queued;
      this.queued = null;
      if (isOpen(s.maze, s.cx, s.cy, DIR_VEC[dir].bit)) return dir;
    }
    for (let i = this.held.length - 1; i >= 0; i--) {
      const dir = this.held[i];
      const v = DIR_VEC[dir];
      if (isOpen(s.maze, s.cx, s.cy, v.bit)) return dir;
    }
    return null;
  }

  private updateWisps(dt: number) {
    const s = this.state;
    if (!s.wisps.length) return;

    // Shared distance-to-player field, refreshed a few times per second.
    this.playerFieldAge += dt;
    if (!this.playerField || this.playerFieldAge > 0.4) {
      this.playerField = distanceField(s.maze, s.cx, s.cy);
      this.playerFieldAge = 0;
    }
    const field = this.playerField;

    for (const w of s.wisps) {
      w.phase += dt;
      if (w.stun > 0) {
        w.stun -= dt;
        continue;
      }
      let remaining = dt * w.speed;
      while (remaining > 0) {
        if (w.t >= 1) {
          w.fx = w.tx; w.fy = w.ty;
          const here = idx(s.maze, w.fx, w.fy);
          const myDist = field[here];
          const options = DIRS.filter((d) => s.maze.cells[here] & d.bit);
          if (!options.length) break;
          // Hunt when close, wander otherwise; avoid doubling back.
          const hunting = myDist > 0 && myDist < 7 && Math.random() < 0.7;
          let choice = options[Math.floor(Math.random() * options.length)];
          if (hunting) {
            const better = options.find(
              (d) => field[idx(s.maze, w.fx + d.dx, w.fy + d.dy)] < myDist
            );
            if (better) choice = better;
          } else if (options.length > 1) {
            const nonReverse = options.filter(
              (d) => !(w.fx + d.dx === w.fx - (w.tx - w.fx) && w.fy + d.dy === w.fy - (w.ty - w.fy))
            );
            const pool = nonReverse.length ? nonReverse : options;
            choice = pool[Math.floor(Math.random() * pool.length)];
          }
          w.tx = w.fx + choice.dx;
          w.ty = w.fy + choice.dy;
          w.t = 0;
        }
        const step = Math.min(remaining, 1 - w.t);
        w.t += step;
        remaining -= step;
        w.px = w.fx + (w.tx - w.fx) * w.t + 0.5;
        w.py = w.fy + (w.ty - w.fy) * w.t + 0.5;
      }

      // Contact drains your light and sends the wisp fleeing.
      const dx = w.px - s.px, dy = w.py - s.py;
      if (dx * dx + dy * dy < 0.32 && s.invuln <= 0) {
        s.light = Math.max(0.02, s.light - HIT_COST);
        s.invuln = 1.4;
        s.shake = 1;
        w.stun = 1.8;
        this.emitBurst(s.px, s.py, "wisp", 18);
        this.onEvent("hit");
      }
    }
  }

  private updateWaves(dt: number) {
    const s = this.state;
    for (const w of s.waves) w.age += dt;
    s.waves = s.waves.filter((w) => w.age * w.speed < w.maxDist + 4);

    // Pulse waves stun wisps they wash over.
    for (const w of s.waves) {
      const radius = w.age * w.speed;
      for (const wisp of s.wisps) {
        const d = w.field[idx(s.maze, Math.floor(wisp.px), Math.floor(wisp.py))];
        if (d >= 0 && Math.abs(d - radius) < 0.8 && wisp.stun <= 0) {
          wisp.stun = 2.2;
        }
      }
    }

    // Flash decay.
    for (let i = 0; i < s.flash.length; i++) {
      if (s.flash[i] > 0) s.flash[i] = Math.max(0, s.flash[i] - dt * 0.55);
    }
    // Waves light cells up as the front passes and mark them as seen.
    for (const w of s.waves) {
      const radius = w.age * w.speed;
      for (let i = 0; i < w.field.length; i++) {
        const d = w.field[i];
        if (d >= 0 && d <= Math.min(radius, w.maxDist) && d > radius - 2.5) {
          s.flash[i] = Math.max(s.flash[i], 1);
          s.seen[i] = 1;
        }
      }
    }
  }

  private updateParticles(dt: number) {
    const s = this.state;
    for (const p of s.particles) {
      p.life += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 1 - dt * 1.5;
      p.vy *= 1 - dt * 1.5;
    }
    s.particles = s.particles.filter((p) => p.life < p.max);
  }

  private emitBurst(x: number, y: number, hue: Particle["hue"], count: number) {
    const s = this.state;
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const speed = 0.5 + Math.random() * 2.2;
      s.particles.push({
        x, y,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed,
        life: 0, max: 0.4 + Math.random() * 0.6,
        size: 0.03 + Math.random() * 0.06,
        hue,
      });
    }
  }
}
