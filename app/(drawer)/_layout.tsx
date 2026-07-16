import PressableScale from "@/components/PressableScale";
import { DrawerRoutes } from "@/constants/data";
import { icons } from "@/constants/icons";
import { colors } from "@/constants/theme";
import {
  DrawerContentScrollView,
  DrawerItem,
  DrawerItemList,
} from "@react-navigation/drawer";
import { router } from "expo-router";
import { Drawer } from "expo-router/drawer";
import { styled } from "nativewind";
import { Image, Text, View } from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

const SafeAreaView = styled(RNSafeAreaView);

export default function RootLayout() {
  return (
    <>
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
            <PressableScale
              onPress={() => {
                /** notification modal popup */
              }}
              style={{ borderRadius: 20, marginRight: 8, padding: 8 }}
              pressedStyle={{ backgroundColor: colors.pressed }}
            >
              <Image source={icons.alert} className="size-6" />
            </PressableScale>
          ),
          headerTintColor: "#ffffff",
        }}
        drawerContent={(props) => (
          <View className="flex-1 bg-background">
            <SafeAreaView className="bg-primary" edges={["top", "bottom"]}>
              <View className="flex-row items-center pt-4 px-2">
                <Image source={icons.logo} className="size-36" />
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
              <DrawerItem
                label={() => (
                  <View className="flex-1">
                    <Text className="text-lg text-secondary font-poppins-bold">
                      Parameters
                    </Text>
                    <Text className="text-sm text-muted font-poppins-medium">
                      Live metrics for water quality.
                    </Text>
                  </View>
                )}
                icon={() => <Image source={icons.setting} className="size-8" />}
                onPress={() => router.push("/parameters")}
              />
            </DrawerContentScrollView>
            <SafeAreaView edges={["bottom"]}>
              <View className="items-center justify-center mt-auto px-6 pb-6">
                <PressableScale
                  onPress={() => {
                    {
                      /** replace later to disconnect from IoT device */
                    }
                    router.replace(
                      "/onboarding",
                    ); /** replace later to route to connection */
                  }}
                >
                  <Text className="bg-primary rounded-bg shadow-md shadow-slate-400/30 text-lg text-white font-poppins-medium py-3 px-12 ">
                    Disconnect
                  </Text>
                </PressableScale>
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
              ...(route.name === "graphs" || route.name === "parameters"
                ? { swipeEnabled: false }
                : {}),
              drawerLabel: () => (
                <View className="flex-1">
                  <Text className="text-lg text-secondary font-poppins-bold">
                    {route.title}
                  </Text>
                  <Text className="text-sm text-muted font-poppins-medium">
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
