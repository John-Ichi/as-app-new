import AsyncStorage from "@react-native-async-storage/async-storage";
import { fetchWeather } from "@/services/openMeteo";
import type { SavedLocation, WeatherInfo } from "@/services/types";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";

const WEATHER_CACHE_KEY = "weather-cache";
const REFRESH_INTERVAL_MS = 30 * 60 * 1000;

interface WeatherCache {
  fetchedAt: number;
  signature: string;
  data: Record<number, WeatherInfo>;
}

interface WeatherState {
  data: Record<number, WeatherInfo>;
  isFetching: boolean;
  lastUpdated: number | null;
  error: Error | null;
}

interface UseWeatherOptions {
  enabled: boolean;
}

function signatureOf(locations: SavedLocation[]): string {
  return locations
    .map((loc) => `${loc.id}:${loc.latitude}:${loc.longitude}`)
    .join("|");
}

async function readWeatherCache(): Promise<WeatherCache | null> {
  try {
    const stored = await AsyncStorage.getItem(WEATHER_CACHE_KEY);
    if (!stored) return null;
    const parsed: unknown = JSON.parse(stored);
    if (typeof parsed !== "object" || parsed === null) return null;
    const cache = parsed as Partial<WeatherCache>;
    if (
      typeof cache.fetchedAt !== "number" ||
      typeof cache.signature !== "string" ||
      typeof cache.data !== "object" ||
      cache.data === null
    ) {
      return null;
    }
    return cache as WeatherCache;
  } catch {
    return null;
  }
}

function writeWeatherCache(cache: WeatherCache): void {
  AsyncStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify(cache)).catch(
    () => {}
  );
}

export function useWeather(
  locations: SavedLocation[],
  { enabled }: UseWeatherOptions
): WeatherState {
  const [data, setData] = useState<Record<number, WeatherInfo>>({});
  const [isFetching, setIsFetching] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const locationsRef = useRef(locations);
  locationsRef.current = locations;
  const lastUpdatedRef = useRef(lastUpdated);
  lastUpdatedRef.current = lastUpdated;
  const abortRef = useRef<AbortController | null>(null);
  const hydratedRef = useRef(false);

  const doFetch = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const sig = signatureOf(locationsRef.current);
    setIsFetching(true);
    setError(null);

    try {
      const results = await fetchWeather(
        locationsRef.current,
        controller.signal
      );
      if (controller.signal.aborted) return;

      const nextData: Record<number, WeatherInfo> = {};
      locationsRef.current.forEach((loc, index) => {
        const info = results[index];
        if (info) nextData[loc.id] = info;
      });

      const fetchedAt = Date.now();
      setData(nextData);
      setLastUpdated(fetchedAt);
      lastUpdatedRef.current = fetchedAt;
      writeWeatherCache({ fetchedAt, signature: sig, data: nextData });
    } catch (err) {
      if (controller.signal.aborted) return;
      setError(
        err instanceof Error ? err : new Error("Failed to fetch weather.")
      );
    } finally {
      if (abortRef.current === controller) setIsFetching(false);
    }
  }, []);

  const signature = enabled ? signatureOf(locations) : null;

  useEffect(() => {
    if (!enabled || locations.length === 0) return;

    let disposed = false;

    const load = async () => {
      const cache = await readWeatherCache();
      hydratedRef.current = true;
      if (disposed) return;

      const currentSig = signatureOf(locationsRef.current);
      const cacheMatches =
        cache !== null &&
        cache.signature === currentSig &&
        Object.keys(cache.data).length === locationsRef.current.length;

      if (cacheMatches) {
        setData(cache.data);
        setLastUpdated(cache.fetchedAt);
        lastUpdatedRef.current = cache.fetchedAt;
      }

      const isStale =
        !cacheMatches ||
        Date.now() - (cache?.fetchedAt ?? 0) >= REFRESH_INTERVAL_MS;

      if (isStale) await doFetch();
    };

    load();

    return () => {
      disposed = true;
      abortRef.current?.abort();
    };
  }, [enabled, signature, doFetch]);

  useFocusEffect(
    useCallback(() => {
      if (!enabled || !signature) return;

      if (hydratedRef.current) {
        const age =
          lastUpdatedRef.current !== null
            ? Date.now() - lastUpdatedRef.current
            : Number.POSITIVE_INFINITY;
        if (age >= REFRESH_INTERVAL_MS) doFetch();
      }

      const tick = setInterval(() => {
        if (
          lastUpdatedRef.current !== null &&
          Date.now() - lastUpdatedRef.current < REFRESH_INTERVAL_MS
        ) {
          return;
        }
        doFetch();
      }, REFRESH_INTERVAL_MS);

      return () => {
        clearInterval(tick);
        abortRef.current?.abort();
      };
    }, [enabled, signature, doFetch])
  );

  return { data, isFetching, lastUpdated, error };
}
