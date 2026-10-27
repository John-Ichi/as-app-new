import PressableScale from "@/components/PressableScale";
import { DrawerRoutes } from "@/constants/drawer";
import { icons } from "@/constants/icons";
import { colors, fonts, fontSizes } from "@/constants/theme";
import { useDevice } from "@/contexts/DeviceContext";
import { useNotifications } from "@/hooks/useNotifications";
import { Redirect, router } from "expo-router";
import { Drawer } from "expo-router/drawer";
import { styled } from "nativewind";
import { useRef } from "react";
import { Image, ScrollView, Text, View } from "react-native";
import {
  SafeAreaView as RNSafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

const SafeAreaView = styled(RNSafeAreaView);

interface DrawerRowProps {
  title: string;
  description: string;
  icon: any;
  focused: boolean;
  onPress: () => void;
}

const DrawerRow = ({
  title,
  description,
  icon,
  focused,
  onPress,
}: DrawerRowProps) => (
  <PressableScale
    swipeGuard={10}
    onPress={onPress}
    accessibilityRole="button"
    accessibilityLabel={title}
    style={{
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      marginVertical: 4,
      padding: 12,
      borderRadius: 64,
      backgroundColor: focused ? "rgba(11, 61, 89, 0.08)" : "transparent",
    }}
  >
    <Image
      source={icon}
      style={{ width: 32, height: 32, tintColor: colors.primary }}
    />
    <View className="flex-1">
      <Text
        className={`text-lg font-poppins-bold ${focused ? "text-primary" : "text-secondary"}`}
      >
        {title}
      </Text>
      <Text className="text-md text-muted font-poppins-medium">
        {description}
      </Text>
    </View>
  </PressableScale>
);

export default function DrawerLayout() {
  const { selectedDevice, selectDevice, isHydrated } = useDevice();
  const insets = useSafeAreaInsets();
  const { data: notifications } = useNotifications();
  const lastNav = useRef(0);

  if (!isHydrated) return null;
  if (!selectedDevice) return <Redirect href="/onboarding" />;

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
            onPress={() => router.navigate("/notifications")}
            style={{ borderRadius: 20, marginRight: 8, padding: 8 }}
            pressedStyle={{ backgroundColor: colors.pressed }}
            accessibilityLabel="Notifications"
            accessibilityRole="button"
            hitSlop={2}
          >
            <View className="relative">
              <Image
                source={icons.alert}
                style={{ width: 24, height: 24, tintColor: colors.white }}
              />
              {(() => {
                const unread = notifications.filter((n) => !n.read).length;
                if (unread === 0) return null;
                return (
                  <View className="absolute -top-1 -right-1 bg-danger rounded-full w-5 h-5 items-center justify-center">
                    <Text className="text-xs text-white font-poppins-bold">
                      {unread > 99 ? "99+" : unread}
                    </Text>
                  </View>
                );
              })()}
            </View>
          </PressableScale>
        ),
      }}
      drawerContent={(props) => {
        const handleDrawerNav = (route: "index" | "graphs") => {
          const now = Date.now();
          if (now - lastNav.current < 300) return;
          lastNav.current = now;
          props.navigation.closeDrawer();
          setTimeout(() => {
            props.navigation.navigate(route as any);
          }, 50);
        };

        const handleStackNav = (path: "/parameters" | "/notifications") => {
          const now = Date.now();
          if (now - lastNav.current < 300) return;
          lastNav.current = now;
          props.navigation.closeDrawer();
          setTimeout(() => router.navigate(path), 50);
        };

        return (
          <View className="flex-1 bg-background">
            <View
              className="bg-primary px-4"
              style={{ paddingTop: insets.top + 16, paddingBottom: 32 }}
            >
              <View className="flex-row items-center">
                <Image
                  source={icons.logo}
                  style={{ width: 122, height: 122 }}
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
            </View>
            <ScrollView className="flex-1 px-4 py-1">
              {DrawerRoutes.map((route) => (
                <DrawerRow
                  key={route.name}
                  title={route.title}
                  description={route.description}
                  icon={route.icon}
                  focused={
                    props.state.routes[props.state.index].name === route.name
                  }
                  onPress={() =>
                    handleDrawerNav(route.name as "index" | "graphs")
                  }
                />
              ))}
              <DrawerRow
                title="Parameters"
                description="Real-time metrics for water quality parameters."
                icon={icons.setting}
                focused={false}
                onPress={() => handleStackNav("/parameters")}
              />
              <DrawerRow
                title="Notifications"
                description="Instant notifications for critical ammonia risks."
                icon={icons.bell}
                focused={false}
                onPress={() => handleStackNav("/notifications")}
              />
            </ScrollView>
            <SafeAreaView edges={["bottom"]}>
              <View className="items-center p-8">
                <PressableScale
                  onPress={() => {
                    selectDevice(null);
                    router.replace("/onboarding");
                  }}
                >
                  <Text className="text-lg text-white font-poppins-medium bg-primary rounded-bg shadow-md shadow-slate-400/30 px-12 py-4">
                    Disconnect
                  </Text>
                </PressableScale>
              </View>
            </SafeAreaView>
          </View>
        );
      }}
    >
      {DrawerRoutes.map((route) => (
        <Drawer.Screen
          key={route.name}
          name={route.name}
          options={{
            title: route.label,
            ...(route.name === "graphs" ? { swipeEnabled: false } : {}),
          }}
        />
      ))}
    </Drawer>
  );
}
