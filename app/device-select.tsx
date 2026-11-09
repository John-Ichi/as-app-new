import PressableScale from "@/components/PressableScale";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "@/components/StateDisplay";
import { colors } from "@/constants/theme";
import { useDevice } from "@/contexts/DeviceContext";
import { useDevices } from "@/hooks/useDevices";
import AntDesign from "@expo/vector-icons/AntDesign";
import { router, Stack } from "expo-router";
import { styled } from "nativewind";
import { FlatList, Text, View } from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

const SafeAreaView = styled(RNSafeAreaView);

const DeviceSelect = () => {
  const { devices, isLoading, error } = useDevices();
  const { lastDevice, selectDevice } = useDevice();

  const handleSelect = (device: (typeof devices)[number]) => {
    selectDevice(device);
    router.push("/(drawer)");
  };

  if (isLoading) return <LoadingState />;
  if (error)
    return (
      <ErrorState
        error={error}
        action={{ label: "Back", onPress: () => router.replace("/onboarding") }}
      />
    );
  if (devices.length === 0)
    return (
      <EmptyState
        title="No devices available"
        message="Please add a device"
        action={{
          label: "Back",
          onPress: () => {
            selectDevice(null);
            router.replace("/onboarding");
          },
        }}
      />
    );

  return (
    <SafeAreaView edges={["top", "bottom"]} className="flex-1 bg-background">
      <Stack.Screen options={{ headerShown: false }} />
      <View className="w-full max-w-xl mx-auto flex-1 p-4">
        <View>
          <PressableScale
            onPress={() => router.replace("/onboarding")}
            hitSlop={20}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <AntDesign name="left" size={24} color={colors.primary} />
          </PressableScale>
        </View>
        <Text className="text-xl text-center text-primary font-poppins-bold pb-8 pt-4">
          Select Device
        </Text>
        <FlatList
          data={devices}
          keyExtractor={(item) => item.id}
          contentContainerClassName="gap-y-4"
          renderItem={({ item }) => {
            const isCurrent = lastDevice?.id === item.id;
            return (
              <PressableScale onPress={() => handleSelect(item)}>
                <View
                  className={`flex-row bg-white rounded-lg shadow-md shadow-slate-400/30 items-center p-4 gap-x-4 ${
                    isCurrent ? "border-2 border-primary" : ""
                  }`}
                >
                  <Text className="text-lg text-white font-poppins-bold bg-success rounded-full px-4 py-2">
                    {"\u2713"}
                  </Text>
                  <View className="flex-1">
                    <Text className="text-lg text-primary font-poppins-bold">
                      {item.name}
                    </Text>
                    <Text className="text-md text-muted font-poppins-medium">
                      {item.location}
                    </Text>
                    {isCurrent && (
                      <Text className="text-sm text-primary font-poppins-semibold mt-2">
                        PREVIOUSLY CONNECTED
                      </Text>
                    )}
                  </View>
                </View>
              </PressableScale>
            );
          }}
        />
      </View>
    </SafeAreaView>
  );
};

export default DeviceSelect;
