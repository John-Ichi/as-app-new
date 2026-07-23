import ParameterCard from "@/components/ParameterCard";
import PressableScale from "@/components/PressableScale";
import { ErrorState, LoadingState } from "@/components/StateDisplay";
import { icons } from "@/constants/icons";
import { overallStatusBg, riskTextColor } from "@/constants/status";
import { colors } from "@/constants/theme";
import { useWaterQualityData } from "@/hooks/useWaterQualityData";
import { router } from "expo-router";
import { styled } from "nativewind";
import { Image, ScrollView, Text, View } from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

const SafeAreaView = styled(RNSafeAreaView);

const Dashboard = () => {
  const {
    overallStatus,
    parameters: readings,
    predictiveAlert,
    isLoading,
    error,
  } = useWaterQualityData();

  if (error) return <ErrorState message={error.message} />;
  if (isLoading) return <LoadingState />;

  return (
    <SafeAreaView edges={["bottom"]} className="flex-1 bg-background">
      <ScrollView className="flex-1" contentContainerClassName="pb-10">
        <View className="w-full h-16 bg-primary rounded-b-xl"></View>
        <View className="w-full max-w-xl mx-auto px-4">
          <View
            className={`${overallStatusBg[overallStatus]} -mt-14 mx-12 py-4 rounded-xl shadow-md shadow-slate-400/30 items-center justify-center`}
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
                <Image
                  source={icons.warning}
                  style={{ width: 40, height: 40 }}
                />
                <View>
                  <Text className="text-lg text-primary font-poppins-bold">
                    PREDICTIVE ALERT
                  </Text>
                  <Text className="text-md text-primary font-poppins-regular">
                    Risk:{" "}
                    <Text
                      className={`${riskTextColor[predictiveAlert.risk]} font-poppins-extrabold`}
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
                accessibilityLabel="Parameters"
                accessibilityRole="button"
                hitSlop={{ top: 8, bottom: 8, left: 9, right: 9 }}
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
