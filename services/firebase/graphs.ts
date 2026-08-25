import { parameterIds, type ParameterId } from "@/constants/parameters";
import { db } from "@/firebase/config";
import type { GraphDataPoint, ParameterGraphData } from "@/services/types";
import {
  get,
  limitToLast,
  onValue,
  orderByKey,
  query,
  ref,
  startAt,
} from "firebase/database";

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

export async function fetchReadingsSince(
  deviceId: string,
  since: number,
): Promise<Record<string, Record<string, number>>> {
  const snapshot = await get(
    query(ref(db, `readings/${deviceId}`), orderByKey(), startAt(since.toString())),
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

function hourlyLabelForHour(hour: number): string | undefined {
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
): Promise<{ keys: string[]; values: number[] }> {
  const since = Date.now() - 24 * 60 * 60 * 1000;
  const raw = await fetchReadingsSince(deviceId, since);
  const keys = Object.keys(raw).sort();
  return {
    keys,
    values: keys.map((key) => raw[key][id]),
  };
}

function buildOneDayWallClock(
  readings: Record<string, Record<string, number>>,
): Record<ParameterId, GraphDataPoint[]> {
  const now = Date.now();
  const hourMs = 60 * 60 * 1000;
  const currentHourStart = Math.floor(now / hourMs) * hourMs;
  const buckets: number[] = Array.from(
    { length: 24 },
    (_, i) => currentHourStart - (23 - i) * hourMs,
  );

  const bucketsByHour = new Map<number, string[]>();
  for (const key of Object.keys(readings)) {
    const ts = Number(key);
    const hourStart = Math.floor(ts / hourMs) * hourMs;
    if (hourStart < buckets[0] || hourStart > buckets[23]) continue;
    const list = bucketsByHour.get(hourStart) ?? [];
    list.push(key);
    bucketsByHour.set(hourStart, list);
  }

  const result: Record<ParameterId, GraphDataPoint[]> = {} as Record<
    ParameterId,
    GraphDataPoint[]
  >;
  for (const id of parameterIds) {
    result[id] = buckets.map((hourStart) => {
      const groupKeys = bucketsByHour.get(hourStart) ?? [];
      if (groupKeys.length === 0) {
        return {
          value: NaN,
          label: hourlyLabelForHour(new Date(hourStart).getHours()),
        };
      }
      const avg = round(
        groupKeys.reduce((sum, k) => sum + readings[k][id], 0) / groupKeys.length,
        3,
      );
      return {
        value: avg,
        label: hourlyLabelForHour(new Date(hourStart).getHours()),
      };
    });
  }
  return result;
}

export async function getGraphData(
  deviceId: string,
): Promise<ParameterGraphData[]> {
  const now = Date.now();
  const oneDaySince = now - 24 * 60 * 60 * 1000;
  const sevenDaySince = now - 7 * 24 * 60 * 60 * 1000;

  const [oneDayRaw, sevenDayRaw] = await Promise.all([
    fetchReadingsSince(deviceId, oneDaySince),
    fetchReadingsSince(deviceId, sevenDaySince),
  ]);

  const sevenDayKeys = Object.keys(sevenDayRaw).sort();
  const oneDayBuckets = buildOneDayWallClock(oneDayRaw);

  return parameterIds.map((id) => ({
    id,
    oneDay: oneDayBuckets[id].map((p) => ({
      value: p.value,
      label: p.label,
    })),
    sevenDay: averageGroups(sevenDayKeys, sevenDayRaw, id, 288, dailyLabel),
  }));
}

export function isOneDayEmpty(data: ParameterGraphData[]): boolean {
  return (
    data.length === 0 ||
    data.every(
      (p) =>
        p.oneDay.length === 0 || p.oneDay.every((pt) => Number.isNaN(pt.value)),
    )
  );
}

export function isGraphDataEmpty(data: ParameterGraphData[]): boolean {
  return (
    data.length === 0 ||
    data.every(
      (p) =>
        (p.oneDay.length === 0 ||
          p.oneDay.every((pt) => Number.isNaN(pt.value))) &&
        p.sevenDay.length === 0,
    )
  );
}

export function subscribeRawReadings(
  deviceId: string,
  id: ParameterId,
  onData: (data: { keys: string[]; values: number[] }) => void,
  onError: (error: Error) => void,
): () => void {
  const since = Date.now() - 24 * 60 * 60 * 1000;
  const q = query(
    ref(db, `readings/${deviceId}`),
    orderByKey(),
    startAt(String(since)),
  );
  return onValue(
    q,
    (snapshot) => {
      const raw = (snapshot.val() ?? {}) as Record<string, Record<string, number>>;
      const now = Date.now();
      const cutoff = now - 24 * 60 * 60 * 1000;
      const keys = Object.keys(raw)
        .filter((k) => Number(k) >= cutoff)
        .sort();
      onData({ keys, values: keys.map((k) => raw[k][id]) });
    },
    onError,
  );
}

export function subscribeOneDay(
  deviceId: string,
  onData: (buckets: Record<ParameterId, GraphDataPoint[]>) => void,
  onError: (error: Error) => void,
): () => void {
  const since = Date.now() - 24 * 60 * 60 * 1000;
  const q = query(
    ref(db, `readings/${deviceId}`),
    orderByKey(),
    startAt(String(since)),
  );
  return onValue(
    q,
    (snapshot) => {
      const raw = (snapshot.val() ?? {}) as Record<string, Record<string, number>>;
      const now = Date.now();
      const cutoff = now - 24 * 60 * 60 * 1000;
      const filtered = Object.fromEntries(
        Object.entries(raw).filter(([k]) => Number(k) >= cutoff),
      );
      onData(buildOneDayWallClock(filtered));
    },
    onError,
  );
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
