import PressableScale from "@/components/PressableScale";
import { DrawerRoutes } from "@/constants/drawer";
import { icons } from "@/constants/icons";
import { colors, fonts, fontSizes } from "@/constants/theme";
import { useDevice } from "@/contexts/DeviceContext";
import { useNotifications } from "@/hooks/useNotifications";
import { DrawerItem, DrawerItemList } from "@react-navigation/drawer";
import { router } from "expo-router";
import { Drawer } from "expo-router/drawer";
import { styled } from "nativewind";
import { Image, ScrollView, Text, View } from "react-native";
import {
  SafeAreaView as RNSafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

const SafeAreaView = styled(RNSafeAreaView);

export default function RootLayout() {
  const insets = useSafeAreaInsets();
  const notifications = useNotifications();
  const { selectDevice } = useDevice();

  return (
    <Drawer
      screenOptions={{
        drawerActiveTintColor: colors.tertiary,
        drawerStyle: { width: 360 },
        drawerItemStyle: { marginVertical: 4 },
        headerStyle: { backgroundColor: colors.primary },
        headerTitleStyle: { fontFamily: fonts.bold, fontSize: fontSizes.large },
        headerTintColor: colors.white,
        headerShadowVisible: false,
        headerRight: () => (
          <PressableScale
            onPress={() => {
              router.push("/notifications");
            }}
            style={{ borderRadius: 20, marginRight: 8, padding: 8 }}
            pressedStyle={{ backgroundColor: colors.pressed }}
            accessibilityLabel="Notifications"
            accessibilityRole="button"
            hitSlop={2}
          >
            <View className="relative">
              <Image source={icons.alert} style={{ width: 24, height: 24 }} />
              {notifications.length > 0 && (
                <View className="absolute -top-1 -right-1 bg-danger rounded-full w-5 h-5 items-center justify-center">
                  <Text className="text-sm text-white font-poppins-bold">
                    {notifications.length}
                  </Text>
                </View>
              )}
            </View>
          </PressableScale>
        ),
      }}
      drawerContent={(props) => (
        <View className="flex-1 bg-background">
          <View
            className="bg-primary px-4"
            style={{ paddingTop: insets.top + 16, paddingBottom: 32 }}
          >
            <View className="flex-row items-center">
              <Image source={icons.logo} style={{ width: 122, height: 122 }} />
              <View className="flex-1">
                <Text className="text-xl text-white font-poppins-bold">
                  AmmoSense
                </Text>
                <Text className="text-md text-white font-poppins-medium">
                  Predictive Water Quality Monitoring
                </Text>
              </View>
            </View>
          </View>
          <ScrollView className="flex-1 px-4 py-1">
            <DrawerItemList {...props} />
            <DrawerItem
              style={{ marginVertical: 4 }}
              label={() => (
                <View className="flex-1">
                  <Text className="text-lg text-secondary font-poppins-bold">
                    Parameters
                  </Text>
                  <Text className="text-md text-muted font-poppins-medium">
                    Real-time metrics for water quality parameters.
                  </Text>
                </View>
              )}
              icon={() => (
                <Image
                  source={icons.setting}
                  style={{ width: 32, height: 32 }}
                />
              )}
              onPress={() => router.push("/parameters")}
            />
            <DrawerItem
              style={{ marginVertical: 4 }}
              label={() => (
                <View className="flex-1">
                  <Text className="text-lg text-secondary font-poppins-bold">
                    Notifications
                  </Text>
                  <Text className="text-md text-muted font-poppins-medium">
                    Instant notifications for critical ammonia risks.
                  </Text>
                </View>
              )}
              icon={() => (
                <Image source={icons.bell} style={{ width: 32, height: 32 }} />
              )}
              onPress={() => router.push("/notifications")}
            />
          </ScrollView>
          <SafeAreaView edges={["bottom"]}>
            <View className="items-center p-8">
              <PressableScale
                onPress={() => {
                  selectDevice(null);
                  router.replace(
                    "/onboarding",
                  ); /** replace later to disconnect from IoT device and route to connection */
                }}
              >
                <Text className="text-lg text-white font-poppins-medium bg-primary rounded-bg shadow-md shadow-slate-400/30 px-12 py-4">
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
            title: route.label,
            ...(route.name === "graphs" ? { swipeEnabled: false } : {}),
            drawerLabel: () => (
              <View className="flex-1">
                <Text className="text-lg text-secondary font-poppins-bold">
                  {route.title}
                </Text>
                <Text className="text-md text-muted font-poppins-medium">
                  {route.description}
                </Text>
              </View>
            ),
            drawerIcon: () => (
              <Image source={route.icon} style={{ width: 32, height: 32 }} />
            ),
          }}
        />
      ))}
    </Drawer>
  );
}
