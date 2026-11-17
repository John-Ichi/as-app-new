// Shared orchestration for the window-based seed scripts: CLI parsing,
// banners, device bootstrapping, and the "write one window of readings" flow.

import { rtdbGet, rtdbPatch, updateLatestIfNewer } from "./rtdb.mjs";
import { DEVICES, generateReading } from "./simulate.mjs";

const DAY_MS = 24 * 60 * 60 * 1000;

function slotsPerDayFor(slotMs) {
  return Math.floor(DAY_MS / slotMs);
}

// ── CLI Args ──────────────────────────────────────────

export function parseWindowArgs() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  let device = null;

  const deviceIdx = args.indexOf("--device");
  if (deviceIdx !== -1) {
    const next = args[deviceIdx + 1];
    if (!next) {
      console.error("Error: --device requires a value.");
      process.exit(1);
    }
    device = next;
  }

  return { device, dryRun };
}

export function resolveTargets(deviceArg) {
  const targets = deviceArg
    ? DEVICES.filter((d) => d.id === deviceArg)
    : DEVICES;
  if (targets.length === 0) {
    console.error(
      `Error: device "${deviceArg}" not found. Available: ${DEVICES.map((d) => d.id).join(", ")}`,
    );
    process.exit(1);
  }
  return targets;
}

// ── Output ────────────────────────────────────────────

export function printBanner({
  base,
  windowLabel,
  start,
  end,
  targets,
  readingsPerDevice,
  intervalMin,
  alerts = null,
}) {
  console.log(`Firebase RTDB: ${base ?? "(dry-run: URL not required)"}`);
  console.log(
    `Window:        ${windowLabel} (${new Date(start).toLocaleString()} → ${new Date(end).toLocaleString()})`,
  );
  console.log(`Devices:       ${targets.map((d) => d.id).join(", ")}`);
  console.log(
    `Readings:      ${readingsPerDevice} per device (${readingsPerDevice * targets.length} total)`,
  );
  console.log(`Interval:      ${intervalMin} minutes`);
  if (alerts !== null) console.log(`Alerts:        ${alerts}`);
  console.log("");
}

export function previewWindow(targets, { start, slots, slotMs }) {
  const slotsPerDay = slotsPerDayFor(slotMs);
  for (const device of targets) {
    console.log(`\n${device.id} (${device.name}) — first 3 readings:`);
    for (let i = 0; i < Math.min(3, slots); i++) {
      const ts = start + i * slotMs;
      const reading = generateReading(ts, Math.floor(i / slotsPerDay));
      console.log(
        `  #${i + 1}  ${new Date(ts).toISOString().slice(0, 16)} → ${JSON.stringify(reading)}`,
      );
    }
  }
}

// ── Seeding ────────────────────────────────────────────

/**
 * Idempotently ensures /devices exists so any seed script can bootstrap an
 * empty database. Uses PATCH (not PUT) so device children owned elsewhere —
 * e.g. registered push tokens — survive reseeding.
 */
export async function ensureDevices() {
  console.log("Seeding devices...");
  for (const device of DEVICES) {
    await rtdbPatch(`/devices/${device.id}`, {
      name: device.name,
      location: device.location,
    });
    console.log(`  ✓ ${device.id}`);
  }
}

/**
 * Writes one device's window of readings. Existing timestamps are skipped so
 * reruns are idempotent, and /latest is only advanced when strictly newer.
 * Returns the batch of newly written readings, keyed by timestamp.
 */
export async function seedDeviceWindow({ deviceId, start, slots, slotMs }) {
  // Fetch existing timestamps to skip.
  const existing = await rtdbGet(`/readings/${deviceId}`, true);
  const existingKeys = existing ? new Set(Object.keys(existing)) : new Set();

  const readingsBatch = {};
  let lastTs = 0;
  let lastValues = null;
  let skipped = 0;
  const slotsPerDay = slotsPerDayFor(slotMs);

  process.stdout.write(`  Generating ${deviceId}... `);

  for (let i = 0; i < slots; i++) {
    const ts = start + i * slotMs;
    if (existingKeys.has(String(ts))) {
      skipped++;
      continue;
    }
    const values = generateReading(ts, Math.floor(i / slotsPerDay));
    readingsBatch[ts] = values;
    lastTs = ts;
    lastValues = values;
  }

  const newCount = Object.keys(readingsBatch).length;

  if (newCount === 0) {
    process.stdout.write(`${skipped} skipped → nothing to write\n`);
    return { newCount, skipped, readingsBatch };
  }

  process.stdout.write(`${newCount} new, ${skipped} skipped → PATCH... `);
  await rtdbPatch(`/readings/${deviceId}`, readingsBatch);
  await updateLatestIfNewer(deviceId, lastTs, lastValues);
  process.stdout.write("latest ✓\n");

  return { newCount, skipped, readingsBatch };
}
