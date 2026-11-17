import fs from "fs";
import path from "path";

import { runRelay } from "./lib/relay.mjs";

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

loadEnv();

const FIREBASE_RTDB_URL = process.env.FIREBASE_RTDB_URL;
const EXPO_ACCESS_TOKEN = process.env.EXPO_ACCESS_TOKEN;

if (!FIREBASE_RTDB_URL || !EXPO_ACCESS_TOKEN) {
  console.error("Missing FIREBASE_RTDB_URL or EXPO_ACCESS_TOKEN");
  process.exit(1);
}

runRelay({ FIREBASE_RTDB_URL, EXPO_ACCESS_TOKEN }).catch((error) => {
  console.error("Push relay error:", error);
  process.exit(1);
});
