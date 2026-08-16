import { getDevices } from "@/services/firebase/devices";
import type { Device } from "@/services/types";
import { useEffect, useState } from "react";

export function useDevices(): { devices: Device[]; isLoading: boolean; error: Error | null } {
  const [devices, setDevices] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    getDevices()
      .then(setDevices)
      .catch((err) => setError(err instanceof Error ? err : new Error("Failed to load devices.")))
      .finally(() => setIsLoading(false));
  }, []);

  return { devices, isLoading, error };
}
