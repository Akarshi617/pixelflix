import { useEffect, useRef } from "react";

/**
 * Watches a "sentinel" element with an IntersectionObserver. When that
 * element scrolls into view, `onIntersect` fires — this is how we trigger
 * "fetch page N+1" without a Next/Prev button.
 *
 * Returns a ref to attach to the sentinel element (an empty div placed at
 * the bottom of the grid).
 *
 * @param {Function} onIntersect - called when the sentinel enters the viewport
 * @param {Object} options
 * @param {boolean} options.enabled - set false to pause observing (e.g.
 *   while a fetch is already in flight, or once hasMore is false)
 * @param {string} options.rootMargin - how far before the sentinel is
 *   visually in view to fire early; default starts loading a bit before
 *   the user actually hits the bottom
 * @param {number} options.threshold - fraction of the sentinel that must
 *   be visible before firing (0–1)
 */
export function useInfiniteScroll(
  onIntersect,
  { enabled = true, rootMargin = "300px", threshold = 0 } = {}
) {
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
      { rootMargin, threshold }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [enabled, rootMargin, threshold]);

  return sentinelRef;
}
