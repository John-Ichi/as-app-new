import DataTable from "@/components/DataTable";
import DataTableModal from "@/components/DataTableModal";
import DownloadModal from "@/components/DownloadModal";
import PressableScale from "@/components/PressableScale";
import StatCard from "@/components/StatCard";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "@/components/StateDisplay";
import { graphConfig } from "@/constants/graphs";
import {
  classify,
  parameterStatusBg,
  parameterStatusLabel,
  parameterStatusTextColor,
} from "@/constants/status";
import { colors } from "@/constants/theme";
import { useDevice } from "@/contexts/DeviceContext";
import { useGraphData } from "@/hooks/useGraphData";
import { useRawReadings } from "@/hooks/useRawReadings";
import {
  fetchOldestReadingTs,
  isOneDayEmpty,
} from "@/services/firebase/graphs";
import { formatCellValue, formatTimeAmPm } from "@/utils/format";
import dayjs from "dayjs";
import { Redirect } from "expo-router";
import { styled } from "nativewind";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

const SafeAreaView = styled(RNSafeAreaView);

function parameterStatus(value: number) {
  const status = classify("ammonia", value) ?? "normal";
  return {
    bgColor: parameterStatusBg[status],
    textColor: parameterStatusTextColor[status],
    label: parameterStatusLabel[status],
  };
}

const Parameters = () => {
  const { selectedDevice } = useDevice();
  const { data: allData, isLoading, error } = useGraphData();
  const { width: screenWidth } = useWindowDimensions();
  const {
    keys,
    values,
    error: rawDataError,
    isLoading: isRawDataLoading,
    lastUpdated,
  } = useRawReadings(selectedDevice?.id ?? "", "ammonia");

  const [showModal, setShowModal] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [olderData, setOlderData] = useState<"unknown" | "yes" | "no">(
    "unknown",
  );

  useEffect(() => {
    if (!selectedDevice || values.length > 0) return;
    let cancelled = false;
    fetchOldestReadingTs(selectedDevice.id)
      .then((oldestTs) => {
        if (cancelled) return;
        setOlderData(
          oldestTs != null && oldestTs < Date.now() - 24 * 60 * 60 * 1000
            ? "yes"
            : "no",
        );
      })
      .catch(() => {
        if (!cancelled) setOlderData("unknown");
      });
    return () => {
      cancelled = true;
    };
  }, [selectedDevice, values.length]);

  if (!selectedDevice) return <Redirect href="/onboarding" />;
  if (error && allData.length === 0) return <ErrorState error={error} />;
  if (rawDataError && values.length === 0)
    return <ErrorState error={rawDataError} />;
  if (
    (isLoading && allData.length === 0) ||
    (isRawDataLoading && values.length === 0)
  )
    return <LoadingState />;
  if (values.length === 0 || isOneDayEmpty(allData))
    return (
      <View className="flex-1">
        <EmptyState
          title="No data available"
          message="No readings found within the last 24 hours for this device"
          action={
            olderData === "yes"
              ? {
                  label: "Download older data",
                  onPress: () => setShowDownloadModal(true),
                }
              : undefined
          }
        />
        <DownloadModal
          visible={showDownloadModal}
          onClose={() => setShowDownloadModal(false)}
        />
      </View>
    );

  const isRefreshing =
    (isRawDataLoading || isLoading) && values.length > 0 && allData.length > 0;

  const colCount = 1 + allData.length;
  const naturalWidth = Math.floor((screenWidth - 32) / colCount);
  const colWidth = Math.max(Math.min(naturalWidth, 90), 75);

  const tableColumns = allData.map(
    (p) => graphConfig[p.id]?.shortLabel ?? p.id,
  );

  const nowHourStart =
    Math.floor(Date.now() / (60 * 60 * 1000)) * (60 * 60 * 1000);
  const bucketHours = Array.from({ length: 24 }, (_, i) =>
    new Date(nowHourStart - (23 - i) * 60 * 60 * 1000).getHours(),
  );

  const tableRows = bucketHours.map((hour, i) => ({
    label: formatTimeAmPm(hour),
    values: allData.map((p) => formatCellValue(p.id, p.oneDay?.[i]?.value)),
  }));

  const ammonia = allData.find((d) => d.id === "ammonia");
  const points = ammonia?.oneDay;
  const validPoints = points?.filter((p) => !Number.isNaN(p.value)) ?? [];

  const maxVal = values.length > 0 ? Math.max(...values) : 0;
  const minVal = values.length > 0 ? Math.min(...values) : 0;
  const avgVal =
    validPoints.length > 0
      ? validPoints.reduce((s, p) => s + p.value, 0) / validPoints.length
      : 0;
  const maxIdx = values.indexOf(maxVal);
  const minIdx = values.indexOf(minVal);

  const formatTimestamp = (idx: number) =>
    idx >= 0
      ? new Date(Number(keys[idx])).toLocaleString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "N/A";

  const maxLabel = formatTimestamp(maxIdx);
  const minLabel = formatTimestamp(minIdx);
  const { bgColor: maxBg, textColor: maxTextColor } = parameterStatus(maxVal);
  const { bgColor: minBg, textColor: minTextColor } = parameterStatus(minVal);
  const { textColor: avgTextColor, label: avgLabel } = parameterStatus(avgVal);

  return (
    <SafeAreaView edges={["bottom"]} className="flex-1 bg-primary">
      <View className="w-full max-w-xl mx-auto flex-1">
        <View className="bg-primary flex-row items-center justify-center gap-x-4 px-4 py-2">
          {lastUpdated ? (
            <Text className="text-sm text-white font-poppins-regular">
              Last updated: {dayjs(lastUpdated).format("h:mm A")}
            </Text>
          ) : null}
          {isRefreshing ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : null}
        </View>
        <ScrollView
          className="rounded-t-xl bg-background"
          contentContainerClassName="pb-10 pt-4 px-4"
        >
          <View className="bg-white rounded-t-lg shadow-md shadow-slate-400/30">
            <Text className="text-xl text-center text-primary font-poppins-bold pt-2">
              AMMONIA, NH₃
            </Text>
            <Text className="text-md text-center text-muted font-poppins-light pb-2">
              (24 HRS)
            </Text>
            <View className="flex-row justify-between px-4 pb-4">
              <StatCard
                label="MAX"
                value={`${maxVal.toFixed(4)} PPM`}
                subLabel={maxLabel}
                textColor={maxTextColor}
                bgColor={maxBg}
              />
              <StatCard
                label="AVG"
                value={`${avgVal.toFixed(4)} PPM`}
                subLabel={avgLabel}
                subLabelClassName={`text-md ${avgTextColor} font-poppins-bold`}
              />
              <StatCard
                label="MIN"
                value={`${minVal.toFixed(4)} PPM`}
                subLabel={minLabel}
                textColor={minTextColor}
                bgColor={minBg}
              />
            </View>
          </View>
          {rawDataError && values.length > 0 ? (
            <Text className="text-sm text-danger font-poppins-regular text-center mt-3">
              Failed to refresh: {rawDataError.message}
            </Text>
          ) : null}
          {error && allData.length > 0 ? (
            <Text className="text-sm text-danger font-poppins-regular text-center mt-3">
              Failed to refresh: {error.message}
            </Text>
          ) : null}
          <View className="flex-row items-center justify-between py-4">
            <Text className="text-lg text-primary font-poppins-bold">
              GATHERED DATA TABLE
            </Text>
            <PressableScale
              onPress={() => setShowDownloadModal(true)}
              style={{ borderRadius: 20, paddingLeft: 8, paddingRight: 8 }}
              pressedStyle={{ backgroundColor: colors.pressed }}
            >
              <Text className="text-md text-muted font-poppins-light">
                Download
              </Text>
            </PressableScale>
          </View>
          <DataTable
            columns={tableColumns}
            rows={tableRows}
            colWidth={colWidth}
          />
        </ScrollView>
        <DataTableModal
          visible={showModal}
          onClose={() => setShowModal(false)}
        />
        <DownloadModal
          visible={showDownloadModal}
          onClose={() => setShowDownloadModal(false)}
        />
      </View>
    </SafeAreaView>
  );
};

export default Parameters;
