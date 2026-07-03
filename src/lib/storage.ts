/** localStorage persistence, guarded for SSR and private-mode failures. */

export interface JourneyBest {
  level: number;
  score: number;
}

export interface DailyResult {
  score: number;
  sparks: number;
  sparksTotal: number;
  timeSeconds: number;
  survived: boolean;
}

function read<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or blocked — the game still plays.
  }
}

export const storage = {
  journeyBest: (): JourneyBest | null => read<JourneyBest>("mazing:journey-best"),
  saveJourneyBest(level: number, score: number) {
    const best = storage.journeyBest();
    if (!best || score > best.score) write("mazing:journey-best", { level, score });
  },
  dailyResult: (key: string): DailyResult | null => read<DailyResult>(`mazing:daily:${key}`),
  saveDailyResult(key: string, result: DailyResult) {
    write(`mazing:daily:${key}`, result);
  },
  muted: (): boolean => read<boolean>("mazing:muted") ?? false,
  saveMuted(muted: boolean) {
    write("mazing:muted", muted);
  },
};
