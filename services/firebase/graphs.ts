import { parameterIds, type ParameterId } from "@/constants/parameters";
import { db } from "@/firebase/config";
import type { GraphDataPoint, ParameterGraphData } from "@/services/types";
import { get, limitToLast, orderByKey, query, ref } from "firebase/database";

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export async function fetchReadings(
  deviceId: string,
  limit: number,
): Promise<Record<string, Record<string, number>>> {
  const snapshot = await get(
    query(ref(db, `readings/${deviceId}`), orderByKey(), limitToLast(limit)),
  );
  return snapshot.val() ?? {};
}

function averageGroups(
  keys: string[],
  readings: Record<string, Record<string, number>>,
  id: ParameterId,
  groupSize: number,
  labelFn: (groupKeys: string[]) => string | undefined,
): GraphDataPoint[] {
  const points: GraphDataPoint[] = [];

  for (let i = 0; i < keys.length; i += groupSize) {
    const group = keys.slice(i, i + groupSize);
    const avg = round(
      group.reduce((sum, key) => sum + readings[key][id], 0) / group.length,
      3,
    );
    points.push({
      value: avg,
      label: labelFn(group),
    });
  }

  return points;
}

function hourlyLabel(groupKeys: string[]): string | undefined {
  const mid = groupKeys[Math.floor(groupKeys.length / 2)];
  const hour = new Date(Number(mid)).getHours();
  return hour % 2 === 0 ? `${String(hour).padStart(2, "0")}:00` : undefined;
}

function halfHourLabel(groupKeys: string[]): string {
  const mid = groupKeys[Math.floor(groupKeys.length / 2)];
  const d = new Date(Number(mid));
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function dailyLabel(groupKeys: string[]): string | undefined {
  const mid = groupKeys[Math.floor(groupKeys.length / 2)];
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return days[new Date(Number(mid)).getDay()];
}

export async function getRawReadings(
  deviceId: string,
  id: ParameterId,
  limit: number,
): Promise<{ keys: string[]; values: number[] }> {
  const raw = await fetchReadings(deviceId, limit);
  const keys = Object.keys(raw).sort();
  return {
    keys,
    values: keys.map((key) => raw[key][id]),
  };
}

export async function getGraphData(
  deviceId: string,
): Promise<ParameterGraphData[]> {
  const [oneDayRaw, sevenDayRaw] = await Promise.all([
    fetchReadings(deviceId, 288),
    fetchReadings(deviceId, 2016),
  ]);

  const oneDayKeys = Object.keys(oneDayRaw).sort();
  const sevenDayKeys = Object.keys(sevenDayRaw).sort();

  return parameterIds.map((id) => ({
    id,
    oneDay: averageGroups(oneDayKeys, oneDayRaw, id, 12, hourlyLabel),
    sevenDay: averageGroups(sevenDayKeys, sevenDayRaw, id, 288, dailyLabel),
  }));
}

export async function getHalfHourData(
  deviceId: string,
  id: ParameterId,
): Promise<GraphDataPoint[]> {
  const raw = await fetchReadings(deviceId, 288);
  const keys = Object.keys(raw).sort();
  return averageGroups(keys, raw, id, 6, halfHourLabel);
}

export async function getAllHalfHourData(
  deviceId: string,
): Promise<{ id: ParameterId; points: GraphDataPoint[] }[]> {
  const raw = await fetchReadings(deviceId, 288);
  const keys = Object.keys(raw).sort();
  return parameterIds.map((id) => ({
    id,
    points: averageGroups(keys, raw, id, 6, halfHourLabel),
  }));
}
