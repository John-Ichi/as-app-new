import { useDevice } from "@/contexts/DeviceContext";
import { subscribeNotifications } from "@/services/firebase/notifications";
import { AppNotification } from "@/services/types";
import { useEffect, useState } from "react";

export function useNotifications(): {
  data: AppNotification[];
  isLoading: boolean;
  error: Error | null;
} {
  const { selectedDevice } = useDevice();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!selectedDevice) {
      setNotifications([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const unsubscribe = subscribeNotifications(
      selectedDevice.id,
      (data) => {
        setNotifications(data);
        setIsLoading(false);
      },
      (err) => {
        setError(err);
        setIsLoading(false);
      },
    );

    return unsubscribe;
  }, [selectedDevice]);

  return { data: notifications, isLoading, error };
}
