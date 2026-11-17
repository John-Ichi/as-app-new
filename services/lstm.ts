/**
 * Client for the NH3 forecast inference service (thesis LSTM).
 *
 * Contract: the last 24 hourly readings from RTDB are posted VERBATIM
 * (camelCase, pH included — the service owns all mapping to model columns).
 * Results are cached module-level so the dashboard card and the forecast
 * modal share one fetch, and the realtime stream never blocks on HTTP.
 */
import { fetchReadings } from "@/services/firebase/graphs";
import type {
  AmmoniaForecast,
  AmmoniaForecastResult,
  ForecastResponse,
} from "@/services/types";

// Modal deployment (primary). For offline demo days, switch to the local
// service: "http://<laptop-ip>:8000" (see lstm-service/README.md).
export const SERVICE_URL = process.env.EXPO_PUBLIC_MODAL_SERVICE_URL;

const WINDOW_SIZE = 24; // model input window (hourly rows)
const TIMEOUT_MS = 15_000; // hard cap per request

// ── module-level cache (dashboard + modal share one result) ────────────────
let cache: AmmoniaForecast | null = null;
let inFlight: Promise<AmmoniaForecastResult> | null = null;

// ── cache listeners (any screen can react to a new forecast) ───────────────
const listeners = new Set<(f: AmmoniaForecast) => void>();

/** Subscribes to new forecasts; returns an unsubscribe function. */
export function subscribeForecast(listener: (f: AmmoniaForecast) => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Last successful forecast, or null before the first one. */
export function getCachedForecast(): AmmoniaForecast | null {
  return cache;
}

/** Human-readable, model-driven alert message for a forecast.
 *  Every token traces to service fields: direction, change_mg_l,
 *  horizon_hours, crosses_threshold. Nothing computed beyond the delta. */
export function describeForecast(f: AmmoniaForecast): {
  message: string;
  alert: boolean;
} {
  const sign = f.changeMgL >= 0 ? "+" : "";
  const trend =
    `Possibly ${f.direction === "rising" ? "rising" : "falling"} ` +
    `${sign}${f.changeMgL.toFixed(4)} ppm over the next ${f.horizonHours} h`;
  if (f.crossesThreshold) {
    return {
      message: `⚠ Forecast possibly exceeds 0.06 ppm within ${f.horizonHours} h — ${trend}`,
      alert: true,
    };
  }
  return { message: trend, alert: false };
}

/**
 * Fetches the last 24 hourly readings for the device and posts them to the
 * inference service. Never throws — returns a typed result.
 * Concurrent calls share one in-flight request.
 */
export async function requestForecast(
  deviceId: string,
): Promise<AmmoniaForecastResult> {
  if (inFlight) return inFlight;
  inFlight = doRequest(deviceId).finally(() => {
    inFlight = null;
  });
  return inFlight;
}

async function doRequest(deviceId: string): Promise<AmmoniaForecastResult> {
  if (!deviceId) {
    return { ok: false, reason: "bad-window", message: "No device selected" };
  }

  // 1. window: last 24 rows from RTDB, sorted numerically (epoch-ms keys),
  //    oldest first — the model's expected orientation.
  let rows: Record<string, Record<string, number>>;
  try {
    rows = await fetchReadings(deviceId, WINDOW_SIZE);
  } catch {
    return {
      ok: false,
      reason: "network",
      message: "Could not read sensor history",
    };
  }

  const entries = Object.entries(rows)
    .map(([ts, values]) => ({ ts: Number(ts), values }))
    .sort((a, b) => a.ts - b.ts);

  if (entries.length < WINDOW_SIZE) {
    return {
      ok: false,
      reason: "bad-window",
      message: `Needs ${WINDOW_SIZE} hourly readings — ${entries.length} collected so far`,
    };
  }

  // 2. request body: rows posted verbatim (schema now matches RTDB exactly).
  //    Missing fields become null; extra fields are ignored by the service.
  const readings = entries.map(({ ts, values }) => ({
    timestamp: String(ts),
    ammonia: values.ammonia ?? null,
    temperature: values.temperature ?? null,
    dissolvedOxygen: values.dissolvedOxygen ?? null,
    pH: values.pH ?? null,
    turbidity: values.turbidity ?? null,
    salinity: values.salinity ?? null,
  }));

  // 3. POST with a hard timeout so the UI can always recover.
  //    Classic AbortController + setTimeout (universally supported in RN/Hermes;
  //    AbortSignal.timeout is missing on some Hermes builds).
  let response: Response;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    response = await fetch(`${SERVICE_URL}/forecast`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ readings }),
      signal: controller.signal,
    });
  } catch {
    return {
      ok: false,
      reason: "network",
      message: "Forecast service unreachable",
    };
  } finally {
    clearTimeout(timer);
  }

  if (response.status === 400) {
    return {
      ok: false,
      reason: "bad-window",
      message: "Service rejected the reading window",
    };
  }

  let body: ForecastResponse;
  try {
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    body = (await response.json()) as ForecastResponse;
  } catch {
    return {
      ok: false,
      reason: "unexpected",
      message: `Service error (HTTP ${response.status})`,
    };
  }

  // 4. map wire format -> app object, cache, return.
  const forecast: AmmoniaForecast = {
    lastKnownMgL: body.last_known_mg_l,
    forecastMgL: body.forecast_mg_l,
    horizonHours: body.horizon_hours,
    changeMgL: body.change_mg_l,
    direction: body.direction,
    crossesThreshold: body.crosses_threshold,
    imputedCount: body.imputed_count,
    lastReadingTs: entries[entries.length - 1].ts,
    fetchedAt: Date.now(),
  };
  cache = forecast;
  listeners.forEach((listener) => listener(forecast));
  return { ok: true, forecast };
}
