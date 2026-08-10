import { onValue, ref } from "firebase/database";
import { db } from "@/firebase/config";
import { classify } from "@/constants/status";
import type { ParameterReading, WaterQualityData } from "@/services/types";

export function getWaterQualityData(
  deviceId: string,
  onData: (data: WaterQualityData) => void,
  onError: (error: Error) => void,
): () => void {
  const latestRef = ref(db, `latest/${deviceId}`);

  const unsubscribe = onValue(
    latestRef,
    (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        onData({
          overallStatus: "NORMAL",
          parameters: [],
          predictiveAlert: { risk: "LOW" },
          isLoading: false,
          error: null,
        });
        return;
      }

      const readings: ParameterReading[] = [
        { id: "ammonia", value: data.ammonia, status: classify("ammonia", data.ammonia) },
        { id: "temperature", value: data.temperature, status: classify("temperature", data.temperature) },
        { id: "dissolvedOxygen", value: data.dissolvedOxygen, status: classify("dissolvedOxygen", data.dissolvedOxygen) },
        { id: "pH", value: data.pH, status: classify("pH", data.pH) },
        { id: "turbidity", value: data.turbidity, status: classify("turbidity", data.turbidity) },
      ];

      const ammonia = readings.find((p) => p.id === "ammonia");
      let overallStatus: WaterQualityData["overallStatus"] = "NORMAL";
      if (ammonia?.status === "critical") overallStatus = "CRITICAL";
      else if (ammonia?.status === "warning") overallStatus = "WARNING";

      onData({
        overallStatus,
        parameters: readings,
        predictiveAlert: { risk: "LOW" },
        isLoading: false,
        error: null,
      });
    },
    onError,
  );

  return unsubscribe;
}
