import PressableScale from "@/components/PressableScale";
import SearchBar from "@/components/SearchBar";
import { ErrorState, LoadingState } from "@/components/StateDisplay";
import {
  ForecastStrip,
  LocationCards,
  LocationSearchResults,
  ObservationCard,
} from "@/components/weather";
import { colors } from "@/constants/theme";
import {
  distanceKm,
  MATCH_RADIUS_KM,
  useCurrentLocation,
} from "@/hooks/useCurrentLocation";
import { useLocationSearch } from "@/hooks/useLocationSearch";
import { useObservationWeather } from "@/hooks/useObservationWeather";
import { useSavedLocations } from "@/hooks/useSavedLocations";
import { useSearchChoreography } from "@/hooks/useSearchChoreography";
import { useSearchInputs } from "@/hooks/useSearchInputs";
import { useSectionScroll } from "@/hooks/useSectionScroll";
import { useSelectedObservation } from "@/hooks/useSelectedObservation";
import { useWeather } from "@/hooks/useWeather";
import { useWeatherFreshness } from "@/hooks/useWeatherFreshness";
import type { SavedLocation } from "@/services/types";
import Ionicons from "@expo/vector-icons/Ionicons";
import dayjs from "dayjs";
import { styled } from "nativewind";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import Animated from "react-native-reanimated";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

const SafeAreaView = styled(RNSafeAreaView);

const Weather = () => {
  const {
    locationQuery,
    observationQuery,
    setLocationQuery,
    setObservationQuery,
    setLocOpen,
    setObsOpen,
    showResults,
    showObsResults,
    handleLocationQueryChange,
    handleObservationQueryChange,
  } = useSearchInputs();
  const {
    selection: selectedObservation,
    storedWeather,
    fetchedAt: obsFetchedAt,
    isHydrated: isSelectionHydrated,
    select: selectObservation,
    deselect: deselectObservation,
  } = useSelectedObservation();
  const [editMode, setEditMode] = useState(false);
  const { results, isLoading, error, clearResults } =
    useLocationSearch(locationQuery);
  const obsSearch = useLocationSearch(observationQuery);
  const {
    location: currentLocation,
    isLoading: isLocationLoading,
    isValidating: isLocationValidating,
    lastUpdated: locationLastUpdated,
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
  const hasRemovableLocations = savedLocations.some(
    (loc) => loc.source !== "device",
  );

  useEffect(() => {
    if (!currentLocation) return;
    seedDeviceLocation(currentLocation);
  }, [currentLocation, seedDeviceLocation]);

  useEffect(() => {
    if (editMode && !hasRemovableLocations) {
      setEditMode(false);
    }
  }, [editMode, hasRemovableLocations]);

  const selectedObsId = selectedObservation?.id ?? null;
  const savedObsWeather =
    selectedObsId !== null &&
    savedLocations.some((loc) => loc.id === selectedObsId)
      ? weather.data[selectedObsId]
      : undefined;

  const {
    snapshot: obsSnapshot,
    isFetching: isObsFetching,
    error: obsError,
  } = useObservationWeather({
    selectedObservation,
    savedObsWeather,
    storedWeather,
    obsFetchedAt,
    selectObservation,
  });

  const { upToDate, markUpToDate, spinStyle } = useWeatherFreshness(
    weather.isFetching,
  );

  const { scrollRef, recordSection, scrollToSection } = useSectionScroll();

  const { keyboardHeight, handleSearchFocus, handleSearchBlur, dismissSearch } =
    useSearchChoreography({
      scrollToSection,
      setLocationQuery,
      setObservationQuery,
      setLocOpen,
      setObsOpen,
    });

  const handleRefresh = () => {
    dismissSearch();
    if (weather.refetch()) return;
    markUpToDate();
  };

  if (
    isLocationLoading ||
    !isHydrated ||
    !isSelectionHydrated ||
    (weather.isFetching && !hasAnyWeather)
  )
    return <LoadingState />;
  if (weather.error && !hasAnyWeather)
    return (
      <ErrorState
        error={weather.error}
        action={{ label: "Try again", onPress: weather.refetch }}
      />
    );

  const handleAddLocation = (location: SavedLocation) => {
    addLocation(location);
    setLocationQuery("");
    clearResults();
    setLocOpen(false);
  };

  const handleSelectObservation = (location: SavedLocation) => {
    const deviceLoc = savedLocations.find((loc) => loc.source === "device");
    if (deviceLoc && deviceLoc.id !== location.id) {
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
      ? (savedObsWeather ??
        storedWeather ??
        (obsSnapshot?.id === selectedObservation.id ? obsSnapshot.info : null))
      : null;

  const isBusy = isLocationValidating || weather.isFetching;
  const newestUpdated =
    locationLastUpdated !== null && weather.lastUpdated !== null
      ? Math.max(locationLastUpdated, weather.lastUpdated)
      : (locationLastUpdated ?? weather.lastUpdated);

  const showBadgeReserve = editMode && hasRemovableLocations;

  return (
    <SafeAreaView edges={["bottom"]} className="flex-1 bg-primary">
      <View className="bg-primary flex-row items-center justify-center py-2 px-4 gap-x-4">
        <Text className="text-sm text-white font-poppins-regular">
          {newestUpdated !== null
            ? `Last updated: ${dayjs(newestUpdated).format("h:mm A")}`
            : "Not updated yet"}
        </Text>
        {weather.error !== null && hasAnyWeather && !isBusy ? (
          <Text className="text-xs text-danger font-poppins-regular">
            Couldn&apos;t refresh
          </Text>
        ) : null}
        {upToDate && !isBusy ? (
          <Text className="text-xs text-white font-poppins-regular">
            Up to date
          </Text>
        ) : null}
        {isBusy ? (
          <ActivityIndicator size="small" color={colors.white} />
        ) : (
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
        )}
      </View>
      <KeyboardAvoidingView
        className="flex-1 w-full max-w-xl mx-auto"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          ref={scrollRef}
          className="bg-background rounded-t-xl"
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
          <View className="pt-4 px-4">
            <View
              className="px-4 pt-4 gap-y-2"
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
                  onChangeText={handleLocationQueryChange}
                  onFocus={() => handleSearchFocus("locations")}
                  onBlur={handleSearchBlur}
                />
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
                </Text>
              ) : (
                <LocationCards
                  savedLocations={savedLocations}
                  weatherData={weather.data}
                  editMode={editMode}
                  showBadgeReserve={showBadgeReserve}
                  onRemove={removeLocation}
                />
              )}
            </View>
            <View
              className="px-4 pt-4 gap-y-2"
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
                  onChangeText={handleObservationQueryChange}
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
                <ObservationCard
                  observation={selectedObservation}
                  info={activeObsWeather}
                />
              ) : (
                <Text className="text-md text-muted font-poppins-light">
                  Select a location...
                </Text>
              )}
            </View>
            <ForecastStrip
              savedLocations={savedLocations}
              weatherData={weather.data}
              isFetching={weather.isFetching}
            />
            <Text className="text-sm text-muted font-poppins-light text-center pt-4 pb-6">
              Weather data by Open-Meteo.com (CC BY 4.0)
            </Text>
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
