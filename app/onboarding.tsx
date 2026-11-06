import PressableScale from "@/components/PressableScale";
import { icons } from "@/constants/icons";
import { useDevice } from "@/contexts/DeviceContext";
import { Redirect, Stack, router } from "expo-router";
import { styled } from "nativewind";
import { Image, Text, View } from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

const SafeAreaView = styled(RNSafeAreaView);

const Onboarding = () => {
  const { selectedDevice, isHydrated } = useDevice();
  if (!isHydrated) return null;
  if (selectedDevice) return <Redirect href="/(drawer)" />;

  return (
    <SafeAreaView edges={["top", "bottom"]} className="flex-1 bg-background">
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-1 items-center justify-center">
        <Image
          source={icons.logo}
          style={{
            height: 240,
            width: "80%",
            maxWidth: 240,
            resizeMode: "contain",
          }}
        />
        <Text className="text-xl text-primary text-center font-poppins-bold">
          Welcome to AmmoSense!
        </Text>
        <Text className="text-lg text-muted text-center font-poppins-semibold">
          Predictive Water Quality Monitoring
        </Text>
      </View>
      <View className="items-center pb-18">
        <PressableScale onPress={() => router.push("/device-select")}>
          <Text className="text-white text-center text-lg font-poppins-semibold bg-primary rounded-xl p-4 px-8">
            Continue
          </Text>
        </PressableScale>
      </View>
    </SafeAreaView>
  );
};

export default Onboarding;
