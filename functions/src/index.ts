import { onValueWritten } from "firebase-functions/v2/database";
import { getDatabase } from "firebase-admin/database";
import { initializeApp } from "firebase-admin/app";

initializeApp();

const EXPO_ACCESS_TOKEN = process.env.EXPO_ACCESS_TOKEN;

interface AlertData {
  type: "warning" | "critical";
  title: string;
  parameter: string;
  value: number;
  ts: number;
  read: boolean;
}

interface PushTokens {
  [token: string]: true;
}

export const onAlertCreated = onValueWritten(
  "/alerts/{deviceId}/{pushId}",
  async (event) => {
    const { deviceId } = event.params;

    // Only trigger on new alerts (not updates/deletes)
    if (!event.data.after.exists()) return;

    const alert = event.data.after.val() as AlertData;

    // Fetch device push tokens
    const db = getDatabase();
    const tokensSnap = await db
      .ref(`devices/${deviceId}/pushTokens`)
      .once("value");
    const tokens = tokensSnap.val() as PushTokens | null;

    if (!tokens) return;

    const expoTokens = Object.keys(tokens);

    // Send push notifications via Expo Push API
    const messages = expoTokens.map((token) => ({
      to: token,
      sound: "default",
      title: alert.title,
      body: `${alert.parameter}: ${alert.value}`,
      data: { deviceId, url: "/notifications" },
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

    const result = await response.json();
    console.log(`Push sent to ${expoTokens.length} devices:`, result);
  }
);
