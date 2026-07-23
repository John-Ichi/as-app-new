import PressableScale from "@/components/PressableScale";
import { useDevice } from "@/contexts/DeviceContext";
import { useDevices } from "@/hooks/useDevices";
import { router, Stack } from "expo-router";
import { styled } from "nativewind";
import { FlatList, Text, View } from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

const SafeAreaView = styled(RNSafeAreaView);

const DeviceSelect = () => {
  const devices = useDevices();
  const { selectDevice } = useDevice();

  const handleSelect = (device: (typeof devices)[number]) => {
    selectDevice(device);
    router.push("/(drawer)");
  };

  return (
    <SafeAreaView edges={["top", "bottom"]} className="flex-1 bg-background">
      <Stack.Screen options={{ headerShown: false }} />
      <View className="w-full max-w-xl mx-auto flex-1 px-4">
        <Text className="text-xl text-center text-primary font-poppins-bold py-8">
          Select Device
        </Text>
        <FlatList
          data={devices}
          keyExtractor={(item) => item.id}
          contentContainerClassName="gap-y-4"
          renderItem={({ item }) => (
            <PressableScale onPress={() => handleSelect(item)}>
              <View className="flex-row bg-white rounded-bg shadow-md shadow-slate-400/30 items-center p-4">
                <View className="w-10 h-10 bg-success rounded-full items-center justify-center">
                  <Text className="text-lg text-white font-poppins-bold">
                    {"\u2713"}
                  </Text>
                </View>
                <View className="flex-1 ml-4">
                  <Text className="text-lg text-primary font-poppins-bold">
                    {item.name}
                  </Text>
                  <Text className="text-md text-muted font-poppins-medium">
                    {item.location}
                  </Text>
                </View>
              </View>
            </PressableScale>
          )}
        />
      </View>
    </SafeAreaView>
  );
};

export default DeviceSelect;
