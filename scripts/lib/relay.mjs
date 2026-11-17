// Shared push-relay logic used by both the Cloudflare Worker (worker.js) and
// the local CLI runner (scripts/push-relay.mjs). Pure fetch-based — no
// runtime-specific APIs — so both environments can import it.

export function desanitizeToken(token) {
  return token.replace(/_lb_/g, "[").replace(/_rb_/g, "]");
}

export async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Request failed (${res.status}): ${url}`);
  }
  return res.json();
}

export async function markPushed(url) {
  const res = await fetch(url, { method: "PUT", body: "true" });
  if (!res.ok) {
    console.error(`Failed to mark alert as pushed (${res.status}): ${url}`);
    return false;
  }
  return true;
}

export async function runRelay(env) {
  const { FIREBASE_RTDB_URL, EXPO_ACCESS_TOKEN } = env;

  if (!FIREBASE_RTDB_URL || !EXPO_ACCESS_TOKEN) {
    throw new Error("Missing FIREBASE_RTDB_URL or EXPO_ACCESS_TOKEN");
  }

  const devices = await fetchJson(`${FIREBASE_RTDB_URL}/devices.json`);

  if (!devices) {
    console.log("No devices found");
    return;
  }

  let totalSent = 0;

  for (const deviceId of Object.keys(devices)) {
    const alerts = await fetchJson(
      `${FIREBASE_RTDB_URL}/alerts/${deviceId}.json?orderBy="read"&equalTo=false`
    );

    if (!alerts) continue;

    const unpushed = Object.entries(alerts).filter(
      ([_, alert]) => !alert.pushed && !alert.deleted
    );

    if (unpushed.length === 0) continue;

    const tokens = await fetchJson(
      `${FIREBASE_RTDB_URL}/devices/${deviceId}/pushTokens.json`
    );

    if (!tokens) continue;

    const expoTokens = Object.keys(tokens);

    for (const [alertId, alert] of unpushed) {
      if (!alert.title || alert.parameter == null || alert.value == null) {
        console.warn(`Skipping malformed alert ${alertId} on ${deviceId}`);
        await markPushed(
          `${FIREBASE_RTDB_URL}/alerts/${deviceId}/${alertId}/pushed.json`
        );
        continue;
      }

      const messages = expoTokens.map((token) => ({
        to: desanitizeToken(token),
        sound: "default",
        title: alert.title,
        body: `${alert.parameter}: ${alert.value}`,
        data: { deviceId, alertId, url: "/notifs" },
        channelId: "alerts",
      }));

      // Expo's push API accepts at most 100 messages per request.
      const batches = [];
      for (let i = 0; i < messages.length; i += 100) {
        batches.push(messages.slice(i, i + 100));
      }

      let anyDelivered = false;
      let allDelivered = true;
      for (const batch of batches) {
        const response = await fetch("https://exp.host/--/api/v2/push/send", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${EXPO_ACCESS_TOKEN}`,
          },
          body: JSON.stringify(batch),
        });

        if (!response.ok) {
          allDelivered = false;
          continue;
        }

        // HTTP 200 still carries per-message tickets — a token can fail
        // (invalid/expired) while the request itself succeeds.
        const result = await response.json();
        const tickets = result?.data ?? [];
        for (const ticket of tickets) {
          if (ticket.status === "error") {
            allDelivered = false;
            console.error(
              `Expo push ticket error for ${alertId} on ${deviceId}: ${ticket.message ?? "unknown error"} (details: ${JSON.stringify(ticket.details ?? {})})`
            );
          }
        }
        if (tickets.some((ticket) => ticket.status === "ok")) {
          anyDelivered = true;
        } else {
          allDelivered = false;
        }
      }

      // Delivered if at least one ticket succeeded (a single bad token among
      // good ones doesn't trap the alert in a retry loop). All-failed batches
      // stay unpushed and retry on the next cron.
      if (anyDelivered) {
        const marked = await markPushed(
          `${FIREBASE_RTDB_URL}/alerts/${deviceId}/${alertId}/pushed.json`
        );
        if (marked) totalSent++;
      } else {
        console.error(
          `No successful Expo deliveries for ${alertId} on ${deviceId} — will retry on the next cron.`
        );
      }
    }
  }

  console.log(`Push relay complete. Sent: ${totalSent}`);
}
