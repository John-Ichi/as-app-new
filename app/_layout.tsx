import "@/global.css";
import { useFonts } from "expo-font";
import { SplashScreen, Stack } from "expo-router";
import { useEffect } from "react";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
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
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);
  if (!fontsLoaded) return null;
  return <Stack screenOptions={{ headerShown: false }} />;
}
