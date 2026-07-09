import { icons } from "@/constants/icons";
import { Link, Stack } from "expo-router";
import { styled } from "nativewind";
import { Image, Text, View } from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

const SafeAreaView = styled(RNSafeAreaView);

const Onboarding = () => {
  return (
    <View className="flex-1 bg-background">
      <View className="flex-1 items-center justify-center">
        <Stack.Screen options={{ headerShown: false }} />
        <Image
          source={icons.logo}
          style={{ height: "35%", aspectRatio: 1134 / 618 }}
        />
        <Text className="text-xl text-primary font-poppins-bold">
          Welcome to AmmoSense!
        </Text>
        <Text className="text-lg text-muted font-poppins-semibold">
          Predictive Water Quality Monitoring
        </Text>
      </View>
      <SafeAreaView edges={["bottom"]} className="pb-18 items-center">
        <Link
          href="/(drawer)"
          className="w-3/4 p-4 rounded-bg bg-primary text-center text-white font-poppins-semibold"
        >
          Continue
        </Link>
      </SafeAreaView>
    </View>
  );
};

export default Onboarding;
