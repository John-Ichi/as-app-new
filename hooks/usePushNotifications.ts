import { useDevice } from "@/contexts/DeviceContext";
import { db } from "@/firebase/config";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import { ref, set } from "firebase/database";
import { useEffect } from "react";
import { Platform } from "react-native";

if (Platform.OS !== "web") {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

function sanitizeToken(token: string): string {
  return token.replace(/\[/g, "_lb_").replace(/\]/g, "_rb_");
}

export function usePushNotifications() {
  const { selectedDevice } = useDevice();

  // Register for push notifications
  useEffect(() => {
    if (!selectedDevice || !Device.isDevice || Platform.OS === "web") return;

    async function register() {
      if (!selectedDevice) return;

      const { status } = await Notifications.getPermissionsAsync();
      let finalStatus = status;

      if (status !== "granted") {
        const { status: requested } =
          await Notifications.requestPermissionsAsync();
        finalStatus = requested;
      }

      if (finalStatus !== "granted") return;

      const projectId =
        Constants?.expoConfig?.extra?.eas?.projectId ??
        Constants?.easConfig?.projectId;

      if (!projectId) return;

      const token = (await Notifications.getExpoPushTokenAsync({ projectId }))
        .data;

      const tokenRef = ref(
        db,
        `devices/${selectedDevice.id}/pushTokens/${sanitizeToken(token)}`,
      );
      await set(tokenRef, true);

      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("alerts", {
          name: "Alert Notifications",
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
        });
      }
    }

    register();
  }, [selectedDevice]);

  // Listen for foreground notifications
  useEffect(() => {
    if (Platform.OS === "web") return;

    const sub = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log("Foreground notification:", notification);
      },
    );
    return () => sub.remove();
  }, []);

  // Handle notification taps
  useEffect(() => {
    if (Platform.OS === "web") return;

    const response = Notifications.getLastNotificationResponse();
    if (response) {
      const url = response.notification.request.content.data?.url;
      if (typeof url === "string") {
        router.push(url as any);
      }
      Notifications.clearLastNotificationResponse();
    }

    const sub = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const url = response.notification.request.content.data?.url;
        if (typeof url === "string") {
          router.push(url as any);
        }
      },
    );
    return () => sub.remove();
  }, []);
}
