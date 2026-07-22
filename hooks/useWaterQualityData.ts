import { ParameterId } from "@/constants/parameters";
import { classify, ParameterStatus } from "@/constants/status";

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

function getOverallStatus(
  parameters: ParameterReading[],
): WaterQualityData["overallStatus"] {
  const ammonia = parameters.find((p) => p.id === "ammonia");
  if (!ammonia) return "NORMAL";
  if (ammonia.status === "critical") return "CRITICAL";
  if (ammonia.status === "warning") return "WARNING";
  return "NORMAL";
}

export function useWaterQualityData(): WaterQualityData {
  const readings: ParameterReading[] = [
    { id: "ammonia", value: 0.049, status: classify("ammonia", 0.049) },
    { id: "temperature", value: 27.5, status: classify("temperature", 27.5) },
    {
      id: "dissolvedOxygen",
      value: 7.1,
      status: classify("dissolvedOxygen", 7.1),
    },
    { id: "pH", value: 7.2, status: classify("pH", 7.2) },
    { id: "turbidity", value: 2.9, status: classify("turbidity", 2.9) },
  ];

  return {
    overallStatus: getOverallStatus(readings),
    parameters: readings,
    predictiveAlert: { risk: "LOW" },
    isLoading: false,
    error: null,
  };
}
