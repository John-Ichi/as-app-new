import { db } from "@/firebase/config";
import type { AppNotification } from "@/services/types";
import {
  limitToLast,
  onValue,
  orderByChild,
  query,
  ref,
  update,
} from "firebase/database";

function formatTimestamp(ts: number): string {
  return new Date(ts * 1000).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function subscribeNotifications(
  deviceId: string,
  onData: (data: AppNotification[]) => void,
  onError: (error: Error) => void,
  cutoffDays: number = 3,
): () => void {
  const alertsRef = ref(db, `alerts/${deviceId}`);
  const cutoffTimestamp = (Date.now() - Math.max(0, cutoffDays) * 24 * 60 * 60 * 1000) / 1000;

  const unsubscribe = onValue(
    query(alertsRef, orderByChild("ts"), limitToLast(300)),
    (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        onData([]);
        return;
      }

      const notifications = Object.entries(data)
        .map(([id, alert]: [string, any]) => ({
          id,
          type: alert.type,
          title: alert.title,
          date: formatTimestamp(alert.ts),
          read: alert.read ?? false,
          parameter: alert.parameter,
          value: alert.value,
          ts: alert.ts,
        }))
        .filter((n) => !n.read || n.ts > cutoffTimestamp)
        .reverse();

      onData(notifications);
    },
    onError,
  );

  return unsubscribe;
}

export async function acknowledgeNotification(
  deviceId: string,
  pushId: string,
): Promise<void> {
  const alertRef = ref(db, `alerts/${deviceId}/${pushId}`);
  await update(alertRef, { read: true });
}
