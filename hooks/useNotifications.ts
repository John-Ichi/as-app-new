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
    if (!selectedDevice) {
      setNotifications([]);
      setError(null);
      setIsLoading(false);
      return;
    }
    let cancelled = false;
    setNotifications([]);
    setIsLoading(true);
    setError(null);
    getNotifications(selectedDevice.id)
      .then((result) => { if (!cancelled) setNotifications(result); })
      .catch((err) => { if (!cancelled) setError(err); })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [selectedDevice]);

  return { data: notifications, isLoading, error };
}
