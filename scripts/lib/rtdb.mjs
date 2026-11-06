// Shared Firebase Realtime Database REST helpers for the seed/test scripts.
// Infrastructure only: nothing here knows about the data shape.
//
// Call requireRtdbUrl() once up front (loads .env, validates the URL), then
// use the request helpers. updateLatestIfNewer() guards /latest against
// being regressed by historical backfills.

import fs from "fs";
import path from "path";

let BASE = "";

function ensureBase() {
  if (!BASE) {
    throw new Error("RTDB base URL not set — call requireRtdbUrl() first.");
  }
}

// ── Config ─────────────────────────────────────────────

export function loadEnv() {
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

/** Loads .env, validates FIREBASE_RTDB_URL, and returns the REST base URL. */
export function requireRtdbUrl() {
  loadEnv();
  const url = process.env.FIREBASE_RTDB_URL;
  if (!url) {
    console.error("Error: FIREBASE_RTDB_URL not set in .env or environment.");
    process.exit(1);
  }
  BASE = url.replace(/\/+$/, "");
  return BASE;
}

// ── REST Helpers ──────────────────────────────────────

export async function rtdbPut(rtdbPath, data) {
  ensureBase();
  const res = await fetch(`${BASE}${rtdbPath}.json`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`PUT ${rtdbPath}: ${res.status} ${await res.text()}`);
  return res.json();
}

export async function rtdbPatch(rtdbPath, data) {
  ensureBase();
  const res = await fetch(`${BASE}${rtdbPath}.json`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`PATCH ${rtdbPath}: ${res.status} ${await res.text()}`);
  return res.json();
}

export async function rtdbPost(rtdbPath, data) {
  ensureBase();
  const res = await fetch(`${BASE}${rtdbPath}.json`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`POST ${rtdbPath}: ${res.status} ${await res.text()}`);
  return res.json();
}

export async function rtdbGet(rtdbPath, shallow = false) {
  ensureBase();
  const url = shallow
    ? `${BASE}${rtdbPath}.json?shallow=true`
    : `${BASE}${rtdbPath}.json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`GET ${rtdbPath}: ${res.status} ${await res.text()}`);
  return res.json();
}

async function rtdbGetWithEtag(rtdbPath) {
  ensureBase();
  const res = await fetch(`${BASE}${rtdbPath}.json`, {
    headers: { "X-Firebase-ETag": "true" },
  });
  if (!res.ok) throw new Error(`GET ${rtdbPath}: ${res.status} ${await res.text()}`);
  const data = await res.json();
  // RTDB uses the literal "null_etag" when the location is empty.
  return {
    data,
    etag: res.headers.get("ETag") ?? (data === null ? "null_etag" : null),
  };
}

// Conditional writes only work with PUT/DELETE in RTDB (PATCH returns 400),
// so this replaces the whole node at the given path.
async function rtdbPutConditional(rtdbPath, data, etag) {
  const headers = { "Content-Type": "application/json" };
  if (etag) headers["if-match"] = etag;
  return fetch(`${BASE}${rtdbPath}.json`, {
    method: "PUT",
    headers,
    body: JSON.stringify(data),
  });
}

// ── /latest Guard ─────────────────────────────────────

function toEpochSeconds(value) {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  // Same heuristic as the app: values >= 1e12 are milliseconds.
  return value < 1e12 ? value : value / 1000;
}

/**
 * Advances /latest/<device> only when the candidate reading is strictly newer
 * than what's stored, so a historical backfill can't regress it. Retries on
 * ETag conflicts (412) when a concurrent writer wins.
 */
export async function updateLatestIfNewer(deviceId, tsMs, values) {
  const rtdbPath = `/latest/${deviceId}`;
  const candidateTs = Math.floor(tsMs / 1000);

  for (let attempt = 0; attempt < 3; attempt++) {
    const { data, etag } = await rtdbGetWithEtag(rtdbPath);
    const existing = data && typeof data === "object" ? data : {};
    const storedTs =
      toEpochSeconds(existing.ts) ?? toEpochSeconds(existing.timestamp);
    // Write only when strictly newer; equal/older must not regress latest.
    if (storedTs !== null && candidateTs <= storedTs) return false;

    // PUT replaces the node, so carry over any existing fields.
    const payload = { ...existing, ...values, ts: candidateTs };
    const res = await rtdbPutConditional(rtdbPath, payload, etag);
    if (res.status === 412) continue; // concurrent writer won; re-read and retry
    if (!res.ok) throw new Error(`PUT ${rtdbPath}: ${res.status} ${await res.text()}`);
    return true;
  }
  return false;
}
