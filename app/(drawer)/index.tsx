import { icons } from "@/constants/icons";
import { parameterMap } from "@/constants/parameters";
import { useWaterQualityData } from "@/hooks/useWaterQualityData";
import { styled } from "nativewind";
import { Image, ScrollView, Text, View } from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

const SafeAreaView = styled(RNSafeAreaView);
const statusColor: Record<"NORMAL" | "WARNING" | "CRITICAL", string> = {
  NORMAL: "bg-success",
  WARNING: "bg-warning",
  CRITICAL: "bg-danger",
};

const riskColor: Record<"LOW" | "MEDIUM" | "HIGH", string> = {
  LOW: "text-success",
  MEDIUM: "text-warning",
  HIGH: "text-danger",
};

const Dashboard = () => {
  const {
    overallStatus,
    parameters: readings,
    predictiveAlert,
  } = useWaterQualityData();

  return (
    <SafeAreaView edges={["bottom"]} className="flex-1 bg-background">
      <ScrollView className="flex-1" contentContainerClassName="pb-10">
        <View className="w-full h-16 bg-primary rounded-b-xl"></View>
        <View className="w-full max-w-xl mx-auto px-4">
          <View
            className={`${statusColor[overallStatus]} -mt-14 mx-12 py-4 rounded-xl shadow-md shadow-slate-400/30 items-center justify-center`}
          >
            <Text className="text-lg text-white font-poppins-medium">
              OVERALL AMMONIA STATUS
            </Text>
            <Text className="text-xl text-white font-poppins-bold">
              {overallStatus}
            </Text>
          </View>
          <View className="mt-6 flex-row flex-wrap justify-between gap-y-5">
            {readings
              .filter((r) => parameterMap[r.id])
              .map((reading) => {
                const metadata = parameterMap[reading.id];
                const wide = metadata.fullWidth;
                return (
                  <View
                    key={reading.id}
                    className={`${wide ? "w-full flex-row items-center" : "w-[48%]"} h-28 bg-white rounded-sm p-4 shadow-sm shadow-slate-400/30 justify-between`}
                  >
                    <View className="flex-row gap-x-2 items-center">
                      <Image
                        source={metadata.icon}
                        className="w-6 h-6"
                        resizeMode="contain"
                      />
                      <Text
                        className={`${wide ? "tracking-wide" : ""} text-md text-primary font-poppins-bold`}
                      >
                        {metadata.label}
                      </Text>
                    </View>
                    <Text className="text-lg text-primary font-poppins-bold">
                      {reading.value} {metadata.unit}
                    </Text>
                  </View>
                );
              })}
            <View className="w-full h-28 flex-row bg-white rounded-sm p-4 shadow-sm shadow-slate-400/30 items-center justify-between">
              <View className="flex-row items-center gap-x-4">
                <Image
                  source={icons.warning}
                  className="w-10 h-10"
                  resizeMode="contain"
                />
                <View>
                  <Text className="text-lg text-primary font-poppins-bold">
                    PREDICTIVE ALERT
                  </Text>
                  <Text className="text-md text-primary font-poppins-regular">
                    Risk:{" "}
                    <Text
                      className={`${riskColor[predictiveAlert.risk]} font-poppins-extrabold`}
                    >
                      {predictiveAlert.risk}
                    </Text>{" "}
                    (24 HRS)
                  </Text>
                </View>
              </View>
              <View className="pr-2">
                <Text className="text-lg text-primary font-poppins-regular">
                  &gt;
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Dashboard;
