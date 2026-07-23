import { colors } from "@/constants/theme";
import { DeviceProvider } from "@/contexts/DeviceContext";
import "@/global.css";
import { useFonts } from "expo-font";
import { SplashScreen, Stack } from "expo-router";
import { useEffect } from "react";
import { Text } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontsError] = useFonts({
    "poppins-black": require("../assets/fonts/Poppins-Black.ttf"),
    "poppins-bold": require("../assets/fonts/Poppins-Bold.ttf"),
    "poppins-extrabold": require("../assets/fonts/Poppins-ExtraBold.ttf"),
    "poppins-extralight": require("../assets/fonts/Poppins-ExtraLight.ttf"),
    "poppins-light": require("../assets/fonts/Poppins-Light.ttf"),
    "poppins-medium": require("../assets/fonts/Poppins-Medium.ttf"),
    "poppins-regular": require("../assets/fonts/Poppins-Regular.ttf"),
    "poppins-semibold": require("../assets/fonts/Poppins-SemiBold.ttf"),
    "poppins-thin": require("../assets/fonts/Poppins-Thin.ttf"),
  });
  useEffect(() => {
    if (fontsLoaded || fontsError) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontsError]);
  if (!fontsLoaded && !fontsError) return null;
  return (
    <GestureHandlerRootView className="flex-1">
      <DeviceProvider>
        <Stack
          initialRouteName="onboarding"
          screenOptions={{ headerShown: false }}
        >
          <Stack.Screen name="device-select" />
          <Stack.Screen
            name="parameters"
            options={{
              headerShown: true,
              title: "Water Quality Parameters",
              headerStyle: { backgroundColor: colors.primary },
              headerTitle: (props) => (
                <Text className="text-lg text-white font-poppins-bold">
                  {props.children}
                </Text>
              ),
              headerShadowVisible: false,
              headerTintColor: colors.white,
            }}
          />
          <Stack.Screen
            name="notifications"
            options={{
              headerShown: true,
              title: "Alert Notifications",
              headerStyle: { backgroundColor: colors.primary },
              headerTitle: (props) => (
                <Text className="text-lg text-white font-poppins-bold">
                  {props.children}
                </Text>
              ),
              headerShadowVisible: false,
              headerTintColor: colors.white,
            }}
          />
        </Stack>
      </DeviceProvider>
    </GestureHandlerRootView>
  );
}
