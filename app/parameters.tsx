import DataTable from "@/components/DataTable";
import DataTableModal from "@/components/DataTableModal";
import PressableScale from "@/components/PressableScale";
import { graphConfig } from "@/constants/graphs";
import { icons } from "@/constants/icons";
import { parameterMap } from "@/constants/parameters";
import { colors } from "@/constants/theme";
import { useGraphData } from "@/hooks/useGraphData";
import { styled } from "nativewind";
import { useState } from "react";
import {
  Image,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

const SafeAreaView = styled(RNSafeAreaView);

function ammoniaStatus(value: number) {
  const t = parameterMap.ammonia.threshold;
  if (!t) return "normal";
  if (value > t.critical) return "critical";
  if (value > t.warning) return "warning";
  return "normal";
}

const Parameters = () => {
  const allData = useGraphData();
  const [showModal, setShowModal] = useState(false);

  const { width: screenWidth } = useWindowDimensions();
  const colCount = 1 + allData.length;
  const naturalWidth = Math.floor((screenWidth - 32) / colCount);
  const colWidth = Math.max(Math.min(naturalWidth, 90), 75);

  const tableColumns = allData.map((p) => graphConfig[p.id].shortLabel);
  const tableRows = Array.from({ length: 24 }, (_, i) => ({
    label: `${i.toString().padStart(2, "0")}:00`,
    values: allData.map((p) => p.oneDay[i].value.toFixed(2)),
  }));

  const ammonia = allData.find((d) => d.id === "ammonia");
  const points = ammonia?.oneDay;

  const maxVal = points ? Math.max(...points.map((p) => p.value)) : 0;
  const maxPoint = points?.find((p) => p.value === maxVal);
  const minVal = points ? Math.min(...points.map((p) => p.value)) : 0;
  const minPoint = points?.find((p) => p.value === minVal);
  const avgVal = points
    ? points.reduce((s, p) => s + p.value, 0) / points.length
    : 0;

  const statusTextColor: Record<string, string> = {
    critical: "text-danger",
    warning: "text-warning",
    normal: "text-success",
  };

  const statusBgColor: Record<string, string> = {
    critical: "bg-danger-light",
    warning: "bg-warning-light",
    normal: "bg-success-light",
  };

  const statusLabel: Record<string, string> = {
    critical: "CRITICAL",
    warning: "WARNING",
    normal: "SAFE",
  };

  const maxStatus = ammoniaStatus(maxVal);
  const maxBg = statusBgColor[maxStatus];
  const maxTextColor = statusTextColor[maxStatus];
  const maxLabel =
    maxPoint?.label ??
    (maxPoint !== undefined
      ? `${points!.indexOf(maxPoint).toString().padStart(2, "0")}:00`
      : "N/A");

  const minStatus = ammoniaStatus(minVal);
  const minTextColor = statusTextColor[minStatus];
  const minBg = statusBgColor[minStatus];
  const minLabel =
    minPoint?.label ??
    (minPoint !== undefined
      ? `${points!.indexOf(minPoint).toString().padStart(2, "0")}:00`
      : "N/A");

  const avgStatus = ammoniaStatus(avgVal);
  const avgLabel = statusLabel[avgStatus];
  const avgTextColor = statusTextColor[avgStatus];

  return (
    <SafeAreaView edges={["bottom"]} className="flex-1 bg-primary">
      <ScrollView
        className="flex-1 rounded-t-xl bg-background"
        contentContainerClassName="pb-10"
      >
        <View className="w-full max-w-xl mx-auto pt-4 px-4">
          <View className="bg-white rounded-t-md shadow-md shadow-slate-400/30">
            <Text className="text-xl text-center text-primary font-poppins-bold p-2">
              AMMONIA, NH₃
            </Text>
            <View className="flex-row justify-between px-4 pb-4">
              <View
                className={`w-[31%] ${maxBg} rounded-t-md shadow-md shadow-slate-400/30 items-center p-2`}
              >
                <Text className="text-md text-primary font-poppins-semibold">
                  MAX (24 HRS)
                </Text>
                <Text className={`text-lg ${maxTextColor} font-poppins-bold`}>
                  {maxVal.toFixed(2)} PPM
                </Text>
                <Text className="text-md text-muted font-poppins-regular">
                  {maxLabel}
                </Text>
              </View>
              <View className="w-[31%] bg-white rounded-t-md shadow-md shadow-slate-400/30 items-center p-2">
                <Text className="text-md text-primary font-poppins-semibold">
                  AVG (24 HRS)
                </Text>
                <Text className="text-lg text-primary font-poppins-bold">
                  {avgVal.toFixed(2)} PPM
                </Text>
                <Text className={`text-md ${avgTextColor} font-poppins-bold`}>
                  {avgLabel}
                </Text>
              </View>
              <View
                className={`w-[31%] ${minBg} rounded-t-md shadow-md shadow-slate-400/30 items-center p-2`}
              >
                <Text className="text-md text-primary font-poppins-semibold">
                  MIN (24 HRS)
                </Text>
                <Text className={`text-lg ${minTextColor} font-poppins-bold`}>
                  {minVal.toFixed(2)} PPM
                </Text>
                <Text className="text-md text-muted font-poppins-regular">
                  {minLabel}
                </Text>
              </View>
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
                <Image source={icons.download} className="size-5 -mt-1" />
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
