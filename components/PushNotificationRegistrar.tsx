import { usePushNotifications } from "@/hooks/usePushNotifications";

export function PushNotificationRegistrar() {
  usePushNotifications();
  return null;
}
