import ForecastModal from "@/components/ForecastModal";
import ParameterCard from "@/components/ParameterCard";
import PressableScale from "@/components/PressableScale";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "@/components/StateDisplay";
import { icons } from "@/constants/icons";
import { overallStatusBg, riskTextColor } from "@/constants/status";
import { useWaterQualityData } from "@/hooks/useWaterQualityData";
import dayjs from "dayjs";
import { styled } from "nativewind";
import { useState } from "react";
import { Image, ScrollView, Text, View } from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

const SafeAreaView = styled(RNSafeAreaView);

const Dashboard = () => {
  const {
    overallStatus,
    parameters: readings,
    predictiveAlert,
    timestamp,
    isLoading,
    error,
  } = useWaterQualityData();

  const [showForecast, setShowForecast] = useState(false);

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;
  if (timestamp === null || readings.length === 0)
    return (
      <EmptyState
        title="No readings yet"
        message="This device hasn't reported any data"
      />
    );

  return (
    <SafeAreaView edges={["bottom"]} className="flex-1 bg-background">
      <View className="w-full h-16 bg-primary rounded-b-xl"></View>
      <View className="w-full max-w-xl mx-auto px-4">
        <View
          className={`${overallStatusBg[overallStatus]} rounded-xl shadow-md shadow-slate-400/30 items-center -mt-14 mx-12 py-4`}
        >
          <Text className="text-lg text-white font-poppins-medium">
            OVERALL AMMONIA STATUS
          </Text>
          <Text className="text-xl text-white font-poppins-bold">
            {overallStatus}
          </Text>
        </View>
        {timestamp ? (
          <Text className="text-sm text-center text-muted font-poppins-light py-2">
            Last updated: {dayjs(timestamp).format("MMM D h:mm A")}
          </Text>
        ) : null}
        <ScrollView contentContainerClassName="pb-8">
          <View className="flex-row flex-wrap justify-between gap-y-4">
            {readings.map((reading) => (
              <ParameterCard
                key={reading.id}
                id={reading.id}
                value={reading.value}
              />
            ))}
            <PressableScale
              onPress={() => setShowForecast(true)}
              accessibilityRole="button"
              accessibilityLabel="Open forecast modal"
              style={{ width: "100%" }}
            >
              <View className="flex-row bg-white rounded-sm shadow-md shadow-slate-400/30 items-center gap-x-4 px-4 py-6">
                <Image
                  source={icons.warning}
                  style={{ width: 40, height: 40 }}
                />
                <View className="flex-1">
                  <Text className="text-lg text-primary font-poppins-bold">
                    PREDICTIVE ALERT
                  </Text>
                  <Text className="text-md text-primary font-poppins-regular">
                    Next hour:{" "}
                    <Text
                      className={`${riskTextColor[predictiveAlert.risk]} font-poppins-extrabold`}
                    >
                      - ppm
                    </Text>{" "}
                    (coming soon)
                  </Text>
                </View>
              </View>
            </PressableScale>
          </View>
        </ScrollView>
        <ForecastModal
          visible={showForecast}
          onClose={() => setShowForecast(false)}
        />
      </View>
    </SafeAreaView>
  );
};

export default Dashboard;
