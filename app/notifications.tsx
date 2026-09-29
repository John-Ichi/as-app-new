import AlertCard from "@/components/AlertCard";
import PressableScale from "@/components/PressableScale";
import { ErrorState, LoadingState } from "@/components/StateDisplay";
import { colors } from "@/constants/theme";
import { useDevice } from "@/contexts/DeviceContext";
import { useNotifications } from "@/hooks/useNotifications";
import {
  acknowledgeNotification,
  acknowledgeNotifications,
} from "@/services/firebase/notifications";
import type { AppNotification } from "@/services/types";
import dayjs from "dayjs";
import { Redirect } from "expo-router";
import { styled } from "nativewind";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  LayoutAnimation,
  Platform,
  Text,
  UIManager,
  View,
} from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

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
const tabBorderClass = {
  primary: "border-2 border-primary",
  danger: "border-2 border-danger",
  warning: "border-2 border-warning",
} as const;

const Notifications = () => {
  const { selectedDevice } = useDevice();
  const {
    data: notifications,
    isLoading,
    error,
    lastUpdated,
  } = useNotifications();
  const [activeFilter, setActiveFilter] = useState<FilterId>("all");
  const [ackAllBusy, setAckAllBusy] = useState(false);

  const handleAckItem = useCallback(
    (id: string) => acknowledgeNotification(selectedDevice?.id ?? "", id),
    [selectedDevice?.id],
  );

  const handleFilterChange = (id: FilterId) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveFilter(id);
  };

  const renderItem = useCallback(
    ({ item }: { item: AppNotification }) => (
      <Animated.View
        entering={FadeIn.duration(600)}
        exiting={FadeOut.duration(200)}
      >
        <AlertCard
          type={item.type}
          alertId={item.id}
          title={item.title}
          date={item.date}
          read={item.read}
          onAcknowledge={handleAckItem}
        />
      </Animated.View>
    ),
    [handleAckItem],
  );

  if (!selectedDevice) return <Redirect href="/onboarding" />;
  if (error) return <ErrorState message={error.message} />;
  if (isLoading) return <LoadingState />;
  /**
  if (notifications.length === 0)
    return <ErrorState title="No data available." />;
  */

  const filtered =
    activeFilter === "all"
      ? notifications
      : notifications.filter((n) => n.type === activeFilter);

  const unreadInFilter = filtered.filter((n) => !n.read);

  const unreadCounts: Record<FilterId, number> = {
    all: notifications.filter((n) => !n.read).length,
    critical: notifications.filter((n) => !n.read && n.type === "critical")
      .length,
    warning: notifications.filter((n) => !n.read && n.type === "warning")
      .length,
  };

  const handleAcknowledgeAll = async () => {
    if (ackAllBusy || unreadInFilter.length === 0) return;
    setAckAllBusy(true);
    try {
      await acknowledgeNotifications(
        selectedDevice.id,
        unreadInFilter.map((n) => n.id),
      );
    } catch (e) {
      console.error("Failed to acknowledge all:", e);
    } finally {
      setAckAllBusy(false);
    }
  };

  return (
    <SafeAreaView edges={["bottom"]} className="flex-1 bg-primary">
      <View className="bg-primary flex-row items-center justify-between py-2 px-4">
        {lastUpdated ? (
          <Text className="text-sm text-white font-poppins-regular">
            Last updated: {dayjs(lastUpdated).format("h:mm A")}
          </Text>
        ) : (
          <View />
        )}
        <PressableScale
          disabled={ackAllBusy}
          onPress={handleAcknowledgeAll}
          accessibilityRole="button"
          accessibilityLabel="Acknowledge all alerts in current section"
        >
          <View className="flex-row items-center gap-x-1.5">
            {ackAllBusy ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : null}
            <Text
              className={`text-xs text-center text-white font-poppins-semibold px-2 py-1 rounded-md bg-white/10 ${
                ackAllBusy ? "opacity-70" : ""
              }`}
            >
              {ackAllBusy ? "ACKNOWLEDGING…" : "ACKNOWLEDGE ALL"}
            </Text>
          </View>
        </PressableScale>
      </View>
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
                  className={`text-md text-center font-poppins-semibold rounded-bg p-2 ${tabBorderClass[color]} ${
                    isActive
                      ? `${activeBgClass[color]} text-white`
                      : inactiveTextClass[color]
                  }`}
                >
                  {`${label} (${unreadCounts[id]})`}
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
          windowSize={5}
          maxToRenderPerBatch={10}
          renderItem={renderItem}
          ListEmptyComponent={() => (
            <View className="flex-1 items-center justify-center py-12">
              <Text className="text-lg text-muted font-poppins-semibold">
                No alerts found
              </Text>
            </View>
          )}
        />
      </View>
    </SafeAreaView>
  );
};

export default Notifications;
