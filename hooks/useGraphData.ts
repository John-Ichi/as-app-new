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
    if (!selectedDevice) return;
    setIsLoading(true);
    setError(null);
    getGraphData(selectedDevice.id)
      .then(setData)
      .catch(setError)
      .finally(() => setIsLoading(false));
  }, [selectedDevice]);

  return { data, isLoading, error };
}
