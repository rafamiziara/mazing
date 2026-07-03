"use client";

/**
 * Client-only bits of the landing page that read localStorage and the
 * local date (daily number). Rendered as null on the server and on the
 * first client paint, so hydration stays stable.
 */
import { useSyncExternalStore } from "react";
import { storage } from "@/lib/storage";
import { dailyKey, dailyNumber } from "@/lib/rng";

const emptySubscribe = () => () => {};
/** True after hydration, false during SSR — without effect-driven state. */
function useMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

export function DailyBadge() {
  const mounted = useMounted();
  const done = mounted && !!storage.dailyResult(dailyKey())?.survived;
  return (
    <span>
      Daily maze{mounted ? ` #${dailyNumber()}` : ""}
      {done && <span className="ml-2 text-portal">✓</span>}
    </span>
  );
}

export default function BestStats() {
  const mounted = useMounted();
  const best = mounted ? storage.journeyBest() : null;
  const daily = mounted ? storage.dailyResult(dailyKey()) : null;

  if (!best && !daily) return null;
  return (
    <p className="font-mono text-[11px] tracking-widest text-parchment/45 uppercase">
      {best && (
        <span>
          deepest descent · level {best.level} ·{" "}
          {best.score.toLocaleString("en-US")} pts
        </span>
      )}
      {best && daily && <span className="mx-3 opacity-40">|</span>}
      {daily && (
        <span className="text-portal/70">
          today · ✦ {daily.sparks}/{daily.sparksTotal} ·{" "}
          {daily.score.toLocaleString("en-US")} pts
        </span>
      )}
    </p>
  );
}
