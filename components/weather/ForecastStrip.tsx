import { getWeatherCondition } from "@/constants/weather";
import { colors } from "@/constants/theme";
import type { SavedLocation, WeatherInfo } from "@/services/types";
import Ionicons from "@expo/vector-icons/Ionicons";
import dayjs from "dayjs";
import { ActivityIndicator, Platform, ScrollView, Text, View } from "react-native";

interface ForecastStripProps {
  savedLocations: SavedLocation[];
  weatherData: Record<number, WeatherInfo>;
  isFetching: boolean;
}

/**
 * The forecast section: hourly cards for the forecast location (the device's
 * current location when present, else the first saved one).
 */
export function ForecastStrip({
  savedLocations,
  weatherData,
  isFetching,
}: ForecastStripProps) {
  const forecastLocation =
    savedLocations.find((loc) => loc.source === "device") ??
    savedLocations[0] ??
    null;
  const forecast =
    forecastLocation !== null
      ? (weatherData[forecastLocation.id]?.hourlyForecast ?? null)
      : null;

  return (
    <View className="w-full px-4 pt-4 gap-y-2">
      <Text className="text-lg text-primary font-poppins-bold">
        {forecastLocation !== null
          ? `Forecast - ${forecastLocation.name}, ${forecastLocation.admin1 ?? "Philippines"}`
          : "Forecast"}
      </Text>
      {savedLocations.length === 0 ? (
        <Text className="text-md text-muted font-poppins-light">
          Add a location in Locations...
        </Text>
      ) : forecast !== null && forecast.length > 0 ? (
        <ScrollView
          horizontal
          nestedScrollEnabled
          showsHorizontalScrollIndicator={Platform.OS === "web"}
          contentContainerStyle={{ paddingBottom: 8 }}
        >
          <View className="flex-row gap-x-4">
            {forecast.map((hour) => (
              <View
                key={hour.time}
                className="bg-white rounded-sm p-4 gap-y-1"
                style={{ width: 148 }}
              >
                <Text className="text-md text-primary text-center font-poppins-bold">
                  {dayjs(hour.time).format("h:00 A")}
                </Text>
                <View className="items-center">
                  <Ionicons
                    name={getWeatherCondition(hour.weatherCode).icon}
                    size={32}
                    color={colors.primary}
                  />
                </View>
                <Text className="text-sm text-muted text-center font-poppins-light">
                  RAIN: {hour.precipitation.toFixed(2)} mm
                </Text>
                <Text className="text-sm text-muted text-center font-poppins-light">
                  HEAT INDEX: {Math.round(hour.heatIndex)} °C
                </Text>
              </View>
            ))}
          </View>
        </ScrollView>
      ) : isFetching ? (
        <View className="items-center gap-y-2 py-6">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text className="text-md text-muted font-poppins-light">
            Loading forecast...
          </Text>
        </View>
      ) : (
        <Text className="text-md text-muted font-poppins-light">
          No forecast available.
        </Text>
      )}
    </View>
  );
}
