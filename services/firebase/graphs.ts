import { parameterIds, type ParameterId } from "@/constants/parameters";
import { db } from "@/firebase/config";
import type { GraphDataPoint, ParameterGraphData } from "@/services/types";
import dayjs from "dayjs";
import { formatTimeAmPm } from "@/utils/format";
import {
  get,
  limitToFirst,
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
    query(
      ref(db, `readings/${deviceId}`),
      orderByKey(),
      startAt(since.toString()),
    ),
  );
  return snapshot.val() ?? {};
}

/**
 * Timestamp (epoch ms) of the device's oldest reading, or null when the
 * device has no readings at all. Reads a single row.
 */
export async function fetchOldestReadingTs(
  deviceId: string,
): Promise<number | null> {
  const snapshot = await get(
    query(ref(db, `readings/${deviceId}`), orderByKey(), limitToFirst(1)),
  );
  if (!snapshot.exists()) return null;
  return Number(Object.keys(snapshot.val())[0]);
}

function hourlyLabelForHour(hour: number): string | undefined {
  return hour % 2 === 0 ? `${String(hour).padStart(2, "0")}:00` : undefined;
}

function buildWallClockBuckets(
  readings: Record<string, Record<string, number>>,
  slots: number[],
  slotFor: (ts: number) => number,
  labelFn: (slotStart: number, index: number) => string | undefined,
): Record<ParameterId, GraphDataPoint[]> {
  const keysBySlot = new Map<number, string[]>();
  const first = slots[0];
  const last = slots[slots.length - 1];

  for (const key of Object.keys(readings)) {
    const slotStart = slotFor(Number(key));
    if (slotStart < first || slotStart > last) continue;
    const list = keysBySlot.get(slotStart) ?? [];
    list.push(key);
    keysBySlot.set(slotStart, list);
  }

  const result: Record<ParameterId, GraphDataPoint[]> = {} as Record<
    ParameterId,
    GraphDataPoint[]
  >;
  for (const id of parameterIds) {
    result[id] = slots.map((slotStart, index) => {
      const label = labelFn(slotStart, index);
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

const dayStartFor = (ts: number): number => {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

const firstOfMonthFor = (ts: number): number => {
  const d = new Date(ts);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

function buildOneDayWallClock(
  readings: Record<string, Record<string, number>>,
): Record<ParameterId, GraphDataPoint[]> {
  const now = Date.now();
  const currentHourStart = Math.floor(now / HOUR_MS) * HOUR_MS;
  const slots = Array.from(
    { length: 24 },
    (_, i) => currentHourStart - (23 - i) * HOUR_MS,
  );
  return buildWallClockBuckets(
    readings,
    slots,
    (ts) => Math.floor(ts / HOUR_MS) * HOUR_MS,
    (slotStart) => hourlyLabelForHour(new Date(slotStart).getHours()),
  );
}

function buildOneMonthWallClock(
  readings: Record<string, Record<string, number>>,
): Record<ParameterId, GraphDataPoint[]> {
  const todayMidnight = dayStartFor(Date.now());
  const slots = Array.from(
    { length: 30 },
    (_, i) => todayMidnight - (29 - i) * DAY_MS,
  );
  return buildWallClockBuckets(
    readings,
    slots,
    dayStartFor,
    (slotStart, index) => {
      const isLast = index === slots.length - 1;
      return index % 5 === 0 || isLast
        ? dayjs(slotStart).format("MMM D")
        : undefined;
    },
  );
}

function buildOneYearWallClock(
  readings: Record<string, Record<string, number>>,
): Record<ParameterId, GraphDataPoint[]> {
  const now = new Date();
  const slots = Array.from({ length: 12 }, (_, i) =>
    firstOfMonthFor(
      new Date(now.getFullYear(), now.getMonth() - (11 - i), 1).getTime(),
    ),
  );
  return buildWallClockBuckets(
    readings,
    slots,
    firstOfMonthFor,
    (slotStart) => dayjs(slotStart).format("MMM"),
  );
}

function buildHalfHourWallClock(
  readings: Record<string, Record<string, number>>,
): Record<ParameterId, GraphDataPoint[]> {
  const now = Date.now();
  const currentSlotStart = Math.floor(now / HALF_HOUR_MS) * HALF_HOUR_MS;
  const slots = Array.from(
    { length: 48 },
    (_, i) => currentSlotStart - (47 - i) * HALF_HOUR_MS,
  );
  return buildWallClockBuckets(
    readings,
    slots,
    (ts) => Math.floor(ts / HALF_HOUR_MS) * HALF_HOUR_MS,
    (slotStart) => {
      const d = new Date(slotStart);
      return formatTimeAmPm(d.getHours(), d.getMinutes());
    },
  );
}

export async function getGraphData(
  deviceId: string,
): Promise<ParameterGraphData[]> {
  const now = Date.now();
  const [oneDayRaw, oneMonthRaw, oneYearRaw] = await Promise.all([
    fetchReadingsSince(deviceId, now - 1 * DAY_MS),
    fetchReadingsSince(deviceId, now - 30 * DAY_MS),
    fetchReadingsSince(deviceId, now - 365 * DAY_MS),
  ]);

  const oneDayBuckets = buildOneDayWallClock(oneDayRaw);
  const oneMonthBuckets = buildOneMonthWallClock(oneMonthRaw);
  const oneYearBuckets = buildOneYearWallClock(oneYearRaw);

  return parameterIds.map((id) => ({
    id,
    oneDay: oneDayBuckets[id],
    oneMonth: oneMonthBuckets[id],
    oneYear: oneYearBuckets[id],
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
    data.every((p) =>
      [p.oneDay, p.oneMonth, p.oneYear].every(
        (series) =>
          series.length === 0 || series.every((pt) => Number.isNaN(pt.value)),
      ),
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
