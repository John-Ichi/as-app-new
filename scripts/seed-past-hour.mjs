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

async function rtdbPut(rtdbPath, data) {
  const res = await fetch(`${BASE}${rtdbPath}.json`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`PUT ${rtdbPath}: ${res.status} ${await res.text()}`);
  return res.json();
}

async function rtdbPatch(rtdbPath, data) {
  const res = await fetch(`${BASE}${rtdbPath}.json`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`PATCH ${rtdbPath}: ${res.status} ${await res.text()}`);
  return res.json();
}

async function rtdbGet(rtdbPath, shallow = false) {
  const url = shallow ? `${BASE}${rtdbPath}.json?shallow=true` : `${BASE}${rtdbPath}.json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`GET ${rtdbPath}: ${res.status} ${await res.text()}`);
  return res.json();
}

// ── Constants ──────────────────────────────────────────

const INTERVAL_MIN = 5;
const SLOTS = 12; // past hour: 60 / 5

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

// ── Main ────────────────────────────────────────────────

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const deviceArgIdx = process.argv.indexOf("--device");
  const deviceArg = deviceArgIdx !== -1 ? process.argv[deviceArgIdx + 1] : null;
  loadEnv();

  const url = process.env.FIREBASE_RTDB_URL;
  if (!url) {
    console.error("Error: FIREBASE_RTDB_URL not set in .env or environment.");
    process.exit(1);
  }

  BASE = url.replace(/\/+$/, "");

  const targets = deviceArg ? DEVICES.filter((d) => d.id === deviceArg) : DEVICES;
  if (deviceArg && targets.length === 0) {
    console.error(`Error: device "${deviceArg}" not found. Available: ${DEVICES.map((d) => d.id).join(", ")}`);
    process.exit(1);
  }

  const nowWall5 = Math.floor(Date.now() / (5 * 60 * 1000)) * (5 * 60 * 1000);
  const end = nowWall5;
  const start = end - (SLOTS - 1) * INTERVAL_MIN * 60 * 1000;

  console.log(`Firebase RTDB: ${BASE}`);
  console.log(`Devices:       ${targets.map((d) => d.id).join(", ")}`);
  console.log(`Window:        past hour (${new Date(start).toISOString()} → ${new Date(end).toISOString()})`);
  console.log(`Readings:      ${SLOTS} per device (${SLOTS * targets.length} total)`);
  console.log(`Interval:      ${INTERVAL_MIN} minutes`);
  console.log(``);

  if (dryRun) {
    for (const device of targets) {
      console.log(`\n${device.id} (${device.name}) — sample readings:`);
      for (let i = 0; i < Math.min(3, SLOTS); i++) {
        const ts = start + i * INTERVAL_MIN * 60 * 1000;
        const reading = generateReading(ts, 0, i);
        console.log(`  #${i + 1}  ${new Date(ts).toISOString().slice(0, 16)} → ${JSON.stringify(reading)}`);
      }
    }
    console.log(`\nDry-run complete. Run without --dry-run to write to RTDB.`);
    return;
  }

  for (const device of targets) {
    // Fetch existing timestamps to skip
    const existing = await rtdbGet(`/readings/${device.id}`, true);
    const existingKeys = existing ? new Set(Object.keys(existing)) : new Set();

    const readingsBatch = {};
    let lastTs = 0;
    let lastValues = null;
    let skipped = 0;

    process.stdout.write(`  Generating ${device.id}... `);

    for (let i = 0; i < SLOTS; i++) {
      const ts = start + i * INTERVAL_MIN * 60 * 1000;
      if (existingKeys.has(String(ts))) {
        skipped++;
        continue;
      }
      const values = generateReading(ts, 0, i);
      readingsBatch[ts] = values;
      lastTs = ts;
      lastValues = values;
    }

    const newCount = Object.keys(readingsBatch).length;
    process.stdout.write(`${newCount} new, ${skipped} skipped → PATCH... `);

    if (newCount > 0) {
      await rtdbPatch(`/readings/${device.id}`, readingsBatch);

      await rtdbPatch(`/latest/${device.id}`, {
        ...lastValues,
        ts: Math.floor(lastTs / 1000),
      });
    }
    process.stdout.write("latest ✓\n");
  }

  console.log(`\n✅ Done. ${SLOTS * targets.length} readings written across ${targets.length} device(s).`);
}

main().catch((err) => {
  console.error("Script failed:", err);
  process.exit(1);
});
