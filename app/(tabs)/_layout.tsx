import "@/global.css";
import {
  DrawerContentScrollView,
  DrawerItemList,
} from "@react-navigation/drawer";
import { router } from "expo-router";
import { Drawer } from "expo-router/drawer";
import { Image, Pressable, Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";
import { DrawerRoutes } from "../../constants/data";
import { icons } from "../../constants/icons";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Drawer
        screenOptions={{
          drawerActiveTintColor: "rgba(11, 61, 89, 0.44)",
        }}
        drawerContent={(props) => (
          <View className="flex-1 bg-background">
            <SafeAreaView
              style={{ backgroundColor: "#0b3d59" }}
              edges={["top", "bottom"]}
            >
              <View className="flex-row items-center">
                <Image
                  source={icons.logo}
                  style={{ width: 112, height: 112 }}
                />
                <View className="flex-1">
                  <Text className="text-xl font-bold text-white">
                    AmmoSense
                  </Text>
                  <Text className="text-md text-white">
                    Predictive Water Quality Monitoring
                  </Text>
                </View>
              </View>
            </SafeAreaView>
            <DrawerContentScrollView
              {...props}
              contentContainerStyle={{ paddingTop: 12 }}
            >
              <DrawerItemList {...props} />
            </DrawerContentScrollView>
            <SafeAreaView edges={["bottom"]}>
              <View className="mt-auto px-6 pb-6 items-center justify-center">
                <Pressable
                  onPress={() => {
                    console.log("Sign Out");
                    router.replace("/(auth)/sign-in");
                  }}
                  style={({ pressed }) =>
                    pressed ? { transform: [{ scale: 0.97 }] } : {}
                  }
                >
                  <Text className="bg-primary py-3 px-12 rounded-bg shadow-md shadow-slate-400/30 text-lg text-white">
                    Sign Out
                  </Text>
                </Pressable>
              </View>
            </SafeAreaView>
          </View>
        )}
      >
        {DrawerRoutes.map((route) => (
          <Drawer.Screen
            key={route.name}
            name={route.name}
            options={{
              title: route.title,
              drawerLabel: () => (
                <View className="flex-1">
                  <Text className="text-lg text-secondary font-bold">
                    {route.title}
                  </Text>
                  <Text className="text-sm text-accent">
                    {route.description}
                  </Text>
                </View>
              ),
              drawerIcon: () => <Image source={route.icon} />,
            }}
          />
        ))}
      </Drawer>
    </GestureHandlerRootView>
  );
}
