// useDebouncedCallback.js
import { useRef, useEffect, useCallback } from "react";

export default function useDebouncedCallback(fn, delay = 500) {
  const timeoutRef = useRef(null);
  const fnRef = useRef(fn);

  useEffect(() => { fnRef.current = fn; }, [fn]);

  const debounced = useCallback((...args) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => fnRef.current(...args), delay);
  }, [delay]);

  useEffect(() => () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); }, []);
  return debounced;
}
