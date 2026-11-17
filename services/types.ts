import type { ParameterId } from "@/constants/parameters";
import type { OverallStatus, ParameterStatus } from "@/constants/status";

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
  predictiveAlert: { message: string; alert: boolean };
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
  oneMonth: GraphDataPoint[];
  oneYear: GraphDataPoint[];
}

export interface AppNotification {
  id: string;
  title: string;
  date: string;
  read: boolean;
  parameter: string;
  value: number;
  ts: number;
  deleted: boolean;
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

export interface HourlyForecast {
  time: string;
  weatherCode: number;
  precipitation: number;
  heatIndex: number;
}

export interface WeatherInfo {
  temperature: number;
  weatherCode: number;
  rain24h: number;
  maxHeatIndex: number;
  humidity: number;
  precipitation: number;
  pressure: number;
  windSpeed: number;
  heatIndex: number;
  observationTime: string;
  hourlyForecast: HourlyForecast[];
}

// ── NH3 forecast service (thesis LSTM inference) ────────────────────────────

/** Raw response body from POST /forecast on the inference service.
 *  Field names mirror the service contract exactly (snake_case). */
export interface ForecastResponse {
  last_known_mg_l: number;      // observed NH3 at the end of the input window
  forecast_mg_l: number[];      // 24 hourly values, mg/L (lead 1..24)
  horizon_hours: number;        // 6
  change_mg_l: number;          // forecast[horizon-1] - last_known_mg_l
  direction: "rising" | "falling";
  crosses_threshold: boolean;   // any of the first 6 forecasts > 0.06 mg/L
  imputed_count: number;        // missing sensor values in the input window
}

/** App-facing view of a forecast: parsed, renamed to camelCase, and enriched
 *  with the fetch context (who/when) for the UI and the alert cache. */
export interface AmmoniaForecast {
  lastKnownMgL: number;
  forecastMgL: number[];
  horizonHours: number;
  changeMgL: number;
  direction: "rising" | "falling";
  crossesThreshold: boolean;
  imputedCount: number;
  /** Epoch-ms of the last observed reading (forecast lead 1 starts here + 1h). */
  lastReadingTs: number;
  /** Epoch-ms when the forecast was fetched (cache freshness). */
  fetchedAt: number;
}

/** Result of a forecast request — never throws; UI checks `ok`. */
export type AmmoniaForecastResult =
  | { ok: true; forecast: AmmoniaForecast }
  | { ok: false; reason: "network" | "bad-window" | "unexpected"; message?: string };
