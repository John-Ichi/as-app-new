import { useDevice } from "@/contexts/DeviceContext";
import { getGraphData } from "@/services/firebase/graphs";
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
    getGraphData(selectedDevice.id)
      .then((result) => { if (!cancelled) setData(result); })
      .catch((err) => { if (!cancelled) setError(err); })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [selectedDevice]);

  return { data, isLoading, error };
}
