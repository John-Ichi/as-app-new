import type { ParameterId } from "@/constants/parameters";

export interface GraphConfig {
  color: string;
  shortLabel: string;
  yAxisMin: number;
  yAxisMax: number;
}

export const graphConfig: Record<ParameterId, GraphConfig> = {
  ammonia: { color: "#15a84b", shortLabel: "NH₃", yAxisMin: 0, yAxisMax: 0.25 },
  temperature: {
    color: "#dc2626",
    shortLabel: "Temp",
    yAxisMin: 15,
    yAxisMax: 35,
  },
  dissolvedOxygen: {
    color: "#3b82f6",
    shortLabel: "DO",
    yAxisMin: 0,
    yAxisMax: 15,
  },
  pH: { color: "#facc15", shortLabel: "pH", yAxisMin: 0, yAxisMax: 14 },
  turbidity: {
    color: "#b45309",
    shortLabel: "Turbidity",
    yAxisMin: 0,
    yAxisMax: 10,
  },
};
