import { useCallback, useState } from "react";

const MIN_QUERY_LENGTH = 2;

interface Options {
  /** minimum query length before a dropdown shows its results */
  minQueryLength?: number;
}

/**
 * Search input state for the weather screen's two search bars (Locations and
 * Observations): the queries, which dropdown is open, the derived result
 * visibility, and the onChange handlers that open their dropdown on typing.
 */
export function useSearchInputs({
  minQueryLength = MIN_QUERY_LENGTH,
}: Options = {}) {
  const [locationQuery, setLocationQuery] = useState("");
  const [observationQuery, setObservationQuery] = useState("");
  const [locOpen, setLocOpen] = useState(false);
  const [obsOpen, setObsOpen] = useState(false);

  const handleLocationQueryChange = useCallback((text: string) => {
    setLocationQuery(text);
    setLocOpen(true);
  }, []);

  const handleObservationQueryChange = useCallback((text: string) => {
    setObservationQuery(text);
    setObsOpen(true);
  }, []);

  return {
    locationQuery,
    observationQuery,
    setLocationQuery,
    setObservationQuery,
    setLocOpen,
    setObsOpen,
    showResults: locOpen && locationQuery.trim().length >= minQueryLength,
    showObsResults: obsOpen && observationQuery.trim().length >= minQueryLength,
    handleLocationQueryChange,
    handleObservationQueryChange,
  };
}
