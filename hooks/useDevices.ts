import type { Device } from "@/contexts/DeviceContext";

export function useDevices(): Device[] {
  return [
    { id: "sensor-1", name: "Pond A", location: "Tank A" },
    { id: "sensor-2", name: "Pond B", location: "Tank B" },
    { id: "sensor-3", name: "Pond C", location: "Tank C" },
  ];
}
