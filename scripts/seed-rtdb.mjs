// Full seed: devices, a rolling 365-day window of hourly readings, and
// state-change alerts.
// Usage: node scripts/seed-rtdb.mjs [--device sensor-1] [--dry-run] [--no-alerts]

import { requireRtdbUrl, rtdbPatch } from "./lib/rtdb.mjs";
import {
  ALERT_COOLDOWN_HRS,
  generateAlerts,
  generateReading,
} from "./lib/simulate.mjs";
import {
  ensureDevices,
  parseWindowArgs,
  previewWindow,
  printBanner,
  resolveTargets,
  seedDeviceWindow,
} from "./lib/window.mjs";

const INTERVAL_MIN = 60;
const DAYS = 365;
const SLOTS_PER_DAY = (24 * 60) / INTERVAL_MIN; // 24
const TOTAL_READINGS = SLOTS_PER_DAY * DAYS; // 8,760
const SLOT_MS = INTERVAL_MIN * 60 * 1000;

async function main() {
  const { device: deviceArg, dryRun } = parseWindowArgs();
  const noAlerts = process.argv.includes("--no-alerts");
  const base = dryRun ? null : requireRtdbUrl();
  const targets = resolveTargets(deviceArg);

  // Rolling window ending at the last completed top-of-hour.
  const end = Math.floor(Date.now() / SLOT_MS) * SLOT_MS;
  const start = end - (TOTAL_READINGS - 1) * SLOT_MS;

  printBanner({
    base,
    windowLabel: `past ${DAYS} days`,
    start,
    end,
    targets,
    readingsPerDevice: TOTAL_READINGS,
    intervalMin: INTERVAL_MIN,
    alerts: noAlerts
      ? "disabled"
      : `state change, ${ALERT_COOLDOWN_HRS}h cooldown`,
  });

  if (dryRun) {
    previewWindow(targets, {
      start,
      slots: TOTAL_READINGS,
      slotMs: SLOT_MS,
    });

    if (!noAlerts) {
      const sampleReadings = [];
      for (let i = 0; i < TOTAL_READINGS; i++) {
        const ts = start + i * SLOT_MS;
        sampleReadings.push({
          ts,
          values: generateReading(ts, Math.floor(i / SLOTS_PER_DAY)),
        });
      }
      const sampleAlerts = Object.values(generateAlerts(sampleReadings, end));
      const unread = sampleAlerts.filter((alert) => !alert.read).length;
      console.log(
        `\nSample alerts for ${targets[0].id}: ${sampleAlerts.length} (${unread} unread)`,
      );
      for (const alert of sampleAlerts.slice(0, 5)) {
        console.log(
          `  ${alert.type.toUpperCase()}  ${alert.parameter}: ${alert.value} (threshold: ${alert.threshold})`,
        );
      }
      if (sampleAlerts.length > 5) {
        console.log(`  ... and ${sampleAlerts.length - 5} more`);
      }
    } else {
      console.log("\nAlerts disabled (--no-alerts).");
    }

    console.log("\nDry-run complete. Run without --dry-run to write to RTDB.");
    return;
  }

  await ensureDevices();

  let totalNew = 0;
  for (const device of targets) {
    const { newCount, readingsBatch } = await seedDeviceWindow({
      deviceId: device.id,
      start,
      slots: TOTAL_READINGS,
      slotMs: SLOT_MS,
    });
    totalNew += newCount;

    if (!noAlerts) {
      const deviceReadings = Object.entries(readingsBatch).map(
        ([ts, values]) => ({ ts: Number(ts), values }),
      );
      const alerts = generateAlerts(deviceReadings, end);
      const alertCount = Object.keys(alerts).length;
      const unread = Object.values(alerts).filter((alert) => !alert.read).length;

      if (alertCount > 0) {
        await rtdbPatch(`/alerts/${device.id}`, alerts);
      }
      console.log(`  ${device.id}: ${alertCount} alerts written (${unread} unread)`);
    }
  }

  console.log(
    `\n✅ Done. ${totalNew} new readings written across ${targets.length} device(s).`,
  );
}

main().catch((err) => {
  console.error("Script failed:", err);
  process.exit(1);
});
