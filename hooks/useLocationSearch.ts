import { searchPhilippineLocations } from "@/services/openMeteo";
import type { GeocodedLocation } from "@/services/types";
import { useEffect, useState } from "react";

interface LocationSearchState {
  results: GeocodedLocation[];
  isLoading: boolean;
  error: Error | null;
  clearResults: () => void;
}

export function useLocationSearch(query: string): LocationSearchState {
  const [results, setResults] = useState<GeocodedLocation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    const controller = new AbortController();
    setResults([]);
    setIsLoading(true);
    let timedOut = false;
    const timeoutId = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, 10000);
    const timer = setTimeout(() => {
      setIsLoading(true);
      setError(null);
      searchPhilippineLocations(trimmed, controller.signal)
        .then((locations) => {
          setResults(locations);
          setIsLoading(false);
        })
        .catch((err) => {
          if (controller.signal.aborted) {
            if (timedOut) {
              setError(
                new Error(
                  "Search timed out. Check your connection and try again.",
                ),
              );
              setIsLoading(false);
            }
            return;
          }
          setError(err instanceof Error ? err : new Error("Search failed."));
          setIsLoading(false);
        });
    }, 800);

    return () => {
      clearTimeout(timer);
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [query]);

  const clearResults = () => {
    setResults([]);
    setIsLoading(false);
    setError(null);
  };

  return { results, isLoading, error, clearResults };
}
