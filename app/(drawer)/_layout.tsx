import { DrawerRoutes } from "@/constants/data";
import { icons } from "@/constants/icons";
import {
  DrawerContentScrollView,
  DrawerItemList,
} from "@react-navigation/drawer";
import { router } from "expo-router";
import { Drawer } from "expo-router/drawer";
import { styled } from "nativewind";
import { Image, Pressable, Text, View } from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

const SafeAreaView = styled(RNSafeAreaView);

export default function RootLayout() {
  return (
    <>
      {/** add function onPress for icons.alert */}
      <Drawer
        screenOptions={{
          drawerActiveTintColor: "rgba(11, 61, 89, 0.44)",
          headerBackground: () => <View className="flex-1 bg-primary" />,
          headerTitle: (props) => (
            <Text className="text-lg text-white font-poppins-bold">
              {props.children}
            </Text>
          ),
          headerRight: () => (
            <Pressable
              style={({ pressed }) =>
                pressed ? { transform: [{ scale: 0.97 }] } : {}
              }
            >
              <View className="size-10 pr-4 items-center justify-center">
                <Image
                  source={icons.alert}
                  className="size-full"
                  resizeMode="contain"
                />
              </View>
            </Pressable>
          ),
          headerTintColor: "#ffffff",
        }}
        drawerContent={(props) => (
          <View className="flex-1 bg-background">
            <SafeAreaView className="bg-primary" edges={["top", "bottom"]}>
              <View className="flex-row items-center pt-4 px-1">
                <Image
                  source={icons.logo}
                  style={{ width: 112, height: 112 }}
                />
                <View className="flex-1">
                  <Text className="text-xl text-white font-poppins-bold">
                    AmmoSense
                  </Text>
                  <Text className="text-md text-white font-poppins-medium">
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
              <View className="items-center justify-center mt-auto px-6 pb-6">
                {/** add function onPress for Disconnect */}
                <Pressable
                  onPress={() => {
                    router.replace("/onboarding");
                  }}
                  style={({ pressed }) =>
                    pressed ? { transform: [{ scale: 0.97 }] } : {}
                  }
                >
                  <Text className="bg-primary rounded-bg shadow-md shadow-slate-400/30 text-lg text-white font-poppins-medium py-3 px-12 ">
                    Disconnect
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
              ...(route.name === "graphs" ? { swipeEnabled: false } : {}),
              drawerLabel: () => (
                <View className="flex-1">
                  <Text className="text-lg text-secondary font-poppins-bold">
                    {route.title}
                  </Text>
                  <Text className="text-sm text-accent font-poppins-medium">
                    {route.description}
                  </Text>
                </View>
              ),
              drawerIcon: () => (
                <Image source={route.icon} className="size-8" />
              ),
            }}
          />
        ))}
      </Drawer>
    </>
  );
}
