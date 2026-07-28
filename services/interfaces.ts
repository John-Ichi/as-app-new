import type { Device, WaterQualityData, ParameterGraphData, AppNotification } from "@/services/types";

export interface DeviceService {
  getDevices(): Promise<Device[]>;
}

export interface WaterQualityService {
  getData(deviceId: string): Promise<WaterQualityData>;
}

export interface GraphDataService {
  getData(deviceId: string): Promise<ParameterGraphData[]>;
}

export interface NotificationService {
  getNotifications(deviceId: string): Promise<AppNotification[]>;
}
