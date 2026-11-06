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
    month: "long",
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
  const cutoffTimestamp =
    (Date.now() - Math.max(0, cutoffDays) * 24 * 60 * 60 * 1000) / 1000;

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
          deleted: alert.deleted ?? false,
        }))
        .filter((notif) => notif.deleted !== true)
        .filter((notif) => notif.read !== true || notif.ts > cutoffTimestamp)
        .reverse();

      onData(notifications);
    },
    onError,
  );

  return unsubscribe;
}

export async function setNotificationRead(
  deviceId: string,
  pushId: string,
  read: boolean,
): Promise<void> {
  const alertRef = ref(db, `alerts/${deviceId}/${pushId}`);
  await update(alertRef, { read });
}

export async function deleteNotification(
  deviceId: string,
  pushId: string,
): Promise<void> {
  await update(ref(db, `alerts/${deviceId}/${pushId}`), { deleted: true });
}

export async function acknowledgeNotifications(
  deviceId: string,
  pushIds: string[],
): Promise<void> {
  if (pushIds.length === 0) return;
  const updates: Record<string, boolean> = {};
  pushIds.forEach((id) => {
    updates[`${id}/read`] = true;
  });
  await update(ref(db, `alerts/${deviceId}`), updates);
}

/** previous notification function */
export async function acknowledgeNotification(
  deviceId: string,
  pushId: string,
): Promise<void> {
  const alertRef = ref(db, `alerts/${deviceId}/${pushId}`);
  await update(alertRef, { read: true });
}
