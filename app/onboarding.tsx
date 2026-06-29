import { icons } from "@/constants/icons";
import { Link, Stack } from "expo-router";
import { Image, Text, View } from "react-native";

const Onboarding = () => {
  return (
    <View className="flex-1 items-center justify-center bg-background">
      <Stack.Screen options={{ headerShown: false }} />
      <Image
        source={icons.logo}
        style={{ height: "35%", aspectRatio: 1134 / 618 }}
      />
      <Text className="text-xl text-primary font-poppins-bold">
        Welcome to AmmoSense!
      </Text>
      <Text className="text-lg text-accent font-poppins-semibold">
        Predictive Water Quality Monitoring
      </Text>
      <Link
        href="/(auth)/sign-in"
        className="rounded-bg bg-primary w-1/2 text-center text-white font-poppins-semibold mt-4 p-3.75"
      >
        Continue
      </Link>
    </View>
  );
};

export default Onboarding;
