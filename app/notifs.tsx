import NotifCard from "@/components/NotifCard";
import PressableScale from "@/components/PressableScale";
import { ErrorState, LoadingState } from "@/components/StateDisplay";
import { colors } from "@/constants/theme";
import { useDevice } from "@/contexts/DeviceContext";
import { useNotifs } from "@/hooks/useNotifs";
import {
  acknowledgeNotifications,
  deleteNotification,
  setNotificationRead,
} from "@/services/firebase/notifications";
import dayjs from "dayjs";
import { Redirect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const actions = ["all", "unread", "delete"] as const;
type ActionId = (typeof actions)[number];
const actionLabels: Record<ActionId, string> = {
  all: "All",
  unread: "Unread",
  delete: "Delete",
};

const Notifs = () => {
  const { selectedDevice } = useDevice();
  const { data: items, isLoading, error, lastUpdated } = useNotifs();

  const counts: Record<"all" | "unread", number> = {
    all: items.length,
    unread: items.filter((notif) => notif.read !== true).length,
  };

  const handleToggleRead = useCallback(
    async (id: string, read: boolean) => {
      if (!selectedDevice) return;
      try {
        await setNotificationRead(selectedDevice.id, id, read);
      } catch (e) {
        console.error("Failed to update notification: ", e);
      }
    },
    [selectedDevice],
  );

  const [filter, setFilter] = useState<"all" | "unread">("all");
  const visible =
    filter === "unread"
      ? items.filter((notifs) => notifs.read !== true)
      : items;

  const [acknowledgeAll, setAcknowledgeAll] = useState(false);
  const unreadVisible = visible.filter((notif) => notif.read !== true);
  const handleAcknowledgeAll = useCallback(async () => {
    if (!selectedDevice || unreadVisible.length === 0) return;
    setAcknowledgeAll(true);
    try {
      await acknowledgeNotifications(
        selectedDevice.id,
        unreadVisible.map((notif) => notif.id),
      );
    } catch (e) {
      console.error("Failed to acknowledge all: ", e);
    } finally {
      setAcknowledgeAll(false);
    }
  }, [selectedDevice, unreadVisible]);

  const [deleting, setDeleting] = useState(false);
  const handleDelete = useCallback(() => {
    setDeleting((prev) => !prev);
  }, []);
  const handleDeleteOne = useCallback(
    (id: string) => {
      const deleteNotif = async () => {
        if (!selectedDevice) return;
        try {
          await deleteNotification(selectedDevice.id, id);
        } catch (e) {
          console.error("Failed to delete notification: ", e);
        }
      };
      if (Platform.OS === "web") {
        if (window.confirm("Delete notification?\nThis cannot be undone"))
          deleteNotif();
        return;
      }
      Alert.alert("Delete notification?", "This cannot be undone", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: deleteNotif,
        },
      ]);
    },
    [selectedDevice],
  );

  const actionFunctions: Record<ActionId, () => void> = {
    all: () => setFilter("all"),
    unread: () => setFilter("unread"),
    delete: handleDelete,
  };

  if (!selectedDevice) return <Redirect href="/onboarding" />;
  if (error) return <ErrorState error={error} />;
  if (isLoading) return <LoadingState />;

  return (
    <SafeAreaView
      edges={["bottom"]}
      style={{ flex: 1, backgroundColor: colors.primary }}
    >
      <View className="py-2">
        {lastUpdated ? (
          <Text className="text-sm text-center text-white font-poppins-light">
            Last Updated: {dayjs(lastUpdated).format("h:mm A")}
          </Text>
        ) : null}
      </View>
      <View className="w-full max-w-xl mx-auto flex-1 bg-background rounded-t-xl p-4">
        <View className="flex-row pb-4 gap-x-2">
          {actions.map((action) => {
            const isActive = filter === action;
            const locked = deleting && action !== "delete";
            return (
              <PressableScale
                key={action}
                onPress={() => actionFunctions[action]()}
                disabled={locked}
                style={{
                  flex: 1,
                  opacity: deleting && action !== "delete" ? 0.7 : 1,
                }}
              >
                <Text
                  className={`${isActive ? "bg-background text-primary" : "bg-primary text-white"} text-md text-center font-poppins-semibold border-2 border-primary rounded-xl p-2`}
                >
                  {deleting && action === "delete"
                    ? "Cancel"
                    : action !== "delete"
                      ? `${actionLabels[action]} (${counts[action]})`
                      : actionLabels[action]}
                </Text>
              </PressableScale>
            );
          })}
        </View>
        <View className="flex-row justify-end pb-2">
          <PressableScale
            onPress={handleAcknowledgeAll}
            accessibilityRole="button"
            accessibilityLabel="Mark all visible notifications as read"
            style={{ borderRadius: 20, paddingHorizontal: 8 }}
            pressedStyle={{ backgroundColor: colors.pressed }}
          >
            {acknowledgeAll ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Text className="text-md text-muted font-poppins-light">
                Mark all as read
              </Text>
            )}
          </PressableScale>
        </View>
        <FlatList
          data={visible}
          keyExtractor={(item) => item.id}
          contentContainerClassName="flex-grow gap-y-4"
          renderItem={({ item }) => (
            <NotifCard
              id={item.id}
              date={item.date}
              title={item.title}
              value={item.value}
              read={item.read}
              onToggleRead={handleToggleRead}
              deleting={deleting}
              onDelete={handleDeleteOne}
            />
          )}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center">
              <Text className="text-lg text-muted font-poppins-light">
                {filter === "unread"
                  ? "No unread notifications"
                  : "No notifications"}
              </Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
};

export default Notifs;
