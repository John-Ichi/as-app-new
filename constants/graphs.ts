import type { ParameterId, ParameterMetaData } from "@/constants/parameters";

export interface GraphConfig {
  color: string;
  shortLabel: string;
  yAxisMin: number;
  yAxisMax: number;
  threshold?: ParameterMetaData["threshold"];
}

export const graphConfig: Record<ParameterId, GraphConfig> = {
  ammonia: {
    color: "#15a84b",
    shortLabel: "NH₃",
    yAxisMin: 0,
    yAxisMax: 0.25,
    threshold: { max: 0.06 },
  },
  temperature: {
    color: "#dc2626",
    shortLabel: "Temp",
    yAxisMin: 15,
    yAxisMax: 35,
    threshold: { min: 26, max: 32 },
  },
  dissolvedOxygen: {
    color: "#3b82f6",
    shortLabel: "DO",
    yAxisMin: 0,
    yAxisMax: 15,
    threshold: { min: 5 },
  },
  pH: {
    color: "#facc15",
    shortLabel: "pH",
    yAxisMin: 0,
    yAxisMax: 14,
    threshold: { min: 6.5, max: 8.5 },
  },
  turbidity: {
    color: "#b45309",
    shortLabel: "Turbidity",
    yAxisMin: 0,
    yAxisMax: 10,
  },
  salinity: {
    color: "#8b5cf6",
    shortLabel: "Sal",
    yAxisMin: 0,
    yAxisMax: 30,
    threshold: { min: 2, max: 15 },
  },
};

export type GraphRangeId = "oneDay" | "oneMonth" | "oneYear";
