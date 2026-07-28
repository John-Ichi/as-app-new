import { db } from "@/firebase/config";
import type { AppNotification } from "@/services/types";
import { get, limitToLast, orderByChild, query, ref } from "firebase/database";

export async function getNotifications(
  deviceId: string,
): Promise<AppNotification[]> {
  const snapshot = await get(
    query(ref(db, `alerts/${deviceId}`), orderByChild("ts"), limitToLast(50)),
  );
  const data = snapshot.val();
  if (!data) return [];

  return Object.entries(data)
    .map(([id, alert]: [string, any]) => ({
      id,
      type: alert.type,
      title: alert.title,
      date: new Date(alert.ts * 1000).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }),
    }))
    .reverse();
}
