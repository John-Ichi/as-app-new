import PressableScale from "@/components/PressableScale";
import type {
  GeocodedLocation,
  SavedLocation,
} from "@/services/types";
import { Platform, ScrollView, Text, View } from "react-native";

export function toSavedLocation(location: GeocodedLocation): SavedLocation {
  const { id, name, admin1, latitude, longitude } = location;
  return { id, name, admin1, latitude, longitude };
}

interface SearchState {
  results: GeocodedLocation[];
  isLoading: boolean;
  error: Error | null;
}

interface LocationSearchResultsProps {
  search: SearchState;
  onSelect: (location: SavedLocation) => void;
}

function LocationResultsBody({ search, onSelect }: LocationSearchResultsProps) {
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

export function LocationSearchResults({
  search,
  onSelect,
}: LocationSearchResultsProps) {
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
