import { parameterMap } from "@/constants/parameters";

export interface ParameterReading {
  id: string;
  value: number;
  status: "normal" | "warning" | "critical" | undefined;
}

export interface WaterQualityData {
  overallStatus: "NORMAL" | "WARNING" | "CRITICAL";
  parameters: ParameterReading[];
  predictiveAlert?: { risk: string; time: string } | null;
  isLoading: boolean;
  error: Error | null;
}

function classify(id: string, value: number): ParameterReading["status"] {
  const metadata = parameterMap[id];
  if (!metadata?.threshold) return undefined;
  if (value > metadata.threshold.critical) return "critical";
  if (value > metadata.threshold.warning) return "warning";
  return "normal";
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
      value: 7.2,
      status: classify("dissolvedOxygen", 7.2),
    },
    { id: "pH", value: 7.2, status: classify("pH", 7.2) },
    { id: "turbidity", value: 2.9, status: classify("turbidity", 2.9) },
  ];

  return {
    overallStatus: getOverallStatus(readings),
    parameters: readings,
    predictiveAlert: null,
    isLoading: false,
    error: null,
  };
}
