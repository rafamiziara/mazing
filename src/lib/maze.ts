/**
 * Maze generation and graph queries.
 *
 * Three generators with distinct "textures":
 *  - backtracker: long, winding corridors (river-like)
 *  - prim:        short, branchy passages (organic frost)
 *  - kruskal:     uniform, evenly tangled
 *
 * Plus braiding (removing dead ends) to introduce loops at higher levels,
 * and BFS utilities used by the echo pulse, spark placement and wisp AI.
 */
import { Rng, shuffle, randInt } from "./rng";

export const N = 1, S = 2, E = 4, W = 8;
export const DIRS = [
  { bit: N, dx: 0, dy: -1, opp: S },
  { bit: S, dx: 0, dy: 1, opp: N },
  { bit: E, dx: 1, dy: 0, opp: W },
  { bit: W, dx: -1, dy: 0, opp: E },
] as const;

export type Algorithm = "backtracker" | "prim" | "kruskal";

export interface Maze {
  cols: number;
  rows: number;
  /** Bitmask of open passages per cell (N|S|E|W). */
  cells: Uint8Array;
  algorithm: Algorithm;
}

export const idx = (m: Maze, x: number, y: number) => y * m.cols + x;
export const inBounds = (m: Maze, x: number, y: number) =>
  x >= 0 && y >= 0 && x < m.cols && y < m.rows;
export const isOpen = (m: Maze, x: number, y: number, bit: number) =>
  (m.cells[idx(m, x, y)] & bit) !== 0;

function carve(m: Maze, x: number, y: number, dir: (typeof DIRS)[number]) {
  m.cells[idx(m, x, y)] |= dir.bit;
  m.cells[idx(m, x + dir.dx, y + dir.dy)] |= dir.opp;
}

function generateBacktracker(m: Maze, rng: Rng) {
  const visited = new Uint8Array(m.cols * m.rows);
  const stack: [number, number][] = [[randInt(rng, 0, m.cols - 1), randInt(rng, 0, m.rows - 1)]];
  visited[idx(m, stack[0][0], stack[0][1])] = 1;
  while (stack.length) {
    const [x, y] = stack[stack.length - 1];
    const options = DIRS.filter(
      (d) => inBounds(m, x + d.dx, y + d.dy) && !visited[idx(m, x + d.dx, y + d.dy)]
    );
    if (!options.length) {
      stack.pop();
      continue;
    }
    const d = options[Math.floor(rng() * options.length)];
    carve(m, x, y, d);
    visited[idx(m, x + d.dx, y + d.dy)] = 1;
    stack.push([x + d.dx, y + d.dy]);
  }
}

function generatePrim(m: Maze, rng: Rng) {
  const inMaze = new Uint8Array(m.cols * m.rows);
  const frontier: [number, number, (typeof DIRS)[number]][] = [];
  const sx = randInt(rng, 0, m.cols - 1);
  const sy = randInt(rng, 0, m.rows - 1);
  inMaze[idx(m, sx, sy)] = 1;
  const addFrontier = (x: number, y: number) => {
    for (const d of DIRS) {
      if (inBounds(m, x + d.dx, y + d.dy) && !inMaze[idx(m, x + d.dx, y + d.dy)]) {
        frontier.push([x, y, d]);
      }
    }
  };
  addFrontier(sx, sy);
  while (frontier.length) {
    const i = Math.floor(rng() * frontier.length);
    const [x, y, d] = frontier[i];
    frontier[i] = frontier[frontier.length - 1];
    frontier.pop();
    const nx = x + d.dx, ny = y + d.dy;
    if (inMaze[idx(m, nx, ny)]) continue;
    carve(m, x, y, d);
    inMaze[idx(m, nx, ny)] = 1;
    addFrontier(nx, ny);
  }
}

function generateKruskal(m: Maze, rng: Rng) {
  const parent = new Int32Array(m.cols * m.rows);
  for (let i = 0; i < parent.length; i++) parent[i] = i;
  const find = (i: number): number => {
    while (parent[i] !== i) {
      parent[i] = parent[parent[i]];
      i = parent[i];
    }
    return i;
  };
  const edges: [number, number, (typeof DIRS)[number]][] = [];
  for (let y = 0; y < m.rows; y++) {
    for (let x = 0; x < m.cols; x++) {
      if (x < m.cols - 1) edges.push([x, y, DIRS[2]]); // E
      if (y < m.rows - 1) edges.push([x, y, DIRS[1]]); // S
    }
  }
  shuffle(rng, edges);
  for (const [x, y, d] of edges) {
    const a = find(idx(m, x, y));
    const b = find(idx(m, x + d.dx, y + d.dy));
    if (a !== b) {
      parent[a] = b;
      carve(m, x, y, d);
    }
  }
}

/** Remove a fraction of dead ends by knocking a wall through, creating loops. */
function braid(m: Maze, rng: Rng, fraction: number) {
  if (fraction <= 0) return;
  const deadEnds: [number, number][] = [];
  for (let y = 0; y < m.rows; y++) {
    for (let x = 0; x < m.cols; x++) {
      const c = m.cells[idx(m, x, y)];
      const openings = ((c & N) && 1 || 0) + ((c & S) && 1 || 0) + ((c & E) && 1 || 0) + ((c & W) && 1 || 0);
      if (openings === 1) deadEnds.push([x, y]);
    }
  }
  shuffle(rng, deadEnds);
  const target = Math.floor(deadEnds.length * fraction);
  for (let i = 0; i < target; i++) {
    const [x, y] = deadEnds[i];
    const walls = DIRS.filter(
      (d) => inBounds(m, x + d.dx, y + d.dy) && !isOpen(m, x, y, d.bit)
    );
    if (walls.length) carve(m, x, y, walls[Math.floor(rng() * walls.length)]);
  }
}

export function generateMaze(
  cols: number,
  rows: number,
  rng: Rng,
  algorithm: Algorithm,
  braidFraction = 0
): Maze {
  const m: Maze = { cols, rows, cells: new Uint8Array(cols * rows), algorithm };
  if (algorithm === "backtracker") generateBacktracker(m, rng);
  else if (algorithm === "prim") generatePrim(m, rng);
  else generateKruskal(m, rng);
  braid(m, rng, braidFraction);
  return m;
}

/** BFS distance field from (sx, sy). Unreached cells stay -1. */
export function distanceField(m: Maze, sx: number, sy: number): Int32Array {
  const dist = new Int32Array(m.cols * m.rows).fill(-1);
  const queue = new Int32Array(m.cols * m.rows);
  let head = 0, tail = 0;
  dist[idx(m, sx, sy)] = 0;
  queue[tail++] = idx(m, sx, sy);
  while (head < tail) {
    const cur = queue[head++];
    const x = cur % m.cols, y = (cur / m.cols) | 0;
    for (const d of DIRS) {
      if (!(m.cells[cur] & d.bit)) continue;
      const ni = idx(m, x + d.dx, y + d.dy);
      if (dist[ni] === -1) {
        dist[ni] = dist[cur] + 1;
        queue[tail++] = ni;
      }
    }
  }
  return dist;
}

/** Shortest path from (sx,sy) to (tx,ty) as a list of cell indices. */
export function shortestPath(m: Maze, sx: number, sy: number, tx: number, ty: number): number[] {
  const dist = distanceField(m, tx, ty);
  if (dist[idx(m, sx, sy)] === -1) return [];
  const path: number[] = [idx(m, sx, sy)];
  let x = sx, y = sy;
  while (x !== tx || y !== ty) {
    for (const d of DIRS) {
      if (!isOpen(m, x, y, d.bit)) continue;
      const ni = idx(m, x + d.dx, y + d.dy);
      if (dist[ni] === dist[idx(m, x, y)] - 1) {
        x += d.dx;
        y += d.dy;
        path.push(ni);
        break;
      }
    }
  }
  return path;
}

/** The cell with the greatest BFS distance from (sx, sy). */
export function farthestCell(m: Maze, sx: number, sy: number): { x: number; y: number; dist: number } {
  const dist = distanceField(m, sx, sy);
  let best = 0, bi = 0;
  for (let i = 0; i < dist.length; i++) {
    if (dist[i] > best) {
      best = dist[i];
      bi = i;
    }
  }
  return { x: bi % m.cols, y: (bi / m.cols) | 0, dist: best };
}

/** Dead-end cells sorted by distance from (sx,sy), farthest first. */
export function deadEnds(m: Maze, sx: number, sy: number): { x: number; y: number; dist: number }[] {
  const dist = distanceField(m, sx, sy);
  const out: { x: number; y: number; dist: number }[] = [];
  for (let y = 0; y < m.rows; y++) {
    for (let x = 0; x < m.cols; x++) {
      const c = m.cells[idx(m, x, y)];
      const openings = ((c & N) && 1 || 0) + ((c & S) && 1 || 0) + ((c & E) && 1 || 0) + ((c & W) && 1 || 0);
      if (openings === 1) out.push({ x, y, dist: dist[idx(m, x, y)] });
    }
  }
  out.sort((a, b) => b.dist - a.dist);
  return out;
}

/**
 * Wall segments of the maze in cell-space coordinates (1 unit = 1 cell),
 * restricted to a cell rectangle, with collinear runs merged. Used by the
 * visibility polygon, so fewer segments means faster frames.
 */
export function wallSegments(
  m: Maze,
  x0: number,
  y0: number,
  x1: number,
  y1: number
): { ax: number; ay: number; bx: number; by: number }[] {
  x0 = Math.max(0, x0); y0 = Math.max(0, y0);
  x1 = Math.min(m.cols - 1, x1); y1 = Math.min(m.rows - 1, y1);
  const segs: { ax: number; ay: number; bx: number; by: number }[] = [];

  // A wall lies on boundary line y (between rows y-1 and y) at column x when
  // the adjacent cell has that passage closed. Merge consecutive closed
  // columns into one segment.
  const hWall = (x: number, y: number) =>
    y === 0 ? !isOpen(m, x, 0, N)
    : y === m.rows ? !isOpen(m, x, m.rows - 1, S)
    : !isOpen(m, x, y, N);
  for (let y = y0; y <= y1 + 1; y++) {
    let runStart = -1;
    for (let x = x0; x <= x1 + 1; x++) {
      const closed = x <= x1 && hWall(x, y);
      if (closed && runStart === -1) runStart = x;
      if (!closed && runStart !== -1) {
        segs.push({ ax: runStart, ay: y, bx: x, by: y });
        runStart = -1;
      }
    }
    if (runStart !== -1) segs.push({ ax: runStart, ay: y, bx: x1 + 1, by: y });
  }

  const vWall = (x: number, y: number) =>
    x === 0 ? !isOpen(m, 0, y, W)
    : x === m.cols ? !isOpen(m, m.cols - 1, y, E)
    : !isOpen(m, x, y, W);
  for (let x = x0; x <= x1 + 1; x++) {
    let runStart = -1;
    for (let y = y0; y <= y1 + 1; y++) {
      const closed = y <= y1 && vWall(x, y);
      if (closed && runStart === -1) runStart = y;
      if (!closed && runStart !== -1) {
        segs.push({ ax: x, ay: runStart, bx: x, by: y });
        runStart = -1;
      }
    }
    if (runStart !== -1) segs.push({ ax: x, ay: runStart, bx: x, by: y1 + 1 });
  }
  return segs;
}
