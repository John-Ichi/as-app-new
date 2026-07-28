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
import { useGraphData } from "@/hooks/useGraphData";
import { getRawReadings } from "@/services/firebase/graphs";
import { Redirect } from "expo-router";
import { styled } from "nativewind";
import { useEffect, useState } from "react";
import {
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
  const { width: screenWidth } = useWindowDimensions();
  const [showModal, setShowModal] = useState(false);
  const [rawData, setRawData] = useState<{ keys: string[]; values: number[] }>({
    keys: [],
    values: [],
  });

  useEffect(() => {
    if (!selectedDevice) return;
    getRawReadings(selectedDevice.id, "ammonia", 288).then(setRawData);
  }, [selectedDevice]);

  if (!selectedDevice) return <Redirect href="/onboarding" />;
  if (error) return <ErrorState message={error.message} />;
  if (isLoading) return <LoadingState />;
  if (allData.length === 0) return <ErrorState message="No data available." />;

  const colCount = 1 + allData.length;
  const naturalWidth = Math.floor((screenWidth - 32) / colCount);
  const colWidth = Math.max(Math.min(naturalWidth, 90), 75);

  const tableColumns = allData.map(
    (p) => graphConfig[p.id]?.shortLabel ?? p.id,
  );
  const tableRows = Array.from({ length: 24 }, (_, i) => ({
    label: `${i.toString().padStart(2, "0")}:00`,
    values: allData.map((p) => p.oneDay?.[i]?.value?.toFixed(2) ?? "-"),
  }));

  const ammonia = allData.find((d) => d.id === "ammonia");
  const points = ammonia?.oneDay;

  const maxVal = rawData.values.length > 0 ? Math.max(...rawData.values) : 0;
  const minVal = rawData.values.length > 0 ? Math.min(...rawData.values) : 0;
  const avgVal = points
    ? points.reduce((s, p) => s + p.value, 0) / points.length
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
                value={`${maxVal.toFixed(2)} PPM`}
                subLabel={maxLabel}
                textColor={maxTextColor}
                bgColor={maxBg}
              />
              <StatCard
                label="AVG (24 HRS)"
                value={`${avgVal.toFixed(2)} PPM`}
                subLabel={avgLabel}
                subLabelClassName={`text-md ${avgTextColor} font-poppins-bold`}
              />
              <StatCard
                label="MIN (24 HRS)"
                value={`${minVal.toFixed(2)} PPM`}
                subLabel={minLabel}
                textColor={minTextColor}
                bgColor={minBg}
              />
            </View>
          </View>
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
            <PressableScale
              onPress={() => {
                /** replace later to download data */
              }}
            >
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
