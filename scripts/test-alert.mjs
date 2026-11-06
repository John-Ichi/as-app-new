// Posts a single test alert so the app's notification badge/screen and the
// push relay can be checked without waiting for a real threshold breach.
// Usage: node scripts/test-alert.mjs [--device sensor-1] [--type warning|critical]

import { requireRtdbUrl, rtdbPost } from "./lib/rtdb.mjs";

// ── CLI Args ──────────────────────────────────────────

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {
    device: "sensor-1",
    type: "warning",
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--device" && args[i + 1]) opts.device = args[++i];
    if (args[i] === "--type" && args[i + 1]) opts.type = args[++i];
  }

  if (!["warning", "critical"].includes(opts.type)) {
    console.error(`Error: --type must be "warning" or "critical", got "${opts.type}"`);
    process.exit(1);
  }

  return opts;
}

// ── Main ────────────────────────────────────────────────

async function main() {
  const BASE = requireRtdbUrl();
  const { device, type } = parseArgs();

  console.log(`Firebase RTDB: ${BASE}`);
  console.log(`Device:        ${device}`);
  console.log(`Type:          ${type}`);
  console.log();

  const alert = {
    type,
    title: `${type === "critical" ? "CRITICAL" : "WARNING"} TEST ALERT`,
    parameter: "ammonia",
    value: 0.07,
    threshold: type === "critical" ? 0.2 : 0.06,
    ts: Math.round(Date.now() / 1000 / 300) * 300,
    read: false,
    pushed: false,
  };

  const result = await rtdbPost(`/alerts/${device}`, alert);

  console.log(`✓ Test alert written to /alerts/${device}/${result.name}`);
  console.log();
  console.log("Check your app — the badge should update and the alert should appear on the notifications page.");
}

main().catch((err) => {
  console.error("Script failed:", err);
  process.exit(1);
});
