import { useDevice } from "@/contexts/DeviceContext";
import { generateCsv } from "@/services/csv";
import { fetchReadings } from "@/services/firebase/graphs";
import { Directory, File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";
import { useState } from "react";

const SEVEN_DAYS_LIMIT = 2016;

export function useDownloadData(): {
  download: () => Promise<void>;
  isDownloading: boolean;
} {
  const { selectedDevice } = useDevice();
  const [isDownloading, setIsDownloading] = useState(false);

  async function download() {
    if (!selectedDevice) return;
    setIsDownloading(true);
    try {
      const readings = await fetchReadings(selectedDevice.id, SEVEN_DAYS_LIMIT);
      if (Object.keys(readings).length === 0) {
        return;
      }
      const csv = generateCsv(readings);

      if (Platform.OS === "web") {
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "ammosense-data.csv";
        a.click();
        URL.revokeObjectURL(url);
        return;
      }

      if (Platform.OS === "android") {
        const directory = await Directory.pickDirectoryAsync();
        if (!directory) return;
        const file = directory.createFile("ammosense-data.csv", "text/csv");
        file.write(csv);
        return;
      }

      const file = new File(Paths.cache, "ammosense-data.csv");
      file.write(csv);
      await Sharing.shareAsync(file.uri, {
        mimeType: "text/csv",
        UTI: "public.comma-separated-values-text",
      });
    } finally {
      setIsDownloading(false);
    }
  }

  return { download, isDownloading };
}
