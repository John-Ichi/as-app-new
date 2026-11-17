import {
  downloadRanges,
  type DownloadRangeId,
} from "@/constants/downloadRanges";
import { useDevice } from "@/contexts/DeviceContext";
import { generateCsv } from "@/services/csv";
import { fetchReadingsSince } from "@/services/firebase/graphs";
import { Directory, File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { useState } from "react";
import { Platform } from "react-native";

const DAY_MS = 24 * 60 * 60 * 1000;

export function useDownloadData(): {
  download: (rangeId: DownloadRangeId) => Promise<void>;
  isDownloading: boolean;
  error: Error | null;
} {
  const { selectedDevice } = useDevice();
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  async function download(rangeId: DownloadRangeId) {
    if (!selectedDevice) return;
    const range = downloadRanges.find((r) => r.id === rangeId);
    if (!range) return;

    setIsDownloading(true);
    setError(null);
    try {
      // Window-based fetch: exact rolling window at any reading cadence.
      const readings = await fetchReadingsSince(
        selectedDevice.id,
        Date.now() - range.days * DAY_MS,
      );
      if (Object.keys(readings).length === 0) {
        setError(new Error("No readings found in this period."));
        return;
      }
      const csv = generateCsv(readings);
      const filename = `ammosense-data-${range.days}d.csv`;

      if (Platform.OS === "web") {
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
        return;
      }

      if (Platform.OS === "android") {
        const directory = await Directory.pickDirectoryAsync();
        if (!directory) return;
        const file = directory.createFile(filename, "text/csv");
        await file.write(csv);
        return;
      }

      const file = new File(Paths.cache, filename);
      await file.write(csv);
      try {
        await Sharing.shareAsync(file.uri, {
          mimeType: "text/csv",
          UTI: "public.comma-separated-values-text",
        });
      } finally {
        file.delete();
      }
    } catch (e) {
      // Some platforms throw a "user canceled" style error when the save
      // dialog is dismissed — not a real failure, so it stays silent.
      if (e instanceof Error && !e.message.includes("user")) {
        console.error("Download failed:", e);
        setError(e);
      }
    } finally {
      setIsDownloading(false);
    }
  }

  return { download, isDownloading, error };
}
