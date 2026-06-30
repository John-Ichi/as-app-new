import { icons } from "@/constants/icons";
import { ImageSourcePropType } from "react-native";

export interface ParameterMetaData {
  id: string;
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

export const parameterMap = Object.fromEntries(
  parameters.map((p) => [p.id, p]),
);
