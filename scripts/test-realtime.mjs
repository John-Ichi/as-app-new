// Writes a single live reading per device at the next 5-minute boundary to
// verify the app's realtime subscriptions end-to-end.
// Usage: node scripts/test-realtime.mjs [--device sensor-1] [--ammonia 0.25]

import { requireRtdbUrl, rtdbPatch, rtdbPut } from "./lib/rtdb.mjs";
import { DEVICES, round } from "./lib/simulate.mjs";

const ALL_DEVICES = DEVICES.map((d) => d.id);

// Loose plausible ranges for a single spot reading (not the sinusoidal model
// used by the seed scripts).
const PARAM_RANGES = {
  ammonia:         { min: 0.01, max: 0.15, decimals: 3 },
  temperature:     { min: 25,   max: 32,   decimals: 1 },
  dissolvedOxygen: { min: 5.5,  max: 8.5,  decimals: 1 },
  pH:              { min: 6.5,  max: 8.5,  decimals: 1 },
  turbidity:       { min: 1,    max: 8,    decimals: 1 },
  salinity:        { min: 12,   max: 18,   decimals: 1 },
};

// ── CLI Args ──────────────────────────────────────────

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {
    device: null,
    ammonia: null,
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--device") {
      if (!args[i + 1]) {
        console.error("Error: --device requires a value.");
        process.exit(1);
      }
      opts.device = args[++i];
    }
    if (args[i] === "--ammonia") {
      if (!args[i + 1]) {
        console.error("Error: --ammonia requires a value.");
        process.exit(1);
      }
      opts.ammonia = Number(args[++i]);
    }
  }

  if (opts.device !== null && !ALL_DEVICES.includes(opts.device)) {
    console.error(
      `Error: unknown device "${opts.device}". Valid devices: ${ALL_DEVICES.join(", ")}`,
    );
    process.exit(1);
  }

  if (opts.ammonia !== null && (!Number.isFinite(opts.ammonia) || opts.ammonia < 0)) {
    console.error("Error: --ammonia must be a non-negative number.");
    process.exit(1);
  }

  return opts;
}

// ── Helpers ────────────────────────────────────────────

function randomInRange(min, max) {
  return min + Math.random() * (max - min);
}

function generateReading(ammoniaOverride = null) {
  const values = {};
  for (const [param, cfg] of Object.entries(PARAM_RANGES)) {
    values[param] =
      param === "ammonia" && ammoniaOverride !== null
        ? round(ammoniaOverride, cfg.decimals)
        : round(randomInRange(cfg.min, cfg.max), cfg.decimals);
  }
  return values;
}

function msToNextInterval(intervalMs) {
  return intervalMs - (Date.now() % intervalMs);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── Main ────────────────────────────────────────────────

async function main() {
  const BASE = requireRtdbUrl();
  const { device, ammonia } = parseArgs();
  const devices = device ? [device] : ALL_DEVICES;

  console.log(`Firebase RTDB: ${BASE}`);
  console.log(`Devices:       ${devices.join(", ")}`);
  if (ammonia !== null) console.log(`Ammonia:       ${round(ammonia, PARAM_RANGES.ammonia.decimals)} (override)`);
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
    const values = generateReading(ammonia);
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
