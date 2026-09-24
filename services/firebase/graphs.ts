import { parameterIds, type ParameterId } from "@/constants/parameters";
import { db } from "@/firebase/config";
import type { GraphDataPoint, ParameterGraphData } from "@/services/types";
import { formatTimeAmPm } from "@/utils/format";
import {
  get,
  limitToLast,
  onValue,
  orderByKey,
  query,
  ref,
  startAt,
} from "firebase/database";

const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;
const HALF_HOUR_MS = 30 * 60 * 1000;

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

function buildWallClockBuckets(
  readings: Record<string, Record<string, number>>,
  slotMs: number,
  count: number,
  labelFn: (slotStart: number) => string | undefined,
): Record<ParameterId, GraphDataPoint[]> {
  const now = Date.now();
  const currentSlotStart = Math.floor(now / slotMs) * slotMs;
  const slots: number[] = Array.from(
    { length: count },
    (_, i) => currentSlotStart - (count - 1 - i) * slotMs,
  );

  const keysBySlot = new Map<number, string[]>();
  for (const key of Object.keys(readings)) {
    const ts = Number(key);
    const slotStart = Math.floor(ts / slotMs) * slotMs;
    if (slotStart < slots[0] || slotStart > slots[count - 1]) continue;
    const list = keysBySlot.get(slotStart) ?? [];
    list.push(key);
    keysBySlot.set(slotStart, list);
  }

  const result: Record<ParameterId, GraphDataPoint[]> = {} as Record<
    ParameterId,
    GraphDataPoint[]
  >;
  for (const id of parameterIds) {
    result[id] = slots.map((slotStart) => {
      const label = labelFn(slotStart);
      const groupKeys = keysBySlot.get(slotStart) ?? [];
      if (groupKeys.length === 0) {
        return { value: NaN, label };
      }
      const avg = round(
        groupKeys.reduce((sum, k) => sum + readings[k][id], 0) /
          groupKeys.length,
        3,
      );
      return { value: avg, label };
    });
  }
  return result;
}

function buildOneDayWallClock(
  readings: Record<string, Record<string, number>>,
): Record<ParameterId, GraphDataPoint[]> {
  return buildWallClockBuckets(readings, HOUR_MS, 24, (slotStart) =>
    hourlyLabelForHour(new Date(slotStart).getHours()),
  );
}

function buildHalfHourWallClock(
  readings: Record<string, Record<string, number>>,
): Record<ParameterId, GraphDataPoint[]> {
  return buildWallClockBuckets(readings, HALF_HOUR_MS, 48, (slotStart) => {
    const d = new Date(slotStart);
    return formatTimeAmPm(d.getHours(), d.getMinutes());
  });
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

function subscribeWindowedReadings(
  deviceId: string,
  windowMs: number,
  onReadings: (readings: Record<string, Record<string, number>>) => void,
  onError: (error: Error) => void,
): () => void {
  const since = Date.now() - windowMs;
  const q = query(
    ref(db, `readings/${deviceId}`),
    orderByKey(),
    startAt(String(since)),
  );
  return onValue(
    q,
    (snapshot) => {
      const raw = (snapshot.val() ?? {}) as Record<
        string,
        Record<string, number>
      >;
      const cutoff = Date.now() - windowMs;
      const filtered = Object.fromEntries(
        Object.entries(raw).filter(([k]) => Number(k) >= cutoff),
      );
      onReadings(filtered);
    },
    onError,
  );
}

export function subscribeRawReadings(
  deviceId: string,
  id: ParameterId,
  onData: (data: { keys: string[]; values: number[] }) => void,
  onError: (error: Error) => void,
): () => void {
  return subscribeWindowedReadings(
    deviceId,
    DAY_MS,
    (readings) => {
      const keys = Object.keys(readings).sort();
      onData({ keys, values: keys.map((k) => readings[k][id]) });
    },
    onError,
  );
}

export function subscribeOneDay(
  deviceId: string,
  onData: (buckets: Record<ParameterId, GraphDataPoint[]>) => void,
  onError: (error: Error) => void,
): () => void {
  return subscribeWindowedReadings(
    deviceId,
    DAY_MS,
    (readings) => onData(buildOneDayWallClock(readings)),
    onError,
  );
}

export function subscribeHalfHour(
  deviceId: string,
  onData: (buckets: Record<ParameterId, GraphDataPoint[]>) => void,
  onError: (error: Error) => void,
): () => void {
  return subscribeWindowedReadings(
    deviceId,
    DAY_MS,
    (readings) => onData(buildHalfHourWallClock(readings)),
    onError,
  );
}

export function isBucketDataEmpty(
  buckets: Record<ParameterId, GraphDataPoint[]>,
): boolean {
  return parameterIds.every((id) =>
    (buckets[id] ?? []).every((pt) => Number.isNaN(pt.value)),
  );
}

