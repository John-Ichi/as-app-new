import PressableScale from "@/components/PressableScale";
import SearchBar from "@/components/SearchBar";
import { ErrorState, LoadingState } from "@/components/StateDisplay";
import { colors } from "@/constants/theme";
import { getWeatherCondition } from "@/constants/weather";
import {
  distanceKm,
  MATCH_RADIUS_KM,
  useCurrentLocation,
} from "@/hooks/useCurrentLocation";
import { useLocationSearch } from "@/hooks/useLocationSearch";
import { useSavedLocations } from "@/hooks/useSavedLocations";
import { useSelectedObservation } from "@/hooks/useSelectedObservation";
import { REFRESH_INTERVAL_MS, useWeather } from "@/hooks/useWeather";
import { fetchWeather } from "@/services/openMeteo";
import type {
  GeocodedLocation,
  SavedLocation,
  WeatherInfo,
} from "@/services/types";
import Ionicons from "@expo/vector-icons/Ionicons";
import SimpleLineIcons from "@expo/vector-icons/SimpleLineIcons";
import { useDrawerStatus } from "@react-navigation/drawer";
import dayjs from "dayjs";
import { useFocusEffect } from "expo-router";
import { styled } from "nativewind";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  LayoutChangeEvent,
  Platform,
  Pressable,
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

function toSavedLocation(location: GeocodedLocation): SavedLocation {
  const { id, name, admin1, latitude, longitude } = location;
  return { id, name, admin1, latitude, longitude };
}

function handleQueryChange(
  setter: (value: string) => void,
  setOpen: (open: boolean) => void,
) {
  return (text: string) => {
    setter(text);
    setOpen(true);
  };
}

function LocationResultsBody({
  search,
  onSelect,
}: {
  search: {
    results: GeocodedLocation[];
    isLoading: boolean;
    error: Error | null;
  };
  onSelect: (location: SavedLocation) => void;
}) {
  const { results, isLoading, error } = search;
  return (
    <View className="w-full">
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
            onPress={() => onSelect(toSavedLocation(location))}
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
  );
}

function LocationSearchResults({
  search,
  onSelect,
}: {
  search: {
    results: GeocodedLocation[];
    isLoading: boolean;
    error: Error | null;
  };
  onSelect: (location: SavedLocation) => void;
}) {
  const list = (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      nestedScrollEnabled
      style={{ maxHeight: 256 }}
    >
      <LocationResultsBody search={search} onSelect={onSelect} />
    </ScrollView>
  );
  if (Platform.OS === "web") {
    return <View className="bg-white rounded-sm mt-2">{list}</View>;
  }
  return (
    <View
      style={{
        position: "absolute",
        top: "100%",
        left: 0,
        right: 0,
        marginTop: 4,
        maxHeight: 256,
        elevation: 5,
        zIndex: 5,
      }}
      className="bg-white rounded-sm"
    >
      {list}
    </View>
  );
}

const Weather = () => {
  const [cardsWidth, setCardsWidth] = useState(0);

  const [locationQuery, setLocationQuery] = useState("");
  const [observationQuery, setObservationQuery] = useState("");
  const {
    selection: selectedObservation,
    storedWeather,
    fetchedAt: obsFetchedAt,
    isHydrated: isSelectionHydrated,
    select: selectObservation,
    deselect: deselectObservation,
  } = useSelectedObservation();
  const [editMode, setEditMode] = useState(false);
  const [obsWeather, setObsWeather] = useState<WeatherInfo | null>(null);
  const [isObsFetching, setIsObsFetching] = useState(false);
  const [obsError, setObsError] = useState<Error | null>(null);
  const [locOpen, setLocOpen] = useState(false);
  const [obsOpen, setObsOpen] = useState(false);
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
  const {
    savedLocations,
    isHydrated,
    addLocation,
    seedDeviceLocation,
    removeLocation,
  } = useSavedLocations();
  const weather = useWeather(savedLocations, {
    enabled: !isLocationLoading && isHydrated,
  });
  const hasAnyWeather = Object.keys(weather.data).length > 0;

  useEffect(() => {
    if (!currentLocation) return;
    seedDeviceLocation(currentLocation);
  }, [currentLocation, seedDeviceLocation]);

  useEffect(() => {
    if (editMode && !hasRemovableLocations) {
      setEditMode(false);
    }
  }, [editMode, savedLocations.length]);

  const selectedObsId = selectedObservation?.id ?? null;
  const savedObsWeather =
    selectedObsId !== null &&
    savedLocations.some((loc) => loc.id === selectedObsId)
      ? weather.data[selectedObsId]
      : undefined;

  const [obsNow, setObsNow] = useState(Date.now());
  useFocusEffect(
    useCallback(() => {
      let timer: ReturnType<typeof setTimeout> | undefined;

      const schedule = (delayMs: number) => {
        timer = setTimeout(() => {
          setObsNow(Date.now());
          // A successful fetch updates obsFetchedAt, which re-runs this callback
          // and reschedules from the new expiry. If no fetch happened (failure,
          // or cached saved-location weather), fall back to the normal cadence.
          schedule(REFRESH_INTERVAL_MS);
        }, delayMs);
      };

      setObsNow(Date.now()); // stale check immediately on focus
      const expiry =
        obsFetchedAt !== null
          ? obsFetchedAt + REFRESH_INTERVAL_MS
          : Date.now() + REFRESH_INTERVAL_MS;
      schedule(Math.max(0, expiry - Date.now()));

      return () => {
        if (timer) clearTimeout(timer);
      };
    }, [obsFetchedAt]),
  );

  useEffect(() => {
    if (!selectedObservation || savedObsWeather) {
      setObsWeather(null);
      setObsError(null);
      setIsObsFetching(false);
      return;
    }
    // Fresh stored snapshot → no fetch needed (mirrors useWeather's staleness rule)
    if (
      storedWeather !== null &&
      obsFetchedAt !== null &&
      Date.now() - obsFetchedAt < REFRESH_INTERVAL_MS
    ) {
      setObsWeather(null);
      setObsError(null);
      setIsObsFetching(false);
      return;
    }
    const controller = new AbortController();
    setIsObsFetching(true);
    // On refresh the previous snapshot intentionally stays rendered — the
    // card never goes blank while a background update runs.
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
        if (info) selectObservation(selectedObservation, info);
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
  }, [
    selectedObservation,
    savedObsWeather,
    storedWeather,
    obsFetchedAt,
    obsNow,
    selectObservation,
  ]);

  const [upToDate, setUpToDate] = useState(false);
  const upToDateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (upToDateTimerRef.current) clearTimeout(upToDateTimerRef.current);
      if (blurTimer.current) clearTimeout(blurTimer.current);
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

  const scrollToSection = useCallback((key: "locations" | "observations") => {
    scrollRef.current?.scrollTo({
      y: Math.max(sectionY.current[key] - 8, 0),
      animated: true,
    });
  }, []);

  const recordSection =
    (key: "locations" | "observations") => (e: LayoutChangeEvent) => {
      sectionY.current[key] = e.nativeEvent.layout.y;
    };

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
    if (blurTimer.current) {
      clearTimeout(blurTimer.current);
      blurTimer.current = null;
    }
    if (key === "locations") {
      setLocOpen(true);
      setObsOpen(false);
    } else {
      setObsOpen(true);
      setLocOpen(false);
    }
    if (keyboardVisible.current) scrollToSection(key);
    else pendingSection.current = key;
  };

  const dismissSearch = useCallback(() => {
    Keyboard.dismiss();
    setLocOpen(false);
    setObsOpen(false);
  }, []);

  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearchBlur = () => {
    if (Platform.OS !== "web") return;
    if (blurTimer.current) clearTimeout(blurTimer.current);
    blurTimer.current = setTimeout(() => dismissSearch(), 150);
  };

  const resetSearch = useCallback(() => {
    dismissSearch();
    setLocationQuery("");
    setObservationQuery("");
  }, [dismissSearch]);

  useFocusEffect(useCallback(() => () => resetSearch(), [resetSearch]));

  const drawerStatus = useDrawerStatus();
  useEffect(() => {
    if (drawerStatus === "open") dismissSearch();
  }, [drawerStatus, dismissSearch]);

  const handleRefresh = () => {
    dismissSearch();
    if (weather.refetch()) return;
    setUpToDate(true);
    if (upToDateTimerRef.current) clearTimeout(upToDateTimerRef.current);
    upToDateTimerRef.current = setTimeout(() => setUpToDate(false), 2000);
  };

  const showResults = locOpen && locationQuery.trim().length >= 2;
  const showObsResults = obsOpen && observationQuery.trim().length >= 2;

  if (
    isLocationLoading ||
    !isHydrated ||
    !isSelectionHydrated ||
    (weather.isFetching && !hasAnyWeather)
  )
    return <LoadingState />;
  if (weather.error && !hasAnyWeather)
    return (
      <ErrorState message={weather.error.message} onRetry={weather.refetch} />
    );

  const handleAddLocation = (location: SavedLocation) => {
    addLocation(location);
    setLocationQuery("");
    clearResults();
    setLocOpen(false);
  };

  const handleSelectObservation = (location: SavedLocation) => {
    // Recognize the device location so weather.data hits instantly with no
    // duplicate fetch. The device card is identified by either textual
    // identity (name+admin1) or geometric proximity, since the reverse
    // geocoder and the Open-Meteo geocoder rarely agree on both.
    const deviceLoc = savedLocations.find((loc) => loc.source === "device");
    if (deviceLoc && deviceLoc.id !== location.id) {
      // const nameMatches =
      // deviceLoc.name === location.name &&
      // deviceLoc.admin1 === location.admin1;
      if (distanceKm(location, deviceLoc) < MATCH_RADIUS_KM) {
        selectObservation(
          deviceLoc,
          weather.data[deviceLoc.id] ?? null,
          weather.lastUpdated,
        );
        setObservationQuery("");
        obsSearch.clearResults();
        setObsOpen(false);
        return;
      }
    }
    selectObservation(
      location,
      weather.data[location.id] ?? null,
      weather.lastUpdated,
    );
    setObservationQuery("");
    obsSearch.clearResults();
    setObsOpen(false);
  };

  const handleClearObservation = () => {
    deselectObservation();
    setObservationQuery("");
  };

  const activeObsWeather =
    selectedObservation !== null
      ? (savedObsWeather ?? storedWeather ?? obsWeather)
      : null;

  const forecastLocation =
    savedLocations.find((loc) => loc.source === "device") ??
    savedLocations[0] ??
    null;
  const forecast =
    forecastLocation !== null
      ? (weather.data[forecastLocation.id]?.hourlyForecast ?? null)
      : null;

  const obsFields = activeObsWeather
    ? [
        {
          value: `${Math.round(activeObsWeather.temperature)} °C`,
          label: "Temperature",
        },
        {
          value: `${activeObsWeather.precipitation.toFixed(2)} mm`,
          label: "Precipitation",
        },
        {
          value: `${Math.round(activeObsWeather.heatIndex)} °C`,
          label: "Heat Index",
        },
        {
          value: `${Math.round(activeObsWeather.pressure)} hPa`,
          label: "Pressure",
        },
        {
          value: `${Math.round(activeObsWeather.humidity)}%`,
          label: "Humidity",
        },
        {
          value: `${Math.round(activeObsWeather.windSpeed)} km/h`,
          label: "Wind",
        },
      ]
    : [];

  const isUpdating = isLocationValidating || weather.isFetching;
  const newestUpdated =
    locationLastUpdated !== null && weather.lastUpdated !== null
      ? Math.max(locationLastUpdated, weather.lastUpdated)
      : (locationLastUpdated ?? weather.lastUpdated);
  const showStrip = isUpdating || newestUpdated !== null || hasAnyWeather;

  const BADGE_OVERHANG = 12;
  const hasRemovableLocations = savedLocations.some(
    (loc) => loc.source !== "device",
  );
  const showBadgeReserve = editMode && hasRemovableLocations;

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
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          ref={scrollRef}
          className="flex-1 bg-background rounded-t-xl"
          /* contentContainerClassName="pb-4" */
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          scrollEnabled={
            Platform.OS === "web" ? true : !(showResults || showObsResults)
          }
          refreshControl={
            <RefreshControl
              refreshing={weather.isFetching}
              onRefresh={handleRefresh}
              enabled={
                Platform.OS === "web" ? true : !(showResults || showObsResults)
              }
              tintColor={colors.white}
              colors={[colors.primary]}
            />
          }
        >
          <View className="w-full max-w-xl mx-auto pt-4 px-4">
            {/** location section: features add location, display current weather data e.g. temperature, rain data (24 hour rain forecast? includes mm and type e.g. very light, moderate, heavy), and max heat index */}
            {/** features also include editing locations */}
            {/** personalization: horizontal scrolling, view all locations via modal */}
            <View
              className="w-full px-4 pt-4 gap-y-2"
              onLayout={recordSection("locations")}
            >
              <View className="flex-row justify-between items-center">
                <Text className="text-lg text-primary font-poppins-bold">
                  Locations
                </Text>
                {hasRemovableLocations && (
                  <PressableScale
                    onPress={() => setEditMode((prev) => !prev)}
                    accessibilityRole="button"
                    accessibilityLabel="Toggle editing of locations"
                  >
                    <Text className="text-md text-muted font-poppins-light">
                      {editMode ? "Done" : "Edit"}
                    </Text>
                  </PressableScale>
                )}
              </View>
              <View>
                <SearchBar
                  value={locationQuery}
                  onChangeText={handleQueryChange(setLocationQuery, setLocOpen)}
                  onFocus={() => handleSearchFocus("locations")}
                  onBlur={handleSearchBlur}
                />
                {/** results */}
                {showResults && (
                  <LocationSearchResults
                    search={{ results, isLoading, error }}
                    onSelect={handleAddLocation}
                  />
                )}
              </View>
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
                  contentContainerStyle={[
                    showBadgeReserve && { paddingTop: 12, paddingRight: 12 },
                    { paddingBottom: 8 },
                  ]}
                  onLayout={(e) => setCardsWidth(e.nativeEvent.layout.width)}
                >
                  <View className="flex-row gap-x-4">
                    {savedLocations.slice(0, 5).map((location) => {
                      const info = weather.data[location.id];
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
                              onPress={() => removeLocation(location.id)}
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
                                {info
                                  ? `${Math.round(info.temperature)} °C`
                                  : "—"}
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
                              <Text className="text-sm text-muted font-poppins-light">
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
                              <Text className="text-sm text-muted font-poppins-light">
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
              )}
            </View>
            {/** observation section: view observations for a specific location (includes heat index, temperature, humidity, precipitation, and pressure) */}
            {/** personalization: search location and display one location at a time only based on search input */}
            <View
              className="w-full px-4 pt-4 gap-y-2"
              onLayout={recordSection("observations")}
            >
              <View className="flex-row justify-between items-center">
                <Text className="text-lg text-primary font-poppins-bold">
                  Observations
                </Text>
                {selectedObservation !== null && (
                  <PressableScale
                    onPress={handleClearObservation}
                    accessibilityRole="button"
                    accessibilityLabel="Clear the selected observation"
                  >
                    <Text className="text-md text-muted font-poppins-light">
                      Clear
                    </Text>
                  </PressableScale>
                )}
              </View>
              <View>
                <SearchBar
                  value={observationQuery}
                  onChangeText={handleQueryChange(
                    setObservationQuery,
                    setObsOpen,
                  )}
                  placeholder="Search observations..."
                  onFocus={() => handleSearchFocus("observations")}
                  onBlur={handleSearchBlur}
                />
                {showObsResults && (
                  <LocationSearchResults
                    search={obsSearch}
                    onSelect={handleSelectObservation}
                  />
                )}
              </View>
              {selectedObservation === null ? (
                <Text className="text-md text-muted font-poppins-light">
                  Select a location...
                </Text>
              ) : isObsFetching && !activeObsWeather ? (
                <View className="items-center gap-y-2 py-6">
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text className="text-md text-muted font-poppins-light">
                    Loading observations...
                  </Text>
                </View>
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
                  <View className="flex-row justify-between pb-2">
                    <View>
                      <Text className="text-lg text-primary font-poppins-bold">
                        {selectedObservation.name},{" "}
                        {selectedObservation.admin1 ?? "Philippines"}
                      </Text>
                      <Text className="text-md text-primary font-poppins-regular">
                        {
                          getWeatherCondition(activeObsWeather.weatherCode)
                            .label
                        }
                      </Text>
                    </View>
                    <Ionicons
                      name={
                        getWeatherCondition(activeObsWeather.weatherCode).icon
                      }
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
              ) : (
                <Text className="text-md text-muted font-poppins-light">
                  Select a location...
                </Text>
              )}
            </View>
            {/** display forecast for main location, which is the phone's location */}
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
              ) : weather.isFetching ? (
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
          </View>
          {keyboardHeight > 0 && Platform.OS === "android" ? (
            <View style={{ height: keyboardHeight }} />
          ) : null}
          {Platform.OS !== "web" && (showResults || showObsResults) && (
            <Pressable
              onPress={dismissSearch}
              accessibilityRole="button"
              accessibilityLabel="Dismiss search"
              style={{
                position: "absolute",
                top: 0,
                bottom: 0,
                left: 0,
                right: 0,
                elevation: 4,
                zIndex: 4,
              }}
            />
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default Weather;
