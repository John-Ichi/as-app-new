import AsyncStorage from "@react-native-async-storage/async-storage";
import { isSavedLocation } from "@/hooks/useSavedLocations";
import { searchPhilippineLocations } from "@/services/openMeteo";
import type { SavedLocation } from "@/services/types";
import * as Location from "expo-location";
import { useEffect, useState } from "react";
import { Platform } from "react-native";

const DEVICE_LOCATION_ID = -1;
const FALLBACK_NAME = "Current Location";
const DEVICE_CACHE_KEY = "device-location-cache";
const MATCH_RADIUS_KM = 1;

interface Coords {
  latitude: number;
  longitude: number;
}

function distanceKm(a: Coords, b: Coords): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

async function readDeviceCache(): Promise<SavedLocation | null> {
  try {
    const stored = await AsyncStorage.getItem(DEVICE_CACHE_KEY);
    if (!stored) return null;
    const parsed: unknown = JSON.parse(stored);
    return isSavedLocation(parsed) && parsed.source === "device"
      ? parsed
      : null;
  } catch {
    return null;
  }
}

function writeDeviceCache(location: SavedLocation): void {
  AsyncStorage.setItem(DEVICE_CACHE_KEY, JSON.stringify(location)).catch(
    () => {}
  );
}

interface CurrentLocationState {
  location: SavedLocation | null;
  isLoading: boolean;
  isValidating: boolean;
  lastUpdated: number | null;
  isUnavailable: boolean;
}

async function resolvePlaceName(
  coords: { latitude: number; longitude: number },
  signal?: AbortSignal
): Promise<SavedLocation> {
  try {
    const addresses = await Location.reverseGeocodeAsync(coords);
    const address = addresses[0];
    const place = address?.city ?? address?.district ?? address?.name;

    if (!place) {
      return {
        id: DEVICE_LOCATION_ID,
        name: FALLBACK_NAME,
        latitude: coords.latitude,
        longitude: coords.longitude,
        source: "device",
      };
    }

    try {
      const [match] = await searchPhilippineLocations(place, signal);
      if (match) {
        return {
          id: match.id,
          name: match.name,
          admin1: match.admin1,
          latitude: coords.latitude,
          longitude: coords.longitude,
          source: "device",
        };
      }
    } catch {
      // Open-Meteo failure falls through to reverse-geocode name
    }

    return {
      id: DEVICE_LOCATION_ID,
      name: place,
      admin1: address?.region ?? undefined,
      latitude: coords.latitude,
      longitude: coords.longitude,
      source: "device",
    };
  } catch {
    return {
      id: DEVICE_LOCATION_ID,
      name: FALLBACK_NAME,
      latitude: coords.latitude,
      longitude: coords.longitude,
      source: "device",
    };
  }
}

export function useCurrentLocation(): CurrentLocationState {
  const [location, setLocation] = useState<SavedLocation | null>(null);
  const [isLoading, setIsLoading] = useState(Platform.OS !== "web");
  const [isValidating, setIsValidating] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [isUnavailable, setIsUnavailable] = useState(Platform.OS === "web");

  useEffect(() => {
    if (Platform.OS === "web") return;

    let disposed = false;
    const controller = new AbortController();

    async function resolve() {
      const cached = await readDeviceCache();
      if (disposed) return;

      if (cached) {
        setLocation(cached);
        setIsLoading(false);
        setIsValidating(true);
      }

      let ok = false;
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") throw new Error("Permission denied.");

        const position =
          (await Location.getLastKnownPositionAsync({
            maxAge: 300_000,
            requiredAccuracy: 5_000,
          })) ?? (await Location.getCurrentPositionAsync({}));
        if (disposed) return;

        const fresh = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };

        if (cached && distanceKm(fresh, cached) <= MATCH_RADIUS_KM) {
          ok = true;
          return;
        }

        const resolved = await resolvePlaceName(fresh, controller.signal);
        if (disposed) return;
        setLocation(resolved);
        writeDeviceCache(resolved);
        ok = true;
      } catch {
        if (!disposed && !cached) setIsUnavailable(true);
      } finally {
        if (!disposed) {
          setIsLoading(false);
          setIsValidating(false);
          if (ok) setLastUpdated(Date.now());
        }
      }
    }

    resolve();

    return () => {
      disposed = true;
      controller.abort();
    };
  }, []);

  return { location, isLoading, isValidating, lastUpdated, isUnavailable };
}
