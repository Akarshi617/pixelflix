import { useEffect, useState } from "react";

/**
 * Returns a "debounced" copy of `value` that only updates after `delay` ms
 * have passed without the value changing. Used to stop the search bar from
 * firing an API request on every keystroke.
 */
export function useDebounce(value, delay = 500) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // if `value` changes before the timer fires, cancel the old timer
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
