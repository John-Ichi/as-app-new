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
      if (!process.env[key]) process.env[key] = val;
    }
  }
}

// ── REST Helpers ──────────────────────────────────────

let BASE = "";

async function rtdbPost(path, data) {
  const res = await fetch(`${BASE}${path}.json`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`POST ${path}: ${res.status} ${await res.text()}`);
  return res.json();
}

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

// ── Main ──────────────────────────────────────────────

async function main() {
  loadEnv();

  const url = process.env.FIREBASE_RTDB_URL;
  if (!url) {
    console.error("Error: FIREBASE_RTDB_URL not set in .env or environment.");
    process.exit(1);
  }

  BASE = url.replace(/\/+$/, "");
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
