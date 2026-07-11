import { useEffect, useRef } from "react";

/**
 * Watches a "sentinel" element with an IntersectionObserver. When that
 * element scrolls into view, `onIntersect` fires — this is how we trigger
 * "fetch page N+1" without a Next/Prev button.
 *
 * Returns a ref to attach to the sentinel element (an empty div placed at
 * the bottom of the grid).
 */
export function useInfiniteScroll(onIntersect, { enabled = true } = {}) {
  const sentinelRef = useRef(null);

  // keep the latest callback in a ref so the observer below doesn't need to
  // be torn down and recreated every time the parent re-renders
  const callbackRef = useRef(onIntersect);
  useEffect(() => {
    callbackRef.current = onIntersect;
  }, [onIntersect]);

  useEffect(() => {
    if (!enabled) return;

    const node = sentinelRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          callbackRef.current();
        }
      },
      { rootMargin: "300px" } // start loading a bit before it's fully visible
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [enabled]);

  return sentinelRef;
}
