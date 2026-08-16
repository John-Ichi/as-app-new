import dayjs from "dayjs";

import { parameterIds, parameterMap } from "@/constants/parameters";
import type { ParameterId } from "@/constants/parameters";

interface Readings {
  [timestamp: string]: Record<ParameterId, number>;
}

const HEADER_COLUMNS = [
  "Timestamp",
  ...parameterIds.map((id) => `${parameterMap[id].label} (${parameterMap[id].unit})`),
];

function escapeCsvField(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function generateCsv(readings: Readings): string {
  const sortedTimestamps = Object.keys(readings).sort(
    (a, b) => Number(a) - Number(b),
  );

  const header = HEADER_COLUMNS.map(escapeCsvField).join(",");
  const rows = sortedTimestamps.map((ts) => {
    const values = parameterIds.map((id) => {
      const val = readings[ts]?.[id];
      return val != null ? String(val) : "";
    });
    const timestamp = dayjs(Number(ts)).toISOString();
    return [timestamp, ...values].map(escapeCsvField).join(",");
  });

  return [header, ...rows].join("\n");
}
