import { useDevice } from "@/contexts/DeviceContext";
import { getNotifications } from "@/services/firebase/notifications";
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
    if (!selectedDevice) return;
    setIsLoading(true);
    setError(null);
    getNotifications(selectedDevice.id)
      .then(setNotifications)
      .catch(setError)
      .finally(() => setIsLoading(false));
  }, [selectedDevice]);

  return { data: notifications, isLoading, error };
}
