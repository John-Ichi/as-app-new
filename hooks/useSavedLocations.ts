import AsyncStorage from "@react-native-async-storage/async-storage";
import type { SavedLocation } from "@/services/types";
import { useCallback, useEffect, useState } from "react";

const SAVED_LOCATIONS_KEY = "saved-locations";

interface SavedLocationsState {
  savedLocations: SavedLocation[];
  isHydrated: boolean;
  addLocation: (location: SavedLocation) => void;
  seedDeviceLocation: (location: SavedLocation) => void;
}

export function isSavedLocation(value: unknown): value is SavedLocation {
  if (typeof value !== "object" || value === null) return false;
  const loc = value as Record<string, unknown>;
  return (
    typeof loc.id === "number" &&
    typeof loc.name === "string" &&
    typeof loc.latitude === "number" &&
    typeof loc.longitude === "number" &&
    (loc.admin1 === undefined || typeof loc.admin1 === "string") &&
    (loc.source === undefined || loc.source === "device")
  );
}

async function readSavedLocations(): Promise<SavedLocation[]> {
  try {
    const stored = await AsyncStorage.getItem(SAVED_LOCATIONS_KEY);
    if (!stored) return [];
    const parsed: unknown = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isSavedLocation);
  } catch {
    return [];
  }
}

export function useSavedLocations(): SavedLocationsState {
  const [savedLocations, setSavedLocations] = useState<SavedLocation[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    let disposed = false;
    readSavedLocations().then((stored) => {
      if (disposed) return;
      setSavedLocations((prev) => {
        const storedIds = new Set(stored.map((loc) => loc.id));
        const deviceEntries = prev.filter((loc) => loc.source === "device");
        const extras = prev.filter(
          (loc) => loc.source !== "device" && !storedIds.has(loc.id)
        );
        return [...deviceEntries, ...stored, ...extras];
      });
      setIsHydrated(true);
    });
    return () => {
      disposed = true;
    };
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    const toStore = savedLocations.filter((loc) => loc.source !== "device");
    AsyncStorage.setItem(SAVED_LOCATIONS_KEY, JSON.stringify(toStore)).catch(
      () => {}
    );
  }, [savedLocations, isHydrated]);

  const addLocation = useCallback((location: SavedLocation) => {
    setSavedLocations((prev) =>
      prev.some((loc) => loc.id === location.id) ? prev : [...prev, location]
    );
  }, []);

  const seedDeviceLocation = useCallback((location: SavedLocation) => {
    setSavedLocations((prev) => [
      location,
      ...prev.filter(
        (loc) => loc.source !== "device" && loc.id !== location.id
      ),
    ]);
  }, []);

  return { savedLocations, isHydrated, addLocation, seedDeviceLocation };
}
