import { ParameterId } from "@/constants/parameters";
import { subscribeRawReadings } from "@/services/firebase/graphs";
import { useEffect, useState } from "react";

export function useRawReadings(
  deviceId: string,
  paramId: ParameterId,
): {
  keys: string[];
  values: number[];
  error: Error | null;
  isLoading: boolean;
  lastUpdated: number | null;
} {
  const [keys, setKeys] = useState<string[]>([]);
  const [values, setValues] = useState<number[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  useEffect(() => {
    if (!deviceId) return;
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    setKeys([]);
    setValues([]);
    setLastUpdated(null);
    const unsubscribe = subscribeRawReadings(
      deviceId,
      paramId,
      (data) => {
        if (cancelled) return;
        setKeys(data.keys);
        setValues(data.values);
        setError(null);
        setLastUpdated(
          data.keys.length > 0
            ? Number(data.keys[data.keys.length - 1])
            : Date.now(),
        );
        setIsLoading(false);
      },
      (err) => {
        if (cancelled) return;
        setError(err);
        setIsLoading(false);
      },
    );
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [deviceId, paramId]);

  return { keys, values, error, isLoading, lastUpdated };
}
