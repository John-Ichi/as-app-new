import { Link, Stack } from "expo-router";
import { Image, Text, View } from "react-native";
import { icons } from "../constants/icons";

const Onboarding = () => {
  return (
    <View className="flex-1 items-center justify-center bg-background">
      <Stack.Screen options={{ headerShown: false }} />
      <Image
        source={icons.logo}
        style={{ height: "35%", aspectRatio: 1134 / 618 }}
      />
      <Text className="text-xl font-bold text-primary">
        Welcome to AmmoSense!
      </Text>
      <Text className="text-lg font-bold text-accent">
        Predictive Water Quality Monitoring
      </Text>
      <Link
        href="/(auth)/sign-in"
        className="w-1/3 text-center mt-4 rounded-bg bg-primary text-white p-4"
      >
        Continue
      </Link>
    </View>
  );
};

export default Onboarding;
