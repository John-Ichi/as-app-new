import { ParameterId, parameterMap } from "@/constants/parameters";

export type OverallStatus = "NORMAL" | "WARNING" | "CRITICAL";
export type ParameterStatus = "normal" | "critical";
export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";

export const overallStatusBg: Record<OverallStatus, string> = {
  NORMAL: "bg-success",
  WARNING: "bg-warning",
  CRITICAL: "bg-danger",
};

export const parameterStatusTextColor: Record<ParameterStatus, string> = {
  normal: "text-success",
  critical: "text-danger",
};

export const parameterStatusBg: Record<ParameterStatus, string> = {
  normal: "bg-success-light",
  critical: "bg-danger-light",
};

export const parameterStatusLabel: Record<ParameterStatus, string> = {
  normal: "SAFE",
  critical: "CRITICAL",
};

export const riskTextColor: Record<RiskLevel, string> = {
  LOW: "text-success",
  MEDIUM: "text-warning",
  HIGH: "text-danger",
};

export function classify(
  id: ParameterId,
  value: number,
): ParameterStatus | undefined {
  if (value == null || Number.isNaN(value)) return undefined;
  const threshold = parameterMap[id]?.threshold;
  if (!threshold) return undefined;
  if (threshold.max != null && value > threshold.max) return "critical";
  if (threshold.min != null && value < threshold.min) return "critical";
  return "normal";
}
