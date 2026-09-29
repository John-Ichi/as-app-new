import type { ComponentProps } from "react";
import type Ionicons from "@expo/vector-icons/Ionicons";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

export interface WeatherCondition {
  label: string;
  icon: IoniconName;
}

export function getWeatherCondition(code: number): WeatherCondition {
  if (code === 0) return { label: "Clear sky", icon: "sunny" };
  if (code === 1) return { label: "Mainly clear", icon: "partly-sunny" };
  if (code === 2) return { label: "Partly cloudy", icon: "partly-sunny" };
  if (code === 3) return { label: "Overcast", icon: "cloudy" };
  if (code === 45 || code === 48) return { label: "Fog", icon: "cloudy" };
  if (code >= 51 && code <= 67) return { label: "Rain", icon: "rainy" };
  if (code >= 71 && code <= 77) return { label: "Snow", icon: "snow" };
  if (code >= 80 && code <= 82)
    return { label: "Rain showers", icon: "rainy" };
  if (code === 85 || code === 86)
    return { label: "Snow showers", icon: "snow" };
  if (code >= 95) return { label: "Thunderstorm", icon: "thunderstorm" };
  return { label: "Partly cloudy", icon: "partly-sunny" };
}
