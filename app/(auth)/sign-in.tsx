import { Link } from "expo-router";
import { Text, View } from "react-native";

const SignIn = () => {
  return (
    <View className="flex-1 items-center justify-center bg-background">
      <Text className="m-2 rounded-sm bg-primary text-white p-4">Sign-In</Text>
      <Link
        href="/(auth)/sign-up"
        className="m-2 rounded-sm bg-primary text-white p-4"
      >
        Sign-Up
      </Link>
      <Link href="/(tabs)" className="m-2 rounded-sm bg-primary text-white p-4">
        Index
      </Link>
      <Link
        href="/onboarding"
        className="m-2 rounded-sm bg-primary text-white p-4"
      >
        Onboarding
      </Link>
    </View>
  );
};

export default SignIn;
