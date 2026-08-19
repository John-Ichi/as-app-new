import fs from "fs";
import path from "path";

// ── Config ─────────────────────────────────────────────

function loadEnv() {
  const envPath = path.join(process.cwd(), ".env");
  if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      if (process.env[key] === undefined) process.env[key] = val;
    }
  }
}

// ── REST Helpers ──────────────────────────────────────

let BASE = "";

async function rtdbPut(path, data) {
  const res = await fetch(`${BASE}${path}.json`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`PUT ${path}: ${res.status} ${await res.text()}`);
  return res.json();
}

async function rtdbPatch(path, data) {
  const res = await fetch(`${BASE}${path}.json`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`PATCH ${path}: ${res.status} ${await res.text()}`);
  return res.json();
}

async function rtdbPost(path, data) {
  const res = await fetch(`${BASE}${path}.json`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`POST ${path}: ${res.status} ${await res.text()}`);
  return res.json();
}

// ── Constants ──────────────────────────────────────────

const INTERVAL_MIN = 5;
const DAYS = 7;
const SLOTS_PER_DAY = (24 * 60) / INTERVAL_MIN; // 288
const TOTAL_READINGS = SLOTS_PER_DAY * DAYS;     // 2,016

const DEVICES = [
  { id: "sensor-1", name: "POND A", location: "Tank A" },
  { id: "sensor-2", name: "POND B", location: "Tank B" },
  { id: "sensor-3", name: "POND C", location: "Tank C" },
];

const PARAM_CONFIG = {
  ammonia:         { base: 0.04, amp: 0.02, noise: 0.01, decimals: 3, anomaly: { chance: 0.02, min: 0.15, max: 0.35 } },
  temperature:     { base: 28,   amp: 2,    noise: 0.3,  decimals: 1 },
  dissolvedOxygen: { base: 7.0,  amp: 0.8,  noise: 0.3,  decimals: 1, invert: true },
  pH:              { base: 7.5,  amp: 0.4,  noise: 0.15, decimals: 1, periodHrs: 48 },
  turbidity:       { base: 3,    amp: 1.5,  noise: 0.5,  decimals: 1, anomaly: { chance: 0.05, min: 3, max: 8 } },
};

const THRESHOLDS = {
  ammonia:  { warning: 0.06, critical: 0.2 },
  temperature: { warning: 32, warningMin: 22 },
  pH: { warning: 8.5, warningMin: 6.0 },
};

// ── Data Generation ────────────────────────────────────

function round(val, decimals) {
  const factor = 10 ** decimals;
  return Math.round(val * factor) / factor;
}

function getDayOffset(dayIndex) {
  return (Math.random() - 0.5) * 0.1; // ±5%
}

function generateReading(timestamp, dayIndex, slotIndex) {
  const hourFraction = (slotIndex * INTERVAL_MIN) / 60;
  const cycle = Math.sin((hourFraction / 24) * 2 * Math.PI);
  const dailyOffset = getDayOffset(dayIndex);

  function genValue(key, cfg) {
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
    ammonia: genValue("ammonia", PARAM_CONFIG.ammonia),
    temperature: genValue("temperature", PARAM_CONFIG.temperature),
    dissolvedOxygen: genValue("dissolvedOxygen", PARAM_CONFIG.dissolvedOxygen),
    pH: genValue("pH", PARAM_CONFIG.pH),
    turbidity: genValue("turbidity", PARAM_CONFIG.turbidity),
  };
}

// ── Alerts ─────────────────────────────────────────────

function generateAlerts(deviceId, readings) {
  const alerts = [];

  for (const { ts, values } of readings) {
    for (const [param, value] of Object.entries(values)) {
      const t = THRESHOLDS[param];
      if (!t) continue;

      let type = null;
      if (param === "ammonia") {
        if (value >= t.critical) type = "critical";
        else if (value >= t.warning) type = "warning";
      } else {
        if (value >= t.warning || value <= (t.warningMin ?? -Infinity)) type = "warning";
      }

      if (type) {
        alerts.push({
          type,
          title: `${param.toUpperCase()} ${type === "critical" ? "SPIKE" : "ALERT"}`,
          parameter: param,
          value: round(value, 3),
          threshold: type === "critical" ? t.critical : t.warning,
          ts: Math.floor(ts / 1000),
          read: false,
        });
      }
    }
  }

  return alerts;
}

// ── Main ────────────────────────────────────────────────

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  loadEnv();

  const url = process.env.FIREBASE_RTDB_URL;
  if (!url) {
    console.error("Error: FIREBASE_RTDB_URL not set in .env or environment.");
    process.exit(1);
  }

  BASE = url.replace(/\/+$/, "");

  // Calculate date range
  const endDate = new Date();
  endDate.setHours(23, 59, 59, 999);
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - DAYS);
  startDate.setHours(0, 0, 0, 0);

  console.log(`Firebase RTDB: ${BASE}`);
  console.log(`Date range:    ${startDate.toDateString()} → ${endDate.toDateString()}`);
  console.log(`Devices:       ${DEVICES.map((d) => d.id).join(", ")}`);
  console.log(`Readings:      ${TOTAL_READINGS} per device (${TOTAL_READINGS * DEVICES.length} total)`);
  console.log(`Interval:      ${INTERVAL_MIN} minutes`);
  console.log(``);

  if (dryRun) {
    for (const device of DEVICES) {
      console.log(`\n${device.id} (${device.name}) — first 3 readings:`);
      for (let i = 0; i < 3; i++) {
        const ts = startDate.getTime() + i * INTERVAL_MIN * 60 * 1000;
        const reading = generateReading(ts, 0, i);
        console.log(`  #${i + 1}  ${new Date(ts).toISOString().slice(0, 16)} → ${JSON.stringify(reading)}`);
      }
    }

    const sampleReadings = [];
    for (let i = 0; i < TOTAL_READINGS; i++) {
      const ts = startDate.getTime() + i * INTERVAL_MIN * 60 * 1000;
      sampleReadings.push({ ts, values: generateReading(ts, 0, i) });
    }
    const sampleAlerts = generateAlerts("sensor-1", sampleReadings);
    console.log(`\nSample alerts for ${DEVICES[0].id}: ${sampleAlerts.length}`);
    for (const alert of sampleAlerts.slice(0, 5)) {
      console.log(`  ${alert.type.toUpperCase()}  ${alert.parameter}: ${alert.value} (threshold: ${alert.threshold})`);
    }
    if (sampleAlerts.length > 5) console.log(`  ... and ${sampleAlerts.length - 5} more`);

    console.log(`\nDry-run complete. Run without --dry-run to write to RTDB.`);
    return;
  }

  // ── Step 1: Seed devices/ ──
  console.log("Seeding devices...");
  for (const device of DEVICES) {
    await rtdbPut(`/devices/${device.id}`, {
      name: device.name,
      location: device.location,
    });
    console.log(`  ✓ ${device.id}`);
  }

  // ── Step 2: Generate and write readings + latest ──
  for (const device of DEVICES) {
    const readingsBatch = {};
    let lastTs = 0;
    let lastValues = null;

    process.stdout.write(`  Generating ${device.id}... `);

    for (let day = 0; day < DAYS; day++) {
      for (let slot = 0; slot < SLOTS_PER_DAY; slot++) {
        const ts = startDate.getTime() + day * 86400000 + slot * INTERVAL_MIN * 60 * 1000;
        const values = generateReading(ts, day, slot);
        readingsBatch[ts] = values;
        lastTs = ts;
        lastValues = values;
      }
    }

    process.stdout.write(`${Object.keys(readingsBatch).length} readings → PATCH... `);
    await rtdbPatch(`/readings/${device.id}`, readingsBatch);

    // Update latest/ with final reading + ts
    await rtdbPatch(`/latest/${device.id}`, {
      ...lastValues,
      ts: Math.floor(lastTs / 1000),
    });
    process.stdout.write("latest ✓\n");

    // ── Step 3: Generate and post alerts ──
    const deviceReadings = Object.entries(readingsBatch).map(([ts, values]) => ({
      ts: Number(ts),
      values,
    }));
    const alerts = generateAlerts(device.id, deviceReadings);

    for (const alert of alerts) {
      await rtdbPost(`/alerts/${device.id}`, alert);
    }
    console.log(`  ${device.id}: ${alerts.length} alerts written`);
  }

  console.log(`\n✅ Done. ${TOTAL_READINGS * DEVICES.length} readings written across ${DEVICES.length} devices.`);
}

main().catch((err) => {
  console.error("Script failed:", err);
  process.exit(1);
});
