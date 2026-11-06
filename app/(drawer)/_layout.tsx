import PressableScale from "@/components/PressableScale";
import { DrawerRoutes } from "@/constants/drawer";
import { icons } from "@/constants/icons";
import { colors } from "@/constants/theme";
import { useDevice } from "@/contexts/DeviceContext";
import { useNotifs } from "@/hooks/useNotifs";
import { Redirect, router } from "expo-router";
import { Drawer } from "expo-router/drawer";
import { styled } from "nativewind";
import { useRef } from "react";
import { Image, ScrollView, Text, View } from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

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
      backgroundColor: `${focused ? colors.tertiary_light : "transparent"}`,
    }}
    swipeGuard={10}
  >
    <Image
      source={icon}
      style={{ width: 32, height: 32, tintColor: colors.primary }}
    />
    <View className="flex-1">
      <Text
        className={`${focused ? "text-primary" : "text-secondary"} text-lg font-poppins-bold`}
      >
        {title}
      </Text>
      <Text className="text-md text-muted font-poppins-medium">
        {description}
      </Text>
    </View>
  </PressableScale>
);

const DrawerLayout = () => {
  const { selectedDevice, selectDevice, isHydrated } = useDevice();
  const { data: notifications } = useNotifs();
  const lastNav = useRef(0);

  if (!isHydrated) return null;
  if (!selectedDevice) return <Redirect href="/onboarding" />;

  return (
    <Drawer
      screenOptions={{
        headerStyle: { backgroundColor: colors.primary },
        headerTitle: ({ children }) => (
          <Text className="text-lg text-white font-poppins-bold">
            {children}
          </Text>
        ),
        headerTintColor: colors.white,
        headerShadowVisible: false,
        headerRight: () => (
          /** header notification button */
          <PressableScale
            onPress={() => router.navigate("/notifs")}
            style={{ borderRadius: 20, padding: 8, marginHorizontal: 8 }}
            pressedStyle={{ backgroundColor: colors.pressed }}
            accessibilityRole="button"
            accessibilityLabel="Notifications"
            hitSlop={2}
          >
            <View>
              <Image
                source={icons.alert}
                style={{ width: 24, height: 24, tintColor: colors.white }}
              />
              {(() => {
                const unread = notifications.filter(
                  (notif) => notif.read !== true,
                ).length;
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
        const COOLDOWN_WINDOW = 300;
        const handleDrawerNav = (route: "index" | "graphs" | "weather") => {
          const now = Date.now();
          if (now - lastNav.current < COOLDOWN_WINDOW) return;
          lastNav.current = now;
          props.navigation.closeDrawer();
          setTimeout(() => {
            props.navigation.navigate(route as any);
          }, 50);
        };

        const handleStackNav = (
          path: "/parameters" | "/notifications" | "/notifs",
        ) => {
          const now = Date.now();
          if (now - lastNav.current < COOLDOWN_WINDOW) return;
          lastNav.current = now;
          props.navigation.closeDrawer();
          setTimeout(() => router.navigate(path), 50);
        };

        return (
          <SafeAreaView className="flex-1 bg-primary">
            <View className="py-8">
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
            <ScrollView className="flex-1 bg-background px-4 py-2">
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

              {/** previous notification drawer item */}
              <DrawerRow
                title="Notifications (old)"
                description="Instant notifications for critical ammonia risks."
                icon={icons.bell}
                focused={false}
                onPress={() => handleStackNav("/notifications")}
              />

              <DrawerRow
                title="Notifications (new)"
                description="Instant notifications for critical ammonia risks."
                icon={icons.bell}
                focused={false}
                onPress={() => handleStackNav("/notifs")}
              />
            </ScrollView>
            <View className="bg-background items-center py-4">
              <PressableScale
                onPress={() => {
                  selectDevice(null);
                  router.replace("/onboarding");
                }}
              >
                <Text className="text-lg text-white text-center font-poppins-medium bg-primary rounded-lg shadow-md shadow-slate-400/30 px-12 py-4">
                  Disconnect
                </Text>
              </PressableScale>
            </View>
            <View>
              <View></View>
            </View>
          </SafeAreaView>
        );
      }}
    >
      {DrawerRoutes.map((route) => (
        <Drawer.Screen
          key={route.name}
          name={route.name}
          options={{
            title: route.label,
            swipeEnabled: false,
          }}
        />
      ))}
    </Drawer>
  );
};

export default DrawerLayout;
