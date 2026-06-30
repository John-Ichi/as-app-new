import { icons } from "@/constants/icons";
import { ImageSourcePropType } from "react-native";

export const parameterIds = [
  "ammonia",
  "temperature",
  "dissolvedOxygen",
  "pH",
  "turbidity",
] as const;

export type ParameterId = (typeof parameterIds)[number];

export interface ParameterMetaData {
  id: ParameterId;
  label: string;
  unit: string;
  icon: ImageSourcePropType;
  fullWidth?: boolean;
  threshold?: {
    warning: number;
    critical: number;
  };
}

export const parameters: ParameterMetaData[] = [
  {
    id: "ammonia",
    label: "Ammonia",
    unit: "ppm",
    icon: icons.ammonia,
    threshold: {
      warning: 0.06,
      critical: 0.2,
    },
  },
  {
    id: "temperature",
    label: "Temperature",
    unit: "°C",
    icon: icons.temperature,
  },
  {
    id: "dissolvedOxygen",
    label: "Dissolved Oxygen",
    unit: "mg/L",
    icon: icons.dissolvedOxygen,
  },
  {
    id: "pH",
    label: "pH Level",
    unit: "",
    icon: icons.pH,
  },
  {
    id: "turbidity",
    label: "Turbidity",
    unit: "NTU",
    icon: icons.turbidity,
    fullWidth: true,
  },
];

export const parameterMap: Record<ParameterId, ParameterMetaData> =
  Object.fromEntries(parameters.map((p) => [p.id, p])) as Record<
    ParameterId,
    ParameterMetaData
  >;
