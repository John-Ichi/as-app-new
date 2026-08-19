import fs from "fs";
import path from "path";

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

loadEnv();

const FIREBASE_RTDB_URL = process.env.FIREBASE_RTDB_URL;
const EXPO_ACCESS_TOKEN = process.env.EXPO_ACCESS_TOKEN;

if (!FIREBASE_RTDB_URL || !EXPO_ACCESS_TOKEN) {
  console.error("Missing FIREBASE_RTDB_URL or EXPO_ACCESS_TOKEN");
  process.exit(1);
}

function desanitizeToken(token) {
  return token.replace(/_lb_/g, "[").replace(/_rb_/g, "]");
}

async function main() {
  const devicesResponse = await fetch(`${FIREBASE_RTDB_URL}/devices.json`);
  const devices = await devicesResponse.json();

  if (!devices) {
    console.log("No devices found");
    return;
  }

  let totalSent = 0;

  for (const deviceId of Object.keys(devices)) {
    const alertsResponse = await fetch(
      `${FIREBASE_RTDB_URL}/alerts/${deviceId}.json?orderBy="read"&equalTo=false`
    );
    const alerts = await alertsResponse.json();

    if (!alerts) continue;

    const unpushed = Object.entries(alerts).filter(
      ([_, alert]) => !alert.pushed
    );

    if (unpushed.length === 0) continue;

    const tokensResponse = await fetch(
      `${FIREBASE_RTDB_URL}/devices/${deviceId}/pushTokens.json`
    );
    const tokens = await tokensResponse.json();

    if (!tokens) continue;

    const expoTokens = Object.keys(tokens);

    for (const [alertId, alert] of unpushed) {
      if (!alert.title || alert.parameter == null || alert.value == null) {
        console.warn(`Skipping malformed alert ${alertId} on ${deviceId}`);
        continue;
      }

      const messages = expoTokens.map((token) => ({
        to: desanitizeToken(token),
        sound: "default",
        title: alert.title,
        body: `${alert.parameter}: ${alert.value}`,
        data: { deviceId, alertId, url: "/notifications" },
        channelId: "alerts",
      }));

      const response = await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${EXPO_ACCESS_TOKEN}`,
        },
        body: JSON.stringify(messages),
      });

      if (response.ok) {
        await fetch(
          `${FIREBASE_RTDB_URL}/alerts/${deviceId}/${alertId}/pushed.json`,
          {
            method: "PUT",
            body: "true",
          }
        );
        totalSent++;
      }
    }
  }

  console.log(`Push relay complete. Sent: ${totalSent}`);
}

main().catch((error) => {
  console.error("Push relay error:", error);
  process.exit(1);
});
