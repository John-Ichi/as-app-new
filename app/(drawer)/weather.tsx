import PressableScale from "@/components/PressableScale";
import SearchBar from "@/components/SearchBar";
import { ErrorState, LoadingState } from "@/components/StateDisplay";
import { icons } from "@/constants/icons";
import { colors } from "@/constants/theme";
import { getWeatherCondition } from "@/constants/weather";
import { useCurrentLocation } from "@/hooks/useCurrentLocation";
import { useLocationSearch } from "@/hooks/useLocationSearch";
import { useSavedLocations } from "@/hooks/useSavedLocations";
import { useWeather } from "@/hooks/useWeather";
import { fetchWeather } from "@/services/openMeteo";
import type { SavedLocation, WeatherInfo } from "@/services/types";
import Ionicons from "@expo/vector-icons/Ionicons";
import SimpleLineIcons from "@expo/vector-icons/SimpleLineIcons";
import dayjs from "dayjs";
import { styled } from "nativewind";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

const SafeAreaView = styled(RNSafeAreaView);

const Weather = () => {
  const [cardsWidth, setCardsWidth] = useState(0);

  const [locationQuery, setLocationQuery] = useState("");
  const [observationQuery, setObservationQuery] = useState("");
  const [selectedObservation, setSelectedObservation] =
    useState<SavedLocation | null>(null);
  const [obsWeather, setObsWeather] = useState<WeatherInfo | null>(null);
  const [isObsFetching, setIsObsFetching] = useState(false);
  const [obsError, setObsError] = useState<Error | null>(null);
  const { results, isLoading, error, clearResults } =
    useLocationSearch(locationQuery);
  const obsSearch = useLocationSearch(observationQuery);
  const {
    location: currentLocation,
    isLoading: isLocationLoading,
    isValidating: isLocationValidating,
    lastUpdated: locationLastUpdated,
    /** isUnavailable: isLocationUnavailable, */
  } = useCurrentLocation();
  const { savedLocations, isHydrated, addLocation, seedDeviceLocation } =
    useSavedLocations();
  const weather = useWeather(savedLocations, {
    enabled: !isLocationLoading && isHydrated,
  });
  const hasAnyWeather = Object.keys(weather.data).length > 0;

  useEffect(() => {
    if (!currentLocation) return;
    seedDeviceLocation(currentLocation);
  }, [currentLocation, seedDeviceLocation]);

  const selectedObsId = selectedObservation?.id ?? null;
  const savedObsWeather =
    selectedObsId !== null ? weather.data[selectedObsId] : undefined;

  useEffect(() => {
    if (!selectedObservation || savedObsWeather) {
      setObsWeather(null);
      setObsError(null);
      setIsObsFetching(false);
      return;
    }
    const controller = new AbortController();
    setIsObsFetching(true);
    setObsError(null);
    fetchWeather(
      [
        {
          latitude: selectedObservation.latitude,
          longitude: selectedObservation.longitude,
        },
      ],
      controller.signal,
    )
      .then(([info]) => {
        setObsWeather(info ?? null);
        setIsObsFetching(false);
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        setObsError(
          err instanceof Error ? err : new Error("Failed to fetch weather."),
        );
        setIsObsFetching(false);
      });
    return () => {
      controller.abort();
    };
  }, [selectedObservation, savedObsWeather]);

  const [upToDate, setUpToDate] = useState(false);
  const upToDateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (upToDateTimerRef.current) clearTimeout(upToDateTimerRef.current);
    },
    [],
  );

  const spin = useSharedValue(0);
  useEffect(() => {
    if (weather.isFetching) {
      spin.value = withRepeat(
        withTiming(1, { duration: 1000, easing: Easing.linear }),
        -1,
      );
    } else {
      cancelAnimation(spin);
      spin.value = 0;
    }
  }, [weather.isFetching, spin]);
  const spinStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spin.value * 360}deg` }],
  }));

  const scrollRef = useRef<ScrollView>(null);
  const sectionY = useRef<{ locations: number; observations: number }>({
    locations: 0,
    observations: 0,
  });

  const scrollToSection = useCallback(
    (key: "locations" | "observations") => {
      scrollRef.current?.scrollTo({
        y: Math.max(sectionY.current[key] - 8, 0),
        animated: true,
      });
    },
    [],
  );

  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const keyboardVisible = useRef(false);
  const pendingSection = useRef<"locations" | "observations" | null>(null);

  useEffect(() => {
    const show = Keyboard.addListener("keyboardDidShow", (e) => {
      keyboardVisible.current = true;
      setKeyboardHeight(e.endCoordinates.height);
      if (pendingSection.current) {
        scrollToSection(pendingSection.current);
        pendingSection.current = null;
      }
    });
    const hide = Keyboard.addListener("keyboardDidHide", () => {
      keyboardVisible.current = false;
      setKeyboardHeight(0);
      pendingSection.current = null;
    });
    return () => {
      show.remove();
      hide.remove();
    };
  }, [scrollToSection]);

  const handleSearchFocus = (key: "locations" | "observations") => {
    if (keyboardVisible.current) scrollToSection(key);
    else pendingSection.current = key;
  };

  const handleRefresh = () => {
    if (weather.refetch()) return;
    setUpToDate(true);
    if (upToDateTimerRef.current) clearTimeout(upToDateTimerRef.current);
    upToDateTimerRef.current = setTimeout(() => setUpToDate(false), 2000);
  };

  if (
    isLocationLoading ||
    !isHydrated ||
    (weather.isFetching && !hasAnyWeather)
  )
    return <LoadingState />;
  if (weather.error && !hasAnyWeather)
    return (
      <ErrorState message={weather.error.message} onRetry={weather.refetch} />
    );

  const showResults = locationQuery.trim().length >= 2;

  const handleAddLocation = (location: SavedLocation) => {
    addLocation(location);
    setLocationQuery("");
    clearResults();
  };

  const showObsResults = observationQuery.trim().length >= 2;

  const handleSelectObservation = (location: SavedLocation) => {
    setSelectedObservation(location);
    setObservationQuery("");
    obsSearch.clearResults();
  };

  const activeObsWeather =
    selectedObservation !== null ? (savedObsWeather ?? obsWeather) : null;

  const isUpdating = isLocationValidating || weather.isFetching;
  const newestUpdated =
    locationLastUpdated !== null && weather.lastUpdated !== null
      ? Math.max(locationLastUpdated, weather.lastUpdated)
      : (locationLastUpdated ?? weather.lastUpdated);
  const showStrip =
    isUpdating ||
    newestUpdated !== null ||
    (weather.error !== null && hasAnyWeather) ||
    hasAnyWeather;

  return (
    <SafeAreaView edges={["bottom"]} className="flex-1 bg-primary">
      {showStrip && (
        <View className="bg-primary flex-row items-center justify-center gap-x-3 py-2 px-4">
          {isLocationValidating ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : null}
          {newestUpdated !== null ? (
            <Text className="text-sm text-white font-poppins-regular">
              Last updated: {dayjs(newestUpdated).format("h:mm A")}
            </Text>
          ) : null}
          {isUpdating ? (
            <Text className="text-xs text-white font-poppins-regular">
              Updating…
            </Text>
          ) : null}
          {weather.error !== null && hasAnyWeather && !isUpdating ? (
            <Text className="text-xs text-danger font-poppins-regular">
              Couldn&apos;t refresh
            </Text>
          ) : null}
          {upToDate && !isUpdating ? (
            <Text className="text-xs text-white font-poppins-regular">
              Up to date
            </Text>
          ) : null}
          <PressableScale
            onPress={handleRefresh}
            disabled={weather.isFetching}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Refresh weather"
          >
            <Animated.View style={spinStyle}>
              <Ionicons name="refresh" size={16} color={colors.white} />
            </Animated.View>
          </PressableScale>
        </View>
      )}
      <View className="bg-background rounded-t-xl px-4 pt-6 pb-2">
        <View className="w-full max-w-xl mx-auto flex-row gap-x-2">
          {/** acnhor to each page section */}
          <PressableScale style={{ flex: 1 }}>
            <Text className="text-md text-center text-white font-poppins-medium bg-primary rounded-sm px-1 py-1.5">
              Locations
            </Text>
          </PressableScale>
          <PressableScale style={{ flex: 1 }}>
            <Text className="text-md text-center text-white font-poppins-medium bg-primary rounded-sm px-1 py-1.5">
              Observations
            </Text>
          </PressableScale>
          <PressableScale style={{ flex: 1 }}>
            <Text className="text-md text-center text-white font-poppins-medium bg-primary rounded-sm px-1 py-1.5">
              Forecast
            </Text>
          </PressableScale>
        </View>
      </View>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
      <ScrollView
        ref={scrollRef}
        className="flex-1 bg-background"
        contentContainerClassName="pb-10"
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={weather.isFetching}
            onRefresh={handleRefresh}
            tintColor={colors.white}
            colors={[colors.primary]}
          />
        }
      >
        <View className="w-full max-w-xl mx-auto pt-4 px-4 gap-y-4">
          {/** location section: features add location, display current weather data e.g. temperature, rain data (24 hour rain forecast? includes mm and type e.g. very light, moderate, heavy), and max heat index */}
          {/** features also include editing locations */}
          {/** personalization: horizontal scrolling, view all locations via modal */}
          <View
            className="w-full p-4 gap-y-2"
            onLayout={(e) => {
              sectionY.current.locations = e.nativeEvent.layout.y;
            }}
          >
            <View className="flex-row justify-between">
              <Text className="text-lg text-primary font-poppins-bold">
                Locations
              </Text>
              <Text>View All Locations</Text>
            </View>
            <SearchBar
              value={locationQuery}
              onChangeText={setLocationQuery}
              onFocus={() => handleSearchFocus("locations")}
            />
            {/** results */}
            {showResults && (
              <ScrollView
                className="max-h-64"
                keyboardShouldPersistTaps="handled"
              >
                <View className="w-full bg-white rounded-sm">
                  {isLoading && (
                    <Text className="text-sm text-muted font-poppins-light p-4">
                      Searching...
                    </Text>
                  )}
                  {error && (
                    <Text className="text-sm text-danger font-poppins-light p-4">
                      {error.message}
                    </Text>
                  )}
                  {!isLoading && !error && results.length === 0 && (
                    <Text className="text-sm text-muted font-poppins-light p-4">
                      No locations found.
                    </Text>
                  )}
                  {!isLoading &&
                    results.map((location) => (
                      <PressableScale
                        key={location.id}
                        onPress={() =>
                          handleAddLocation({
                            id: location.id,
                            name: location.name,
                            admin1: location.admin1,
                            latitude: location.latitude,
                            longitude: location.longitude,
                          })
                        }
                      >
                        <View className="p-4">
                          <Text className="text-md text-primary font-poppins-medium">
                            {location.name}
                          </Text>
                          <Text className="text-sm text-muted font-poppins-light">
                            {location.admin1 ?? "Philippines"}
                          </Text>
                        </View>
                      </PressableScale>
                    ))}
                </View>
              </ScrollView>
            )}
            {savedLocations.length === 0 ? (
              <Text className="text-md text-muted font-poppins-light">
                Add a location...
                {/** isLocationUnavailable 
                    ? "Location unavailable. Add a location below."
                    : "Add a location." */}
              </Text>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={Platform.OS === "web"}
                onLayout={(e) => setCardsWidth(e.nativeEvent.layout.width)}
              >
                <View className="flex-row gap-x-4">
                  {savedLocations.slice(0, 5).map((location) => (
                    <View
                      key={location.id}
                      className="bg-white rounded-sm p-4"
                      style={
                        cardsWidth > 0
                          ? {
                              width:
                                savedLocations.length === 1
                                  ? cardsWidth
                                  : cardsWidth * 0.85,
                            }
                          : undefined
                      }
                    >
                      <View className="flex-row justify-between">
                        <View>
                          <Text className="text-xl text-primary font-poppins-semibold">
                            {weather.data[location.id]
                              ? `${Math.round(weather.data[location.id].temperature)}°C`
                              : "—"}
                          </Text>
                          <Text className="text-sm text-muted font-poppins-light">
                            {location.source === "device"
                              ? "CURRENT LOCATION"
                              : "SAVED LOCATION"}
                          </Text>
                          <Text className="text-lg text-primary font-poppins-bold">
                            {location.name}
                          </Text>
                          <Text className="text-md text-primary font-poppins-semibold">
                            {location.admin1 ?? "Philippines"}
                          </Text>
                          <Text className="text-md text-primary font-poppins-regular">
                            {weather.data[location.id]
                              ? getWeatherCondition(
                                  weather.data[location.id].weatherCode,
                                ).label
                              : "—"}
                          </Text>
                        </View>
                        <View>
                          {weather.data[location.id] ? (
                            <Ionicons
                              name={
                                getWeatherCondition(
                                  weather.data[location.id].weatherCode,
                                ).icon
                              }
                              size={56}
                              color={colors.primary}
                            />
                          ) : (
                            <Image
                              source={icons.partlySunny}
                              style={{ width: 56, height: 56 }}
                            />
                          )}
                        </View>
                      </View>
                      <View className="flex-row justify-between">
                        <View className="flex-row items-center gap-x-2">
                          <SimpleLineIcons
                            name="drop"
                            size={16}
                            color={colors.primary}
                          />
                          <Text className="text-sm text-muted font-poppins-light">
                            24-HR RAIN:{" "}
                            {weather.data[location.id]
                              ? `${weather.data[location.id].rain24h.toFixed(2)} mm`
                              : "—"}
                          </Text>
                        </View>
                        <View className="flex-row items-center gap-x-2">
                          <Ionicons
                            name="thermometer"
                            size={16}
                            color={colors.primary}
                          />
                          <Text className="text-sm text-muted font-poppins-light">
                            MAX HEAT INDEX:{" "}
                            {weather.data[location.id]
                              ? `${Math.round(weather.data[location.id].maxHeatIndex)}°C`
                              : "—"}
                          </Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              </ScrollView>
            )}
          </View>
          {/** observation section: view observations for a specific location (includes heat index, temperature, humidity, precipitation, and pressure) */}
          {/** personalization: search location and display one location at a time only based on search input */}
          <View
            className="w-full p-4 gap-y-2"
            onLayout={(e) => {
              sectionY.current.observations = e.nativeEvent.layout.y;
            }}
          >
            <View className="flex-row">
              <Text className="text-lg text-primary font-poppins-bold">
                Observations
              </Text>
            </View>
            <SearchBar
              value={observationQuery}
              onChangeText={setObservationQuery}
              placeholder="Search observations..."
              onFocus={() => handleSearchFocus("observations")}
            />
            {showObsResults && (
              <ScrollView
                className="max-h-64"
                keyboardShouldPersistTaps="handled"
              >
                <View className="w-full bg-white rounded-sm">
                  {obsSearch.isLoading && (
                    <Text className="text-sm text-muted font-poppins-light p-4">
                      Searching...
                    </Text>
                  )}
                  {obsSearch.error && (
                    <Text className="text-sm text-danger font-poppins-light p-4">
                      {obsSearch.error.message}
                    </Text>
                  )}
                  {!obsSearch.isLoading &&
                    !obsSearch.error &&
                    obsSearch.results.length === 0 && (
                      <Text className="text-sm text-muted font-poppins-light p-4">
                        No locations found.
                      </Text>
                    )}
                  {!obsSearch.isLoading &&
                    obsSearch.results.map((location) => (
                      <PressableScale
                        key={location.id}
                        onPress={() =>
                          handleSelectObservation({
                            id: location.id,
                            name: location.name,
                            admin1: location.admin1,
                            latitude: location.latitude,
                            longitude: location.longitude,
                          })
                        }
                      >
                        <View className="p-4">
                          <Text className="text-md text-primary font-poppins-medium">
                            {location.name}
                          </Text>
                          <Text className="text-sm text-muted font-poppins-light">
                            {location.admin1 ?? "Philippines"}
                          </Text>
                        </View>
                      </PressableScale>
                    ))}
                </View>
              </ScrollView>
            )}
            {selectedObservation === null ? (
              <Text className="text-md text-muted font-poppins-light">
                Select a location...
              </Text>
            ) : isObsFetching && !activeObsWeather ? (
              <Text className="text-md text-muted font-poppins-light">
                Loading observations...
              </Text>
            ) : obsError && !activeObsWeather ? (
              <Text className="text-md text-danger font-poppins-light">
                {obsError.message}
              </Text>
            ) : activeObsWeather ? (
              <View className="w-full bg-white rounded-sm p-4">
                <Text className="text-sm text-muted font-poppins-light">
                  {dayjs(activeObsWeather.observationTime).format(
                    "MMM D, h:mm A",
                  )}
                </Text>
                <View className="flex-row justify-between">
                  <View>
                    <Text className="text-lg text-primary font-poppins-bold">
                      {selectedObservation.name},{" "}
                      {selectedObservation.admin1 ?? "Philippines"}
                    </Text>
                    <Text className="text-md text-primary font-poppins-regular">
                      {getWeatherCondition(activeObsWeather.weatherCode).label}
                    </Text>
                  </View>
                  <Ionicons
                    name={
                      getWeatherCondition(activeObsWeather.weatherCode).icon
                    }
                    size={56}
                    color={colors.primary}
                  />
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-md text-primary font-poppins-regular">
                    Heat Index: {Math.round(activeObsWeather.heatIndex)}°C
                  </Text>
                  <Text className="text-md text-primary font-poppins-regular">
                    Precipitation: {activeObsWeather.precipitation.toFixed(2)}{" "}
                    mm
                  </Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-md text-primary font-poppins-regular">
                    Temperature: {Math.round(activeObsWeather.temperature)}°C
                  </Text>
                  <Text className="text-md text-primary font-poppins-regular">
                    Pressure: {Math.round(activeObsWeather.pressure)} hPa
                  </Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-md text-primary font-poppins-regular">
                    Humidity: {Math.round(activeObsWeather.humidity)}%
                  </Text>
                  <Text className="text-md text-primary font-poppins-regular">
                    Wind: {Math.round(activeObsWeather.windSpeed)} km/h
                  </Text>
                </View>
              </View>
            ) : (
              <Text className="text-md text-muted font-poppins-light">
                Select a location...
              </Text>
            )}
          </View>
          {/** display forecast for main location, which is the phone's location */}
          <View className="w-full bg-white rounded-sm shadow-md shadow-slate-400/30 p-4">
            <Text>Forecast</Text>
          </View>
        </View>
        {keyboardHeight > 0 && Platform.OS === "android" ? (
          <View style={{ height: keyboardHeight }} />
        ) : null}
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default Weather;
