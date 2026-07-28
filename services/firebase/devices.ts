import { db } from "@/firebase/config";
import type { Device } from "@/services/types";
import { get, ref } from "firebase/database";

export async function getDevices(): Promise<Device[]> {
  const snapshot = await get(ref(db, "devices"));
  const data = snapshot.val();
  if (!data) return [];
  return Object.entries(data).map(([id, device]: [string, any]) => ({
    id,
    name: device.name,
    location: device.location,
  }));
}
