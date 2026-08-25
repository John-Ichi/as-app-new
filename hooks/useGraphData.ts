import { useDevice } from "@/contexts/DeviceContext";
import { getGraphData, subscribeOneDay } from "@/services/firebase/graphs";
import type { ParameterGraphData } from "@/services/types";
import { useEffect, useState } from "react";

export function useGraphData(): {
  data: ParameterGraphData[];
  isLoading: boolean;
  error: Error | null;
} {
  const { selectedDevice } = useDevice();
  const [data, setData] = useState<ParameterGraphData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!selectedDevice) {
      setData([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setData([]);
    setIsLoading(true);
    setError(null);

    let sevenDayCache: ParameterGraphData[] | null = null;
    let oneDayBuckets: Record<string, import("@/services/types").GraphDataPoint[]> | null = null;

    const tryEmit = () => {
      if (cancelled || !sevenDayCache || !oneDayBuckets) return;
      const merged = sevenDayCache.map((p) => ({
        ...p,
        oneDay: oneDayBuckets![p.id as string] ?? [],
      }));
      setData(merged as ParameterGraphData[]);
      setIsLoading(false);
    };

    getGraphData(selectedDevice.id)
      .then((initial) => {
        if (cancelled) return;
        sevenDayCache = initial;
        tryEmit();
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err);
          setIsLoading(false);
        }
      });

    const unsubscribeOneDay = subscribeOneDay(
      selectedDevice.id,
      (buckets) => {
        if (cancelled) return;
        oneDayBuckets = buckets as Record<string, import("@/services/types").GraphDataPoint[]>;
        setError(null);
        tryEmit();
      },
      (err) => {
        if (!cancelled) setError(err);
      },
    );

    // keep sevenDay fresh via low-frequency poll (hourly) - 24h is already live
    const sevenDayInterval = setInterval(() => {
      if (cancelled) return;
      getGraphData(selectedDevice.id)
        .then((result) => {
          if (cancelled) return;
          sevenDayCache = result;
          tryEmit();
        })
        .catch((err) => {
          if (!cancelled) setError(err);
        });
    }, 60 * 60 * 1000);

    return () => {
      cancelled = true;
      unsubscribeOneDay();
      clearInterval(sevenDayInterval);
    };
  }, [selectedDevice]);

  return { data, isLoading, error };
}
