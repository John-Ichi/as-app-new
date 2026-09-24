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
  timestamp: number | null;
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
  read: boolean;
  parameter: string;
  value: number;
  ts: number;
  pushed?: boolean;
}

export interface GeocodedLocation {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country_code: string;
  admin1?: string;
}

export interface SavedLocation {
  id: number;
  name: string;
  admin1?: string;
  latitude: number;
  longitude: number;
  source?: "device";
}

export interface WeatherInfo {
  temperature: number;
  weatherCode: number;
  rain24h: number;
  maxHeatIndex: number;
}
