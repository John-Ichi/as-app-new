// Shared synthetic water-quality data generation for the seed scripts.
// Pure functions and configuration only: no I/O happens here.

// ── Constants ──────────────────────────────────────────

export const DEVICES = [
  { id: "sensor-1", name: "POND A", location: "Tank A" },
  { id: "sensor-2", name: "POND B", location: "Tank B" },
  { id: "sensor-3", name: "POND C", location: "Tank C" },
];

// base/amp/noise model a sinusoidal daily cycle around a per-parameter base;
// anomaly injects occasional spikes for alert testing.
export const PARAM_CONFIG = {
  ammonia:         { base: 0.04, amp: 0.02, noise: 0.01, decimals: 3, anomaly: { chance: 0.02, min: 0.15, max: 0.35 } },
  temperature:     { base: 28,   amp: 2,    noise: 0.3,  decimals: 1 },
  dissolvedOxygen: { base: 7.0,  amp: 0.8,  noise: 0.3,  decimals: 1, invert: true },
  pH:              { base: 7.5,  amp: 0.4,  noise: 0.15, decimals: 1, periodHrs: 48 },
  turbidity:       { base: 3,    amp: 1.5,  noise: 0.5,  decimals: 1, anomaly: { chance: 0.05, min: 3, max: 8 } },
  salinity:        { base: 15,   amp: 1.5,  noise: 0.3,  decimals: 1 },
};

// Safe-zone definitions per the adviser (mirrors constants/parameters.ts —
// binary: outside the zone = alert; no warning/critical tiers).
export const THRESHOLDS = {
  ammonia:         { max: 0.06 },
  temperature:     { min: 26, max: 32 },
  dissolvedOxygen: { min: 5 },
  pH:              { min: 6.5, max: 8.5 },
  salinity:        { min: 2, max: 15 },
};

// ── Reading Generation ─────────────────────────────────

export function round(val, decimals) {
  const factor = 10 ** decimals;
  return Math.round(val * factor) / factor;
}

function getDayOffset(dayIndex) {
  return (Math.random() - 0.5) * 0.1; // ±5%
}

// The cycle phase is derived from window-spanning hours (day index +
// wall-clock hour), so every script agrees on the phase regardless of where
// its window starts, and per-parameter periods (e.g. pH 48h) span correctly.
export function generateReading(timestamp, dayIndex) {
  const date = new Date(timestamp);
  const hourFraction = date.getHours() + date.getMinutes() / 60;
  // Window-spanning hours: day 0 starts at 0, day 1 at 24, ... — so a
  // parameter's cycle continues across the whole window. For 24h periods
  // this reduces to the plain hourFraction (identical to previous behavior).
  const hoursInto = dayIndex * 24 + hourFraction;
  const dailyOffset = getDayOffset(dayIndex);

  function genValue(cfg) {
    const base = cfg.base * (1 + dailyOffset);
    const inverted = cfg.invert ? -1 : 1;
    const period = cfg.periodHrs ?? 24;
    const cycle = Math.sin((hoursInto / period) * 2 * Math.PI);
    let value = base + cycle * cfg.amp * inverted;
    value += (Math.random() - 0.5) * 2 * cfg.noise;

    if (cfg.anomaly && Math.random() < cfg.anomaly.chance) {
      value = base + (Math.random() * (cfg.anomaly.max - cfg.anomaly.min) + cfg.anomaly.min);
    }

    return round(value, cfg.decimals);
  }

  return {
    ammonia: genValue(PARAM_CONFIG.ammonia),
    temperature: genValue(PARAM_CONFIG.temperature),
    dissolvedOxygen: genValue(PARAM_CONFIG.dissolvedOxygen),
    pH: genValue(PARAM_CONFIG.pH),
    turbidity: genValue(PARAM_CONFIG.turbidity),
    salinity: genValue(PARAM_CONFIG.salinity),
  };
}

// ── Alerts ─────────────────────────────────────────────

export const ALERT_COOLDOWN_HRS = 24;
export const ALERT_READ_DAYS = 7;

const STATUS_RANK = { normal: 0, critical: 1 };

// Binary zone check — mirrors classify() in constants/status.ts.
function alertStatus(param, value) {
  const t = THRESHOLDS[param];
  if (!t) return "normal";
  if (t.max != null && value > t.max) return "critical";
  if (t.min != null && value < t.min) return "critical";
  return "normal";
}

// Alerts fire on state changes only, with a per-parameter cooldown, so a
// multi-hour peak produces one alert instead of one per reading. Keys are
// `${tsSec}-${param}` so reruns overwrite instead of duplicating.
export function generateAlerts(readings, now) {
  const sorted = [...readings].sort((a, b) => a.ts - b.ts);
  const readCutoff = now - ALERT_READ_DAYS * 24 * 60 * 60 * 1000;
  const prevStatus = {};
  const lastAlertTs = {};
  const alerts = {};

  for (const { ts, values } of sorted) {
    for (const [param, value] of Object.entries(values)) {
      const t = THRESHOLDS[param];
      if (!t) continue;
      // Seeds demo alerts for ammonia only: the alert product surface (pushes,
      // forecast tie-in) is ammonia-scoped. Extend when the adviser confirms
      // alert semantics for the other parameters.
      if (param !== "ammonia") continue;

      const status = alertStatus(param, value);
      const prev = prevStatus[param] ?? "normal";
      prevStatus[param] = status;

      if (STATUS_RANK[status] <= STATUS_RANK[prev]) continue;

      const tsSec = Math.floor(ts / 1000);
      const last = lastAlertTs[param];
      if (last !== undefined && tsSec - last < ALERT_COOLDOWN_HRS * 3600) {
        continue;
      }
      lastAlertTs[param] = tsSec;

      const threshold =
        t.max != null && value > t.max ? t.max : t.min;

      alerts[`${tsSec}-${param}`] = {
        title: `${param.toUpperCase()} ALERT`,
        parameter: param,
        value: round(value, 3),
        threshold,
        ts: tsSec,
        read: ts < readCutoff,
      };
    }
  }

  return alerts;
}
