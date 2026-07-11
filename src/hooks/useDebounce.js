import { useEffect, useState } from "react";

/**
 * Returns a "debounced" copy of `value` that only updates after `delay` ms
 * have passed without the value changing. Used to stop the search bar from
 * firing an API request on every keystroke.
 *
 * Also returns `isPending` — true while waiting for the debounce timer to
 * settle. Handy for showing a subtle "typing..." indicator in the search
 * bar instead of a full loading spinner every keystroke.
 */
export function useDebounce(value, delay = 500) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    setIsPending(true);

    const timer = setTimeout(() => {
      setDebouncedValue(value);
      setIsPending(false);
    }, delay);

    // if `value` changes before the timer fires, cancel the old timer
    return () => clearTimeout(timer);
  }, [value, delay]);

  return [debouncedValue, isPending];
}
