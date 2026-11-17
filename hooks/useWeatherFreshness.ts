import { useEffect, useRef, useState } from "react";

/**
 * Freshness UI state for the weather header: the transient "Up to date"
 * confirmation shown after a manual refresh finds nothing new to fetch.
 */
export function useWeatherFreshness() {
  const [upToDate, setUpToDate] = useState(false);
  const upToDateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (upToDateTimerRef.current) clearTimeout(upToDateTimerRef.current);
    },
    [],
  );

  const markUpToDate = () => {
    setUpToDate(true);
    if (upToDateTimerRef.current) clearTimeout(upToDateTimerRef.current);
    upToDateTimerRef.current = setTimeout(() => setUpToDate(false), 2000);
  };

  return { upToDate, markUpToDate };
}
