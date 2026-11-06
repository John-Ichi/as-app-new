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

export const THRESHOLDS = {
  ammonia:  { warning: 0.06, critical: 0.2 },
  temperature: { warning: 32, warningMin: 22 },
  pH: { warning: 8.5, warningMin: 6.0 },
};

// ── Reading Generation ─────────────────────────────────

export function round(val, decimals) {
  const factor = 10 ** decimals;
  return Math.round(val * factor) / factor;
}

function getDayOffset(dayIndex) {
  return (Math.random() - 0.5) * 0.1; // ±5%
}

// The daily cycle is derived from the reading's wall-clock time, so every
// script agrees on the phase regardless of where its window starts.
export function generateReading(timestamp, dayIndex) {
  const date = new Date(timestamp);
  const hourFraction = date.getHours() + date.getMinutes() / 60;
  const cycle = Math.sin((hourFraction / 24) * 2 * Math.PI);
  const dailyOffset = getDayOffset(dayIndex);

  function genValue(cfg) {
    const base = cfg.base * (1 + dailyOffset);
    const inverted = cfg.invert ? -1 : 1;
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

const STATUS_RANK = { normal: 0, warning: 1, critical: 2 };

function alertStatus(param, value) {
  const t = THRESHOLDS[param];
  if (!t) return "normal";
  if (t.critical != null && value >= t.critical) return "critical";
  if (value >= t.warning || value <= (t.warningMin ?? -Infinity)) return "warning";
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

      let threshold;
      if (status === "critical") threshold = t.critical;
      else if (value <= (t.warningMin ?? -Infinity)) threshold = t.warningMin;
      else threshold = t.warning;

      alerts[`${tsSec}-${param}`] = {
        type: status,
        title: `${param.toUpperCase()} ${status === "critical" ? "SPIKE" : "ALERT"}`,
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
