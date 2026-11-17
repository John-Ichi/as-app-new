import PressableScale from "@/components/PressableScale";
import {
  downloadRanges,
  type DownloadRangeId,
} from "@/constants/downloadRanges";
import { icons } from "@/constants/icons";
import { colors } from "@/constants/theme";
import { useDevice } from "@/contexts/DeviceContext";
import { useDownloadData } from "@/hooks/useDownloadData";
import {
  fetchFirstReadingTsSince,
  fetchLastReadingTsUntil,
} from "@/services/firebase/graphs";
import dayjs from "dayjs";
import { styled } from "nativewind";
import { useEffect, useState } from "react";
import { ActivityIndicator, Image, Modal, Text, View } from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

const SafeAreaView = styled(RNSafeAreaView);

interface Props {
  visible: boolean;
  onClose: () => void;
}

const DAY_MS = 24 * 60 * 60 * 1000;

type SpanState = "loading" | "empty" | { start: number; end: number };

const DownloadModal = ({ visible, onClose }: Props) => {
  const { selectedDevice } = useDevice();
  const { download, isDownloading, error } = useDownloadData();
  const [activeRange, setActiveRange] = useState<DownloadRangeId | null>(null);
  const [lastReadingTs, setLastReadingTs] = useState<number | null>(null);
  const [firstReadingTs, setFirstReadingTs] = useState<
    Partial<Record<DownloadRangeId, number | null>>
  >({});
  const [spansLoading, setSpansLoading] = useState(false);

  // Honest date spans: on open, fetch the newest reading overall (shared by
  // every range) and the oldest reading inside each rolling window. Labels
  // then describe the actual data, and empty windows are disabled.
  useEffect(() => {
    if (!visible || !selectedDevice) return;
    let cancelled = false;
    setSpansLoading(true);
    const now = Date.now();
    fetchLastReadingTsUntil(selectedDevice.id, now)
      .then((last) => {
        if (cancelled) return;
        setLastReadingTs(last);
        return Promise.all(
          downloadRanges.map(async (range) => [
            range.id,
            await fetchFirstReadingTsSince(
              selectedDevice.id,
              now - range.days * DAY_MS,
            ),
          ] as const),
        );
      })
      .then((entries) => {
        if (cancelled || !entries) return;
        setFirstReadingTs(Object.fromEntries(entries));
      })
      .catch(() => {
        if (!cancelled) setFirstReadingTs({});
      })
      .finally(() => {
        if (!cancelled) setSpansLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [visible, selectedDevice]);

  const spanFor = (rangeId: DownloadRangeId): SpanState => {
    if (spansLoading) return "loading";
    const last = lastReadingTs;
    const first = firstReadingTs[rangeId] ?? null;
    if (last === null || first === null) return "empty";
    return { start: first, end: last };
  };

  const handleDownload = async (rangeId: DownloadRangeId) => {
    if (isDownloading) return;
    setActiveRange(rangeId);
    await download(rangeId);
    setActiveRange(null);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView className="flex-1 bg-background">
        <View className="w-full max-w-xl mx-auto">
          <View className="flex-row items-center justify-between p-4">
            <Text className="text-lg text-primary font-poppins-bold">
              DOWNLOAD DATA SET
            </Text>
            <PressableScale
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close"
              style={{ borderRadius: 20, paddingLeft: 8, paddingRight: 8 }}
              pressedStyle={{ backgroundColor: colors.pressed }}
              hitSlop={10}
            >
              <Text className="text-xl text-muted font-poppins-light">
                {"\u00D7"}
              </Text>
            </PressableScale>
          </View>
          <View className="p-4">
            <View className="gap-y-4">
              {downloadRanges.map((range) => {
                const isActive = activeRange === range.id && isDownloading;
                const span = spanFor(range.id);
                const isEmpty = span === "empty";
                return (
                  <PressableScale
                    key={range.id}
                    disabled={isDownloading || isEmpty}
                    onPress={() => handleDownload(range.id)}
                    accessibilityRole="button"
                    accessibilityLabel={`Download ${range.label} data`}
                    style={isEmpty ? { opacity: 0.7 } : undefined}
                  >
                    <View className="flex-row items-center justify-between bg-white rounded-lg shadow-md shadow-slate-400/30 p-4">
                      <View>
                        <Text className="text-lg text-primary font-poppins-bold">
                          {range.label.toUpperCase()}
                        </Text>
                        <Text className="text-md text-muted font-poppins-regular">
                          {isEmpty
                            ? "No readings in this period."
                            : span === "loading"
                              ? `${dayjs()
                                  .subtract(range.days, "day")
                                  .format("MMM D, YYYY")} \u2013 ${dayjs().format("MMM D, YYYY")}`
                              : `${dayjs(span.start).format("MMM D, YYYY")} \u2013 ${dayjs(span.end).format("MMM D, YYYY")}`}
                        </Text>
                      </View>
                      {isActive ? (
                        <ActivityIndicator
                          size="small"
                          color={colors.primary}
                        />
                      ) : (
                        <Image
                          source={icons.download}
                          style={{
                            tintColor: colors.primary,
                            width: 20,
                            height: 20,
                          }}
                        />
                      )}
                    </View>
                  </PressableScale>
                );
              })}
            </View>
            {error ? (
              <Text className="text-sm text-danger font-poppins-regular text-center mt-4">
                {error.message}
              </Text>
            ) : null}
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

export default DownloadModal;
