import { icons } from "@/constants/icons";
import { ImageSourcePropType } from "react-native";

export const parameterIds = [
  "ammonia",
  "temperature",
  "dissolvedOxygen",
  "pH",
  "turbidity",
  "salinity",
] as const;

export type ParameterId = (typeof parameterIds)[number];

export interface ParameterMetaData {
  id: ParameterId;
  label: string;
  unit: string;
  icon: ImageSourcePropType;
  threshold?: {
    min?: number;
    max?: number;
  };
}

export const parameters: ParameterMetaData[] = [
  {
    id: "ammonia",
    label: "AMMONIA",
    unit: "ppm",
    icon: icons.ammonia,
    threshold: {
      max: 0.06,
    },
  },
  {
    id: "temperature",
    label: "TEMPERATURE",
    unit: "°C",
    icon: icons.temperature,
    threshold: { min: 26, max: 32 },
  },
  {
    id: "dissolvedOxygen",
    label: "DO",
    unit: "mg/L",
    icon: icons.dissolvedOxygen,
    threshold: { min: 5 },
  },
  {
    id: "pH",
    label: "pH LEVEL",
    unit: "",
    icon: icons.pH,
    threshold: { min: 6.5, max: 8.5 },
  },
  {
    id: "turbidity",
    label: "TURBIDITY",
    unit: "NTU",
    icon: icons.turbidity,
  },
  {
    id: "salinity",
    label: "SALINITY",
    unit: "ppt",
    icon: icons.salinity,
    threshold: { min: 2, max: 15 },
  },
];

export const parameterMap: Record<ParameterId, ParameterMetaData> =
  Object.fromEntries(parameters.map((p) => [p.id, p])) as Record<
    ParameterId,
    ParameterMetaData
  >;
