import { getWeatherCondition } from "@/constants/weather";
import { colors } from "@/constants/theme";
import type { SavedLocation, WeatherInfo } from "@/services/types";
import Ionicons from "@expo/vector-icons/Ionicons";
import dayjs from "dayjs";
import { Text, View } from "react-native";

interface ObservationCardProps {
  observation: SavedLocation;
  info: WeatherInfo;
}

/**
 * The observation readout card: timestamp, location/condition header, and the
 * two-column field grid (temperature, precipitation, heat index, pressure,
 * humidity, wind).
 */
export function ObservationCard({ observation, info }: ObservationCardProps) {
  const obsFields = [
    { value: `${Math.round(info.temperature)} °C`, label: "Temperature" },
    { value: `${info.precipitation.toFixed(2)} mm`, label: "Precipitation" },
    { value: `${Math.round(info.heatIndex)} °C`, label: "Heat Index" },
    { value: `${Math.round(info.pressure)} hPa`, label: "Pressure" },
    { value: `${Math.round(info.humidity)}%`, label: "Humidity" },
    { value: `${Math.round(info.windSpeed)} km/h`, label: "Wind" },
  ];

  return (
    <View className="w-full bg-white rounded-sm p-4">
      <Text className="text-sm text-muted font-poppins-light">
        {dayjs(info.observationTime).format("MMM D, h:mm A")}
      </Text>
      <View className="flex-row justify-between pb-2">
        <View>
          <Text className="text-lg text-primary font-poppins-bold">
            {observation.name}, {observation.admin1 ?? "Philippines"}
          </Text>
          <Text className="text-md text-primary font-poppins-regular">
            {getWeatherCondition(info.weatherCode).label}
          </Text>
        </View>
        <Ionicons
          name={getWeatherCondition(info.weatherCode).icon}
          size={42}
          color={colors.primary}
        />
      </View>
      {[0, 1, 2].map((row) => (
        <View key={row} className="flex-row gap-x-2">
          {[0, 1].flatMap((col) => {
            const field = obsFields[row * 2 + col];
            return [
              <View
                key={`${field.label}-value`}
                className="flex-1 flex-row justify-end items-center"
              >
                <Text className="text-sm text-primary font-poppins-regular">
                  {field.value}
                </Text>
              </View>,
              <View
                key={`${field.label}-label`}
                className="flex-1 flex-row justify-end items-center"
              >
                <Text className="text-sm text-primary font-poppins-regular">
                  {field.label}
                </Text>
              </View>,
            ];
          })}
        </View>
      ))}
    </View>
  );
}
