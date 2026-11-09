import PressableScale from "@/components/PressableScale";
import { getWeatherCondition } from "@/constants/weather";
import { colors } from "@/constants/theme";
import type { SavedLocation, WeatherInfo } from "@/services/types";
import Ionicons from "@expo/vector-icons/Ionicons";
import SimpleLineIcons from "@expo/vector-icons/SimpleLineIcons";
import { useState } from "react";
import { Platform, ScrollView, Text, View } from "react-native";

const BADGE_OVERHANG = 12;

interface LocationCardsProps {
  savedLocations: SavedLocation[];
  weatherData: Record<number, WeatherInfo>;
  editMode: boolean;
  showBadgeReserve: boolean;
  onRemove: (id: number) => void;
}

/**
 * Horizontally scrolling strip of saved-location weather cards, with the
 * edit-mode remove badges and the width math that reserves space for them.
 */
export function LocationCards({
  savedLocations,
  weatherData,
  editMode,
  showBadgeReserve,
  onRemove,
}: LocationCardsProps) {
  const [cardsWidth, setCardsWidth] = useState(0);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={Platform.OS === "web"}
      contentContainerStyle={[
        showBadgeReserve && { paddingTop: 12, paddingRight: 12 },
        { paddingBottom: 8 },
      ]}
      onLayout={(e) => setCardsWidth(e.nativeEvent.layout.width)}
    >
      <View className="flex-row gap-x-4">
        {savedLocations.slice(0, 5).map((location) => {
          const info = weatherData[location.id];
          const condition = info
            ? getWeatherCondition(info.weatherCode)
            : null;
          return (
            <View
              key={location.id}
              className="bg-white rounded-sm p-4 relative gap-y-2"
              style={
                cardsWidth > 0
                  ? {
                      width: showBadgeReserve
                        ? savedLocations.length === 1
                          ? cardsWidth - BADGE_OVERHANG
                          : (cardsWidth - BADGE_OVERHANG) * 0.85
                        : savedLocations.length === 1
                          ? cardsWidth
                          : cardsWidth * 0.85,
                    }
                  : undefined
              }
            >
              {/** device location is re-seeded automatically — not removable */}
              {editMode && location.source !== "device" && (
                <PressableScale
                  onPress={() => onRemove(location.id)}
                  accessibilityRole="button"
                  accessibilityLabel={`Remove ${location.name}`}
                  hitSlop={8}
                  style={{
                    position: "absolute",
                    top: -8,
                    right: -8,
                    zIndex: 10,
                  }}
                >
                  <Ionicons
                    name="close-circle"
                    size={24}
                    color={colors.danger}
                  />
                </PressableScale>
              )}
              <View className="flex-row justify-between">
                <View>
                  <Text className="text-xl text-primary font-poppins-semibold">
                    {info ? `${Math.round(info.temperature)} °C` : "—"}
                  </Text>
                  <Text className="text-md text-muted font-poppins-light">
                    {location.source === "device"
                      ? "CURRENT LOCATION"
                      : "SAVED LOCATION"}
                  </Text>
                  <Text className="text-xl text-primary font-poppins-bold">
                    {location.name}
                  </Text>
                  <Text
                    className="text-lg text-primary font-poppins-semibold"
                    style={{ lineHeight: 18 }}
                  >
                    {location.admin1 ?? "Philippines"}
                  </Text>
                  <Text className="text-md text-primary font-poppins-regular">
                    {condition ? condition.label : "—"}
                  </Text>
                </View>
                <View>
                  {condition ? (
                    <Ionicons
                      name={condition.icon}
                      size={56}
                      color={colors.primary}
                    />
                  ) : (
                    <Ionicons
                      name="partly-sunny"
                      size={56}
                      color={colors.primary}
                    />
                  )}
                </View>
              </View>
              <View className="flex-row justify-between">
                <View className="flex-row items-center gap-x-1">
                  <SimpleLineIcons
                    name="drop"
                    size={16}
                    color={colors.primary}
                  />
                  <Text className="text-xs text-muted font-poppins-light">
                    24-HR RAIN:{" "}
                    {info ? `${info.rain24h.toFixed(2)} mm` : "—"}
                  </Text>
                </View>
                <View className="flex-row items-center gap-x-1">
                  <Ionicons
                    name="thermometer"
                    size={14}
                    color={colors.primary}
                  />
                  <Text className="text-xs text-muted font-poppins-light">
                    MAX HEAT INDEX:{" "}
                    {info
                      ? `${Math.round(info.maxHeatIndex)} °C`
                      : "—"}
                  </Text>
                </View>
              </View>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}
