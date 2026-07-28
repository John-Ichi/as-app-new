import { getDevices } from "@/services/firebase/devices";
import type { Device } from "@/services/types";
import { useEffect, useState } from "react";

export function useDevices(): { devices: Device[]; isLoading: boolean } {
  const [devices, setDevices] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getDevices()
      .then(setDevices)
      .finally(() => setIsLoading(false));
  }, []);

  return { devices, isLoading };
}
