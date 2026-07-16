import ParameterCard from "@/components/ParameterCard";
import PressableScale from "@/components/PressableScale";
import { icons } from "@/constants/icons";
import { colors } from "@/constants/theme";
import { useWaterQualityData } from "@/hooks/useWaterQualityData";
import { router } from "expo-router";
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
            {readings.map((reading) => (
              <ParameterCard
                key={reading.id}
                id={reading.id}
                value={reading.value}
              />
            ))}
            <View className="w-full flex-row bg-white rounded-sm shadow-md shadow-slate-400/30 items-center justify-between p-4 py-6">
              <View className="flex-row items-center gap-x-4">
                <Image source={icons.warning} className="size-10" />
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
              <PressableScale
                onPress={() => {
                  router.push("/parameters");
                }}
                style={{ borderRadius: 20, paddingLeft: 8, paddingRight: 8 }}
                pressedStyle={{ backgroundColor: colors.pressed }}
              >
                <Text className="text-lg text-primary font-poppins-regular">
                  &gt;
                </Text>
              </PressableScale>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Dashboard;
