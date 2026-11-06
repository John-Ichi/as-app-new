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
    critical: number;
  };
}

export const parameters: ParameterMetaData[] = [
  {
    id: "ammonia",
    label: "AMMONIA",
    unit: "ppm",
    icon: icons.ammonia,
    threshold: {
      critical: 0.06,
    },
  },
  {
    id: "temperature",
    label: "TEMPERATURE",
    unit: "°C",
    icon: icons.temperature,
  },
  {
    id: "dissolvedOxygen",
    label: "DO",
    unit: "mg/L",
    icon: icons.dissolvedOxygen,
  },
  {
    id: "pH",
    label: "pH LEVEL",
    unit: "",
    icon: icons.pH,
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
  },
];

export const parameterMap: Record<ParameterId, ParameterMetaData> =
  Object.fromEntries(parameters.map((p) => [p.id, p])) as Record<
    ParameterId,
    ParameterMetaData
  >;
