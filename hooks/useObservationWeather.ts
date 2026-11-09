import {
  REFRESH_INTERVAL_MS,
  REQUEST_TIMEOUT_MS,
} from "@/hooks/useWeather";
import { fetchWeather } from "@/services/openMeteo";
import type { SavedLocation, WeatherInfo } from "@/services/types";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";

interface Options {
  selectedObservation: SavedLocation | null;
  /** cached saved-location weather, when the observation is also a saved location */
  savedObsWeather: WeatherInfo | undefined;
  /** stored snapshot weather from the persisted observation selection */
  storedWeather: WeatherInfo | null;
  obsFetchedAt: number | null;
  selectObservation: (
    location: SavedLocation,
    weather: WeatherInfo | null,
    weatherFetchedAt?: number | null,
  ) => void;
}

/**
 * Weather pipeline for the observation card: fetches (with timeout + abort),
 * honors the staleness rule, keeps the previous snapshot rendered during a
 * background refresh, and re-checks on focus via a re-scheduling timer.
 */
export function useObservationWeather({
  selectedObservation,
  savedObsWeather,
  storedWeather,
  obsFetchedAt,
  selectObservation,
}: Options): {
  snapshot: { id: number; info: WeatherInfo } | null;
  isFetching: boolean;
  error: Error | null;
} {
  const [snapshot, setSnapshot] = useState<{
    id: number;
    info: WeatherInfo;
  } | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Internal clock for staleness re-checks, driven by focus and the refresh
  // cadence. Never read outside this hook.
  const [now, setNow] = useState(Date.now());
  useFocusEffect(
    useCallback(() => {
      let timer: ReturnType<typeof setTimeout> | undefined;

      const schedule = (delayMs: number) => {
        timer = setTimeout(() => {
          setNow(Date.now());
          // A successful fetch updates obsFetchedAt, which re-runs this callback
          // and reschedules from the new expiry. If no fetch happened (failure,
          // or cached saved-location weather), fall back to the normal cadence.
          schedule(REFRESH_INTERVAL_MS);
        }, delayMs);
      };

      setNow(Date.now()); // stale check immediately on focus
      const expiry =
        obsFetchedAt !== null
          ? obsFetchedAt + REFRESH_INTERVAL_MS
          : Date.now() + REFRESH_INTERVAL_MS;
      schedule(Math.max(0, expiry - Date.now()));

      return () => {
        if (timer) clearTimeout(timer);
      };
    }, [obsFetchedAt]),
  );

  useEffect(() => {
    if (!selectedObservation || savedObsWeather) {
      setSnapshot(null);
      setError(null);
      setIsFetching(false);
      return;
    }
    // Fresh stored snapshot → no fetch needed (mirrors useWeather's staleness rule)
    if (
      storedWeather !== null &&
      obsFetchedAt !== null &&
      Date.now() - obsFetchedAt < REFRESH_INTERVAL_MS
    ) {
      setSnapshot(null);
      setError(null);
      setIsFetching(false);
      return;
    }
    const controller = new AbortController();
    setIsFetching(true);
    // On refresh the previous snapshot intentionally stays rendered — the
    // card never goes blank while a background update runs.
    setError(null);
    let timedOut = false;
    const timeoutId = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, REQUEST_TIMEOUT_MS);
    fetchWeather(
      [
        {
          latitude: selectedObservation.latitude,
          longitude: selectedObservation.longitude,
        },
      ],
      controller.signal,
    )
      .then(([info]) => {
        if (controller.signal.aborted) return;
        if (info) selectObservation(selectedObservation, info);
        setSnapshot(info ? { id: selectedObservation.id, info } : null);
        setIsFetching(false);
      })
      .catch((err) => {
        if (controller.signal.aborted) {
          if (timedOut) {
            setError(
              new Error(
                "Request timed out. Check your connection and try again.",
              ),
            );
            setIsFetching(false);
          }
          return;
        }
        setError(
          err instanceof Error ? err : new Error("Failed to fetch weather."),
        );
        setIsFetching(false);
      })
      .finally(() => clearTimeout(timeoutId));
    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [
    selectedObservation,
    savedObsWeather,
    storedWeather,
    obsFetchedAt,
    now,
    selectObservation,
  ]);

  return { snapshot, isFetching, error };
}
