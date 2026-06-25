import { Link } from "expo-router";
import { Text, View } from "react-native";

const SignUp = () => {
  return (
    <View className="flex-1 items-center justify-center bg-background">
      <Text>Sign-Up</Text>
      <Link href="/(auth)/sign-in">Sign-In</Link>
    </View>
  );
};

export default SignUp;
