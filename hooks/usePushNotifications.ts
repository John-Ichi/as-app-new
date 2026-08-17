import { useEffect } from "react";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { ref, set } from "firebase/database";
import { db } from "@/firebase/config";
import { useDevice } from "@/contexts/DeviceContext";
import { router } from "expo-router";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export function usePushNotifications() {
  const { selectedDevice } = useDevice();

  // Register for push notifications
  useEffect(() => {
    if (!selectedDevice || !Device.isDevice) return;

    async function register() {
      const { status } = await Notifications.getPermissionsAsync();
      let finalStatus = status;

      if (status !== "granted") {
        const { status: requested } = await Notifications.requestPermissionsAsync();
        finalStatus = requested;
      }

      if (finalStatus !== "granted") return;

      const projectId =
        Constants?.expoConfig?.extra?.eas?.projectId ??
        Constants?.easConfig?.projectId;

      if (!projectId) return;

      const token = (
        await Notifications.getExpoPushTokenAsync({ projectId })
      ).data;

      const tokenRef = ref(
        db,
        `devices/${selectedDevice.id}/pushTokens/${token}`,
      );
      await set(tokenRef, true);

      if (Device.OS === "android") {
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
    const sub = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log("Foreground notification:", notification);
      },
    );
    return () => sub.remove();
  }, []);

  // Handle notification taps
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const url = response.notification.request.content.data?.url;
        if (typeof url === "string") {
          router.push(url);
        }
      },
    );
    return () => sub.remove();
  }, []);
}
