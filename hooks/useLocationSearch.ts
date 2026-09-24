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
    const timer = setTimeout(() => {
      setIsLoading(true);
      setError(null);
      searchPhilippineLocations(trimmed, controller.signal)
        .then((locations) => {
          setResults(locations);
          setIsLoading(false);
        })
        .catch((err) => {
          if (controller.signal.aborted) return;
          setError(err instanceof Error ? err : new Error("Search failed."));
          setIsLoading(false);
        });
    }, 300);

    return () => {
      clearTimeout(timer);
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
