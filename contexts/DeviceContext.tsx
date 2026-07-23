import { createContext, type ReactNode, useContext, useState } from "react";

export interface Device {
  id: string;
  name: string;
  location: string;
}

interface DeviceContextValue {
  selectedDevice: Device | null;
  selectDevice: (device: Device | null) => void;
}

const DeviceContext = createContext<DeviceContextValue | null>(null);

export function DeviceProvider({ children }: { children: ReactNode }) {
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  return (
    <DeviceContext.Provider
      value={{ selectedDevice, selectDevice: setSelectedDevice }}
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
