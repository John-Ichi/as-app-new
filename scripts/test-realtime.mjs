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

// ── CLI Args ──────────────────────────────────────────

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {
    device: null,
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--device" && args[i + 1]) opts.device = args[++i];
  }

  return opts;
}

// ── Constants ─────────────────────────────────────────

const ALL_DEVICES = ["sensor-1", "sensor-2", "sensor-3"];

const PARAM_RANGES = {
  ammonia:         { min: 0.01, max: 0.15, decimals: 3 },
  temperature:     { min: 25,   max: 32,   decimals: 1 },
  dissolvedOxygen: { min: 5.5,  max: 8.5,  decimals: 1 },
  pH:              { min: 6.5,  max: 8.5,  decimals: 1 },
  turbidity:       { min: 1,    max: 8,    decimals: 1 },
};

// ── Helpers ───────────────────────────────────────────

function round(val, decimals) {
  const factor = 10 ** decimals;
  return Math.round(val * factor) / factor;
}

function randomInRange(min, max) {
  return min + Math.random() * (max - min);
}

function generateReading() {
  const values = {};
  for (const [param, cfg] of Object.entries(PARAM_RANGES)) {
    values[param] = round(randomInRange(cfg.min, cfg.max), cfg.decimals);
  }
  return values;
}

function msToNextInterval(intervalMs) {
  return intervalMs - (Date.now() % intervalMs);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── Main ──────────────────────────────────────────────

async function main() {
  loadEnv();

  const url = process.env.FIREBASE_RTDB_URL;
  if (!url) {
    console.error("Error: FIREBASE_RTDB_URL not set in .env or environment.");
    process.exit(1);
  }

  BASE = url.replace(/\/+$/, "");
  const { device } = parseArgs();
  const devices = device ? [device] : ALL_DEVICES;

  console.log(`Firebase RTDB: ${BASE}`);
  console.log(`Devices:       ${devices.join(", ")}`);
  console.log();

  // Calculate time to next 5-minute boundary
  const msToNext = msToNextInterval(5 * 60 * 1000);
  const nextBoundary = new Date(Date.now() + msToNext);
  console.log(`Waiting ${Math.round(msToNext / 1000)}s until next 5-min boundary (${nextBoundary.toLocaleTimeString()})...`);
  await sleep(msToNext);

  // Single reading
  const ts1 = Date.now();
  console.log(`\n--- Reading at ${new Date(ts1).toLocaleTimeString()} ---`);
  for (const deviceId of devices) {
    const values = generateReading();
    await rtdbPut(`/readings/${deviceId}/${ts1}`, values);
    const sec = Math.floor(ts1 / 1000);
    await rtdbPatch(`/latest/${deviceId}`, { ...values, ts: sec });
    console.log(`  ${deviceId}: ${JSON.stringify(values)}`);
  }

  console.log(`\n✅ Done. 1 reading written for ${devices.length} device(s).`);
  console.log(`   Check the parameters screen — data should update after the next 5-min refetch.`);
}

main().catch((err) => {
  console.error("Script failed:", err);
  process.exit(1);
});
