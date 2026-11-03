import React, { useRef, useState } from "react";
import { ArrowDown, Loader2 } from "lucide-react";

const THRESHOLD = 64;
const MAX_PULL = 104;
const RESISTANCE = 0.5;

/**
 * Touch pull-to-refresh for mobile screens.
 *
 * Only engages when the window is scrolled to the very top, so it never
 * interferes with normal scrolling. The gesture is purely additive: the
 * content is translated while pulling and snapped back afterwards, and the
 * page keeps rendering whatever its own loading states dictate.
 */
export default function PullToRefresh({ onRefresh, children, disabled = false, label = "Refreshing…" }) {
  const [pull, setPull] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const tracking = useRef(false);

  const begin = (event) => {
    if (disabled || refreshing) return;
    if (typeof window !== "undefined" && window.scrollY > 0) return;
    startY.current = event.touches?.[0]?.clientY ?? 0;
    tracking.current = true;
  };

  const move = (event) => {
    if (!tracking.current) return;
    const delta = (event.touches?.[0]?.clientY ?? startY.current) - startY.current;
    if (delta <= 0) {
      setDragging(false);
      setPull(0);
      return;
    }
    if (typeof window !== "undefined" && window.scrollY > 0) {
      tracking.current = false;
      setDragging(false);
      setPull(0);
      return;
    }
    setDragging(true);
    setPull(Math.min(MAX_PULL, delta * RESISTANCE));
  };

  const end = async () => {
    if (!tracking.current) return;
    tracking.current = false;
    setDragging(false);
    if (pull < THRESHOLD) {
      setPull(0);
      return;
    }
    setPull(THRESHOLD + 10);
    setRefreshing(true);
    try {
      await onRefresh?.();
    } finally {
      setRefreshing(false);
      setPull(0);
    }
  };

  const ready = pull >= THRESHOLD;

  return (
    <div
      className="relative touch-pan-y"
      onTouchStart={begin}
      onTouchMove={move}
      onTouchEnd={end}
      onTouchCancel={end}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-center"
        style={{ height: Math.max(0, pull - 8), opacity: pull > 12 ? 1 : 0 }}
        aria-hidden={!refreshing}
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-sm">
          {refreshing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ArrowDown
              className="h-4 w-4 transition-transform"
              style={{ transform: ready ? "rotate(180deg)" : "none" }}
            />
          )}
        </div>
      </div>

      <div
        style={{
          transform: `translateY(${pull}px)`,
          transition: dragging ? "none" : "transform 220ms cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        {children}
      </div>

      <p className="sr-only" role="status" aria-live="polite">
        {refreshing ? label : ""}
      </p>
    </div>
  );
}