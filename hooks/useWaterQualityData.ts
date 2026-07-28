import { ParameterId } from "@/constants/parameters";
import { ParameterStatus } from "@/constants/status";
import { useDevice } from "@/contexts/DeviceContext";
import { getWaterQualityData } from "@/services/firebase/waterQuality";
import { useEffect, useState } from "react";

interface ParameterReading {
  id: ParameterId;
  value: number;
  status: ParameterStatus | undefined;
}

interface WaterQualityData {
  overallStatus: "NORMAL" | "WARNING" | "CRITICAL";
  parameters: ParameterReading[];
  predictiveAlert: { risk: "LOW" | "MEDIUM" | "HIGH" };
  isLoading: boolean;
  error: Error | null;
}

export function useWaterQualityData(): WaterQualityData {
  const { selectedDevice } = useDevice();
  const [data, setData] = useState<WaterQualityData>({
    overallStatus: "NORMAL",
    parameters: [],
    predictiveAlert: { risk: "LOW" },
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

    return unsubscribe;
  }, [selectedDevice]);

  return data;
}
