import { useState, useEffect } from 'react';

/**
 * Debounces a value — returns the value only after `delay` ms of no changes.
 * Prevents running expensive operations on every keystroke.
 */
export function useDebounce<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState<T>(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}
