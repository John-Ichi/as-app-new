import type { ParameterId } from "@/constants/parameters";

export function formatTimeAmPm(hour: number, minute = 0): string {
  const h = hour % 12 || 12;
  const period = hour < 12 ? "AM" : "PM";
  const mm = String(minute).padStart(2, "0");
  return `${h}:${mm} ${period}`;
}

export function formatCellValue(
  paramId: ParameterId,
  value: number | null | undefined,
): string {
  if (value == null || Number.isNaN(value)) return "-";
  return paramId === "ammonia" ? value.toFixed(3) : value.toFixed(2);
}
