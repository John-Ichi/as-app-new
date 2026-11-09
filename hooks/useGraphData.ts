import { useDevice } from "@/contexts/DeviceContext";
import { getGraphData, subscribeOneDay } from "@/services/firebase/graphs";
import type { GraphDataPoint, ParameterGraphData } from "@/services/types";
import { useEffect, useState } from "react";

export function useGraphData(): {
  data: ParameterGraphData[];
  isLoading: boolean;
  isRefreshing: boolean;
  lastUpdated: number | null;
  error: Error | null;
} {
  const { selectedDevice } = useDevice();
  const [data, setData] = useState<ParameterGraphData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!selectedDevice) {
      setData([]);
      setError(null);
      setLastUpdated(null);
      setIsLoading(false);
      setIsRefreshing(false);
      return;
    }

    let cancelled = false;
    setData([]);
    setIsLoading(true);
    setIsRefreshing(false);
    setLastUpdated(null);
    setError(null);

    let historicalCache: ParameterGraphData[] | null = null;
    let liveDayBuckets: Record<string, GraphDataPoint[]> | null = null;

    const tryEmit = () => {
      if (cancelled || !historicalCache || !liveDayBuckets) return;
      const merged = historicalCache.map((p) => ({
        ...p,
        oneDay: liveDayBuckets![p.id as string] ?? [],
      }));
      setData(merged as ParameterGraphData[]);
      setIsLoading(false);
    };

    getGraphData(selectedDevice.id)
      .then((initial) => {
        if (cancelled) return;
        historicalCache = initial;
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
      (buckets, latestTs) => {
        if (cancelled) return;
        liveDayBuckets = buckets as Record<string, GraphDataPoint[]>;
        setLastUpdated(latestTs);
        setError(null);
        tryEmit();
      },
      (err) => {
        if (!cancelled) setError(err);
      },
    );

    const historicalInterval = setInterval(
      () => {
        if (cancelled) return;
        setIsRefreshing(true);
        getGraphData(selectedDevice.id)
          .then((result) => {
            if (cancelled) return;
            historicalCache = result;
            tryEmit();
          })
          .catch((err) => {
            if (!cancelled) setError(err);
          })
          .finally(() => {
            if (!cancelled) setIsRefreshing(false);
          });
      },
      60 * 60 * 1000,
    );

    return () => {
      cancelled = true;
      unsubscribeOneDay();
      clearInterval(historicalInterval);
    };
  }, [selectedDevice]);

  return { data, isLoading, isRefreshing, lastUpdated, error };
}
