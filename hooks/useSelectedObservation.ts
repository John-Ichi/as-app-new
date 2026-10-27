import AsyncStorage from "@react-native-async-storage/async-storage";
import { isSavedLocation } from "@/hooks/useSavedLocations";
import { REFRESH_INTERVAL_MS } from "@/hooks/useWeather";
import type { SavedLocation, WeatherInfo } from "@/services/types";
import { useCallback, useEffect, useState } from "react";

const OBSERVATION_SELECTION_KEY = "observation-selection";

interface StoredSelection {
  location: SavedLocation;
  weather: WeatherInfo | null;
  fetchedAt: number;
}

interface SelectedObservationState {
  selection: SavedLocation | null;
  storedWeather: WeatherInfo | null;
  isHydrated: boolean;
  fetchedAt: number | null;
  select: (location: SavedLocation, weather: WeatherInfo | null) => void;
  deselect: () => void;
}

function isWeatherInfo(value: unknown): value is WeatherInfo {
  if (typeof value !== "object" || value === null) return false;
  const info = value as Record<string, unknown>;
  return (
    typeof info.temperature === "number" &&
    typeof info.weatherCode === "number" &&
    typeof info.rain24h === "number" &&
    typeof info.maxHeatIndex === "number" &&
    typeof info.humidity === "number" &&
    typeof info.precipitation === "number" &&
    typeof info.pressure === "number" &&
    typeof info.windSpeed === "number" &&
    typeof info.heatIndex === "number" &&
    typeof info.observationTime === "string" &&
    Array.isArray(info.hourlyForecast)
  );
}

async function readSelection(): Promise<StoredSelection | null> {
  try {
    const stored = await AsyncStorage.getItem(OBSERVATION_SELECTION_KEY);
    if (!stored) return null;
    const parsed: unknown = JSON.parse(stored);
    if (typeof parsed !== "object" || parsed === null) return null;
    const { location, weather, fetchedAt } = parsed as {
      location?: unknown;
      weather?: unknown;
      fetchedAt?: unknown;
    };
    if (!isSavedLocation(location) || typeof fetchedAt !== "number") {
      return null;
    }
    if (weather !== null && weather !== undefined && !isWeatherInfo(weather)) {
      return null;
    }
    return {
      location,
      weather: weather ?? null,
      fetchedAt,
    };
  } catch {
    return null;
  }
}

export function useSelectedObservation(): SelectedObservationState {
  const [selection, setSelection] = useState<SavedLocation | null>(null);
  const [storedWeather, setStoredWeather] = useState<WeatherInfo | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [fetchedAt, setFetchedAt] = useState<number | null>(null);

  useEffect(() => {
    let disposed = false;
    readSelection().then((stored) => {
      if (disposed) return;
      if (stored) {
        setSelection(stored.location);
        if (
          stored.weather &&
          Date.now() - stored.fetchedAt < REFRESH_INTERVAL_MS
        ) {
          setStoredWeather(stored.weather);
          setFetchedAt(stored.fetchedAt);
        }
      }
      setIsHydrated(true);
    });
    return () => {
      disposed = true;
    };
  }, []);

  const select = useCallback(
    (location: SavedLocation, weather: WeatherInfo | null) => {
      setSelection(location);
      setStoredWeather(weather);
      const timestamp = Date.now();
      setFetchedAt(timestamp);
      AsyncStorage.setItem(
        OBSERVATION_SELECTION_KEY,
        JSON.stringify({ location, weather, fetchedAt: timestamp }),
      ).catch(() => {});
    },
    [],
  );

  const deselect = useCallback(() => {
    setSelection(null);
    setStoredWeather(null);
    setFetchedAt(null);
    AsyncStorage.removeItem(OBSERVATION_SELECTION_KEY).catch(() => {});
  }, []);

  return {
    selection,
    storedWeather,
    isHydrated,
    fetchedAt,
    select,
    deselect,
  };
}
