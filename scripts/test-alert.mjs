// Posts a single test alert so the app's notification badge/screen and the
// push relay can be checked without waiting for a real threshold breach.
// Usage: node scripts/test-alert.mjs [--device sensor-1]

import { requireRtdbUrl, rtdbPost } from "./lib/rtdb.mjs";

// ── CLI Args ──────────────────────────────────────────

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {
    device: "sensor-1",
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--device" && args[i + 1]) opts.device = args[++i];
  }

  return opts;
}

// ── Main ────────────────────────────────────────────────

async function main() {
  const BASE = requireRtdbUrl();
  const { device } = parseArgs();

  console.log(`Firebase RTDB: ${BASE}`);
  console.log(`Device:        ${device}`);
  console.log();

  const alert = {
    title: "TEST ALERT",
    parameter: "ammonia",
    value: 0.07,
    threshold: 0.06,
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
