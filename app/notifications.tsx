import AlertCard from "@/components/AlertCard";
import PressableScale from "@/components/PressableScale";
import { ErrorState, LoadingState } from "@/components/StateDisplay";
import { useDevice } from "@/contexts/DeviceContext";
import { useNotifications } from "@/hooks/useNotifications";
import { acknowledgeNotification } from "@/services/firebase/notifications";
import { Redirect } from "expo-router";
import { styled } from "nativewind";
import { useState } from "react";
import {
  FlatList,
  LayoutAnimation,
  Platform,
  Text,
  UIManager,
  View,
} from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";
import dayjs from "dayjs";

const SafeAreaView = styled(RNSafeAreaView);

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const filterIds = ["all", "critical", "warning"] as const;
type FilterId = (typeof filterIds)[number];

const filterConfig: Record<
  FilterId,
  { label: string; color: "primary" | "danger" | "warning" }
> = {
  all: { label: "ALL", color: "primary" },
  critical: { label: "CRITICAL", color: "danger" },
  warning: { label: "WARNING", color: "warning" },
};

const activeBgClass = {
  primary: "bg-primary",
  danger: "bg-danger",
  warning: "bg-warning",
} as const;
const inactiveTextClass = {
  primary: "text-primary",
  danger: "text-danger",
  warning: "text-warning",
} as const;
const inactiveBorderClass = {
  primary: "border-2 border-primary",
  danger: "border-2 border-danger",
  warning: "border-2 border-warning",
} as const;

const Notifications = () => {
  const { selectedDevice } = useDevice();
  const { data: notifications, isLoading, error, lastUpdated } = useNotifications();
  const [activeFilter, setActiveFilter] = useState<FilterId>("all");

  const handleFilterChange = (id: FilterId) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveFilter(id);
  };

  if (!selectedDevice) return <Redirect href="/onboarding" />;
  if (error) return <ErrorState message={error.message} />;
  if (isLoading) return <LoadingState />;
  if (notifications.length === 0)
    return <ErrorState title="No data available." />;

  const filtered =
    activeFilter === "all"
      ? notifications
      : notifications.filter((n) => n.type === activeFilter);

  return (
    <SafeAreaView edges={["bottom"]} className="flex-1 bg-primary">
      {lastUpdated ? (
        <View className="bg-primary flex-row items-center justify-center py-2 px-4">
          <Text className="text-sm text-white font-poppins-regular">
            Last updated: {dayjs(lastUpdated).format("h:mm A")}
          </Text>
        </View>
      ) : null}
      <View className="bg-background rounded-t-xl px-4 pt-6 pb-2">
        <View className="w-full max-w-xl flex-row mx-auto gap-x-2">
          {filterIds.map((id) => {
            const isActive = activeFilter === id;
            const { color, label } = filterConfig[id];
            return (
              <PressableScale
                key={id}
                onPress={() => handleFilterChange(id)}
                style={{ flex: 1 }}
              >
                <Text
                  className={`text-lg text-center font-poppins-semibold rounded-bg px-4 py-1 ${
                    isActive
                      ? `${activeBgClass[color]} text-white`
                      : `${inactiveTextClass[color]} ${inactiveBorderClass[color]}`
                  }`}
                >
                  {label}
                </Text>
              </PressableScale>
            );
          })}
        </View>
      </View>

      <View className="flex-1 bg-background">
        <FlatList
          className="flex-1"
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerClassName="w-full max-w-xl mx-auto p-6 gap-y-6"
          renderItem={({ item }) => (
            <Animated.View
              entering={FadeIn.duration(600)}
              exiting={FadeOut.duration(200)}
            >
              <AlertCard
                type={item.type}
                title={item.title}
                date={item.date}
                read={item.read}
                onAcknowledge={() =>
                  acknowledgeNotification(selectedDevice.id, item.id)
                }
              />
            </Animated.View>
          )}
        />
      </View>
    </SafeAreaView>
  );
};

export default Notifications;
