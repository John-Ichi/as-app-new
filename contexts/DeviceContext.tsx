import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Device } from "@/services/types";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

interface DeviceContextValue {
  selectedDevice: Device | null;
  selectDevice: (device: Device | null) => void;
  lastDevice: Device | null;
  isHydrated: boolean;
}

const DeviceContext = createContext<DeviceContextValue | null>(null);

const SELECTED_DEVICE_KEY = "selected-device";
const LAST_DEVICE_KEY = "last-device";

function isDevice(value: unknown): value is Device {
  if (typeof value !== "object" || value === null) return false;
  const device = value as Record<string, unknown>;
  return (
    typeof device.id === "string" &&
    typeof device.name === "string" &&
    typeof device.location === "string"
  );
}

async function readDevice(key: string): Promise<Device | null> {
  try {
    const stored = await AsyncStorage.getItem(key);
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    return isDevice(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function DeviceProvider({ children }: { children: ReactNode }) {
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [lastDevice, setLastDevice] = useState<Device | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    Promise.all([readDevice(SELECTED_DEVICE_KEY), readDevice(LAST_DEVICE_KEY)])
      .then(([selected, last]) => {
        setSelectedDevice(selected);
        setLastDevice(last);
      })
      .finally(() => setIsHydrated(true));
  }, []);

  const selectDevice = useCallback((device: Device | null) => {
    setSelectedDevice(device);
    if (device) {
      setLastDevice(device);
      AsyncStorage.multiSet([
        [SELECTED_DEVICE_KEY, JSON.stringify(device)],
        [LAST_DEVICE_KEY, JSON.stringify(device)],
      ]).catch(() => {});
    } else {
      AsyncStorage.removeItem(SELECTED_DEVICE_KEY).catch(() => {});
    }
  }, []);

  return (
    <DeviceContext.Provider
      value={{ selectedDevice, selectDevice, lastDevice, isHydrated }}
    >
      {children}
    </DeviceContext.Provider>
  );
}

export function useDevice(): DeviceContextValue {
  const ctx = useContext(DeviceContext);
  if (!ctx) throw new Error("useDevice must be used within a DeviceProvider.");
  return ctx;
}
