import { ParameterId } from "@/constants/parameters";
import { ParameterStatus } from "@/constants/status";
import { useDevice } from "@/contexts/DeviceContext";
import { getWaterQualityData } from "@/services/firebase/waterQuality";
import {
  describeForecast,
  getCachedForecast,
  subscribeForecast,
} from "@/services/lstm";
import { useEffect, useState } from "react";

interface ParameterReading {
  id: ParameterId;
  value: number;
  status: ParameterStatus | undefined;
}

interface WaterQualityData {
  overallStatus: "NORMAL" | "WARNING" | "CRITICAL";
  parameters: ParameterReading[];
  predictiveAlert: { message: string; alert: boolean };
  timestamp: number | null;
  isLoading: boolean;
  error: Error | null;
}

export function useWaterQualityData(): WaterQualityData {
  const { selectedDevice } = useDevice();
  const [data, setData] = useState<WaterQualityData>({
    overallStatus: "NORMAL",
    parameters: [],
    predictiveAlert: { message: "No forecast yet", alert: false },
    timestamp: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    if (!selectedDevice) return;
    const unsubscribe = getWaterQualityData(
      selectedDevice.id,
      (result) => setData(result),
      (error) => setData((prev) => ({ ...prev, error, isLoading: false })),
    );

    const applyForecast = () => {
      const cached = getCachedForecast();
      if (cached) {
        setData((prev) => ({
          ...prev,
          predictiveAlert: describeForecast(cached),
        }));
      }
    };
    applyForecast();
    const unsubForecast = subscribeForecast(applyForecast);

    return () => {
      unsubscribe();
      unsubForecast();
    };
  }, [selectedDevice]);

  return data;
}
