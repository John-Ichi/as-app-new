import DataTable from "@/components/DataTable";
import DataTableModal from "@/components/DataTableModal";
import PressableScale from "@/components/PressableScale";
import StatCard from "@/components/StatCard";
import { ErrorState, LoadingState } from "@/components/StateDisplay";
import { graphConfig } from "@/constants/graphs";
import { icons } from "@/constants/icons";
import {
  classify,
  parameterStatusBg,
  parameterStatusLabel,
  parameterStatusTextColor,
} from "@/constants/status";
import { colors } from "@/constants/theme";
import { useDevice } from "@/contexts/DeviceContext";
import { useDownloadData } from "@/hooks/useDownloadData";
import { useGraphData } from "@/hooks/useGraphData";
import {
  isOneDayEmpty,
  subscribeRawReadings,
} from "@/services/firebase/graphs";
import { formatCellValue, formatTimeAmPm } from "@/utils/format";
import dayjs from "dayjs";
import { Redirect } from "expo-router";
import { styled } from "nativewind";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

const SafeAreaView = styled(RNSafeAreaView);

const Parameters = () => {
  const { selectedDevice } = useDevice();
  const { data: allData, isLoading, error } = useGraphData();
  const { download, isDownloading } = useDownloadData();
  const { width: screenWidth } = useWindowDimensions();
  const [showModal, setShowModal] = useState(false);
  const [rawData, setRawData] = useState<{ keys: string[]; values: number[] }>({
    keys: [],
    values: [],
  });
  const [rawDataError, setRawDataError] = useState<Error | null>(null);
  const [isRawDataLoading, setIsRawDataLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  useEffect(() => {
    if (!selectedDevice) return;
    let cancelled = false;
    setIsRawDataLoading(true);
    setRawDataError(null);
    const unsubscribe = subscribeRawReadings(
      selectedDevice.id,
      "ammonia",
      (data) => {
        if (cancelled) return;
        setRawData(data);
        setRawDataError(null);
        setLastUpdated(Date.now());
        setIsRawDataLoading(false);
      },
      (err) => {
        if (cancelled) return;
        setRawDataError(err);
        setIsRawDataLoading(false);
      },
    );
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [selectedDevice]);

  if (!selectedDevice) return <Redirect href="/onboarding" />;
  if (error && allData.length === 0)
    return <ErrorState message={error.message} />;
  if (rawDataError && rawData.values.length === 0)
    return <ErrorState message={rawDataError.message} />;
  if (
    (isLoading && allData.length === 0) ||
    (isRawDataLoading && rawData.values.length === 0)
  )
    return <LoadingState />;
  if (rawData.values.length === 0 || isOneDayEmpty(allData))
    return <ErrorState title="No data available." />;

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

  const maxVal = rawData.values.length > 0 ? Math.max(...rawData.values) : 0;
  const minVal = rawData.values.length > 0 ? Math.min(...rawData.values) : 0;
  const avgVal =
    validPoints.length > 0
      ? validPoints.reduce((s, p) => s + p.value, 0) / validPoints.length
      : 0;

  const maxIdx = rawData.values.indexOf(maxVal);
  const minIdx = rawData.values.indexOf(minVal);

  const maxStatus = classify("ammonia", maxVal) ?? "normal";
  const maxBg = parameterStatusBg[maxStatus];
  const maxTextColor = parameterStatusTextColor[maxStatus];
  const maxLabel =
    maxIdx >= 0
      ? new Date(Number(rawData.keys[maxIdx])).toLocaleString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "N/A";

  const minStatus = classify("ammonia", minVal) ?? "normal";
  const minTextColor = parameterStatusTextColor[minStatus];
  const minBg = parameterStatusBg[minStatus];
  const minLabel =
    minIdx >= 0
      ? new Date(Number(rawData.keys[minIdx])).toLocaleString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "N/A";

  const avgStatus = classify("ammonia", avgVal) ?? "normal";
  const avgLabel = parameterStatusLabel[avgStatus];
  const avgTextColor = parameterStatusTextColor[avgStatus];

  return (
    <SafeAreaView edges={["bottom"]} className="flex-1 bg-primary">
      <View className="bg-primary flex-row items-center justify-center gap-x-3 py-2 px-4">
        {(isRawDataLoading || isLoading) &&
        rawData.values.length > 0 &&
        allData.length > 0 ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : null}
        {lastUpdated ? (
          <Text className="text-sm text-white font-poppins-regular">
            Last updated: {dayjs(lastUpdated).format("h:mm A")}
          </Text>
        ) : null}
        {(isRawDataLoading || isLoading) &&
        rawData.values.length > 0 &&
        allData.length > 0 ? (
          <Text className="text-xs text-white font-poppins-regular">
            Updating…
          </Text>
        ) : null}
      </View>
      <ScrollView
        className="flex-1 rounded-t-xl bg-background"
        contentContainerClassName="pb-10"
      >
        <View className="w-full max-w-xl mx-auto pt-4 px-4">
          <View className="bg-white rounded-t-bg shadow-md shadow-slate-400/30">
            <Text className="text-xl text-center text-primary font-poppins-bold p-2">
              AMMONIA, NH₃
            </Text>
            <View className="flex-row justify-between px-4 pb-4">
              <StatCard
                label="MAX (24 HRS)"
                value={`${maxVal.toFixed(3)} PPM`}
                subLabel={maxLabel}
                textColor={maxTextColor}
                bgColor={maxBg}
              />
              <StatCard
                label="AVG (24 HRS)"
                value={`${avgVal.toFixed(3)} PPM`}
                subLabel={avgLabel}
                subLabelClassName={`text-md ${avgTextColor} font-poppins-bold`}
              />
              <StatCard
                label="MIN (24 HRS)"
                value={`${minVal.toFixed(3)} PPM`}
                subLabel={minLabel}
                textColor={minTextColor}
                bgColor={minBg}
              />
            </View>
          </View>
          {rawDataError && rawData.values.length > 0 ? (
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
              onPress={() => setShowModal(true)}
              style={{ borderRadius: 20, paddingLeft: 8, paddingRight: 8 }}
              pressedStyle={{ backgroundColor: colors.pressed }}
            >
              <Text className="text-md text-muted font-poppins-regular">
                See More
              </Text>
            </PressableScale>
          </View>
          <DataTable
            columns={tableColumns}
            rows={tableRows}
            colWidth={colWidth}
          />

          <View className="items-start py-4">
            <PressableScale onPress={download} disabled={isDownloading}>
              <View className="flex-row bg-white rounded-bg shadow-md shadow-slate-400/30 items-center px-4 pt-3 pb-2">
                <Image
                  source={icons.download}
                  style={{ width: 20, height: 20, marginTop: -4 }}
                />
                <Text className="text-md text-primary font-poppins-bold ml-2">
                  DOWNLOAD DATA SET
                </Text>
              </View>
            </PressableScale>
          </View>
        </View>
      </ScrollView>
      <DataTableModal visible={showModal} onClose={() => setShowModal(false)} />
    </SafeAreaView>
  );
};

export default Parameters;
