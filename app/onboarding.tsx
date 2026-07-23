import PressableScale from "@/components/PressableScale";
import { icons } from "@/constants/icons";
import { Stack, router } from "expo-router";
import { styled } from "nativewind";
import { Image, Text, View } from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

const SafeAreaView = styled(RNSafeAreaView);

const Onboarding = () => {
  return (
    <SafeAreaView edges={["top", "bottom"]} className="flex-1 bg-background">
      <Stack.Screen options={{ headerShown: false }} />
      <View className="w-full max-w-xl mx-auto flex-1">
        <View className="flex-1 items-center justify-center">
          <Image source={icons.logo} style={{ height: 320, width: 320 }} />
          <Text className="text-xl text-primary font-poppins-bold">
            Welcome to AmmoSense!
          </Text>
          <Text className="text-lg text-muted font-poppins-semibold">
            Predictive Water Quality Monitoring
          </Text>
        </View>
        <View className="py-18 items-center">
          <PressableScale
            onPress={
              () =>
                router.push(
                  "/device-select",
                ) /** replace later to connect to IoT device */
            }
            className="w-[66%]"
          >
            <View className="bg-primary rounded-xl p-4">
              <Text className="text-white text-center text-lg font-poppins-semibold">
                Continue
              </Text>
            </View>
          </PressableScale>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default Onboarding;
