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

    let disposed = false;
    const storedRef: { current: ReturnType<typeof ref> | null } = {
      current: null,
    };

    async function register() {
      try {
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

        const token = (
          await Notifications.getExpoPushTokenAsync({ projectId })
        ).data;

        if (disposed) return;

        const tokenRef = ref(
          db,
          `devices/${selectedDevice.id}/pushTokens/${sanitizeToken(token)}`,
        );
        storedRef.current = tokenRef;
        await set(tokenRef, true);

        if (disposed) {
          set(tokenRef, null);
          storedRef.current = null;
          return;
        }

        if (Platform.OS === "android") {
          await Notifications.setNotificationChannelAsync("alerts", {
            name: "Alert Notifications",
            importance: Notifications.AndroidImportance.HIGH,
            vibrationPattern: [0, 250, 250, 250],
          });
        }
      } catch (error) {
        console.error("Failed to register push token:", error);
      }
    }

    register();

    return () => {
      disposed = true;
      if (storedRef.current) {
        set(storedRef.current, null);
      }
    };
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
