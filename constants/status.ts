import { ParameterId, parameterMap } from "@/constants/parameters";

export type OverallStatus = "NORMAL" | "WARNING" | "CRITICAL";
export type ParameterStatus = "normal" | "warning" | "critical";
export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";

export const overallStatusBg: Record<OverallStatus, string> = {
  NORMAL: "bg-success",
  WARNING: "bg-warning",
  CRITICAL: "bg-danger",
};

export const parameterStatusTextColor: Record<ParameterStatus, string> = {
  normal: "text-success",
  warning: "text-warning",
  critical: "text-danger",
};

export const parameterStatusBg: Record<ParameterStatus, string> = {
  normal: "bg-success-light",
  warning: "bg-warning-light",
  critical: "bg-danger-light",
};

export const parameterStatusLabel: Record<ParameterStatus, string> = {
  normal: "SAFE",
  warning: "WARNING",
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
  const metadata = parameterMap[id];
  if (!metadata?.threshold) return undefined;
  if (value > metadata.threshold.critical) return "critical";
  if (value > metadata.threshold.warning) return "warning";
  return "normal";
}
