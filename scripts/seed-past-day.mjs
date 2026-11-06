// Seeds the past 24 hours of readings (hourly cadence) for all devices.
// Usage: node scripts/seed-past-day.mjs [--device sensor-1] [--dry-run]

import { requireRtdbUrl } from "./lib/rtdb.mjs";
import {
  ensureDevices,
  parseWindowArgs,
  previewWindow,
  printBanner,
  resolveTargets,
  seedDeviceWindow,
} from "./lib/window.mjs";

const INTERVAL_MIN = 60;
const SLOTS = 24; // past 24 hours at hourly cadence
const SLOT_MS = INTERVAL_MIN * 60 * 1000;

async function main() {
  const { device: deviceArg, dryRun } = parseWindowArgs();
  const base = dryRun ? null : requireRtdbUrl();
  const targets = resolveTargets(deviceArg);

  // Window ending at the last completed top-of-hour.
  const end = Math.floor(Date.now() / SLOT_MS) * SLOT_MS;
  const start = end - (SLOTS - 1) * SLOT_MS;

  printBanner({
    base,
    windowLabel: "past 24 hours",
    start,
    end,
    targets,
    readingsPerDevice: SLOTS,
    intervalMin: INTERVAL_MIN,
  });

  if (dryRun) {
    previewWindow(targets, { start, slots: SLOTS, slotMs: SLOT_MS });
    console.log("\nDry-run complete. Run without --dry-run to write to RTDB.");
    return;
  }

  await ensureDevices();

  let totalNew = 0;
  for (const device of targets) {
    const { newCount } = await seedDeviceWindow({
      deviceId: device.id,
      start,
      slots: SLOTS,
      slotMs: SLOT_MS,
    });
    totalNew += newCount;
  }

  console.log(
    `\n✅ Done. ${totalNew} new readings written across ${targets.length} device(s).`,
  );
}

main().catch((err) => {
  console.error("Script failed:", err);
  process.exit(1);
});
