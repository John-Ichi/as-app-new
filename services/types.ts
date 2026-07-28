import type { ParameterId } from "@/constants/parameters";
import type { ParameterStatus, OverallStatus, RiskLevel } from "@/constants/status";

export interface Device {
  id: string;
  name: string;
  location: string;
}

export interface ParameterReading {
  id: ParameterId;
  value: number;
  status: ParameterStatus | undefined;
}

export interface WaterQualityData {
  overallStatus: OverallStatus;
  parameters: ParameterReading[];
  predictiveAlert: { risk: RiskLevel };
  isLoading: boolean;
  error: Error | null;
}

export interface GraphDataPoint {
  value: number;
  label?: string;
}

export interface ParameterGraphData {
  id: ParameterId;
  oneDay: GraphDataPoint[];
  sevenDay: GraphDataPoint[];
}

export interface AppNotification {
  id: string;
  type: "critical" | "warning";
  title: string;
  date: string;
}
