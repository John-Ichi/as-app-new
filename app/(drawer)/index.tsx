import ForecastModal from "@/components/ForecastModal";
import ParameterCard from "@/components/ParameterCard";
import PressableScale from "@/components/PressableScale";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "@/components/StateDisplay";
import { icons } from "@/constants/icons";
import { overallStatusBg } from "@/constants/status";
import { useDevice } from "@/contexts/DeviceContext";
import { useWaterQualityData } from "@/hooks/useWaterQualityData";
import {
  getCachedForecast,
  requestForecast,
  subscribeForecast,
} from "@/services/lstm";
import type { AmmoniaForecast } from "@/services/types";
import dayjs from "dayjs";
import { styled } from "nativewind";
import { useEffect, useState } from "react";
import { Image, ScrollView, Text, View } from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

const SafeAreaView = styled(RNSafeAreaView);

const Dashboard = () => {
  const { selectedDevice } = useDevice();
  const {
    overallStatus,
    parameters: readings,
    predictiveAlert,
    timestamp,
    isLoading,
    error,
  } = useWaterQualityData();

  const [showForecast, setShowForecast] = useState(false);
  const [forecast, setForecast] = useState<AmmoniaForecast | null>(
    getCachedForecast(),
  );

  useEffect(() => {
    if (!selectedDevice?.id) return;
    setForecast(getCachedForecast());
    const unsub = subscribeForecast(setForecast);
    const STALE_MS = 30 * 60 * 1000;
    const cached = getCachedForecast();
    if (!cached || Date.now() - cached.fetchedAt > STALE_MS) {
      requestForecast(selectedDevice.id);
    }
    return unsub;
  }, [selectedDevice]);

  useEffect(() => {
    if (!selectedDevice?.id || !timestamp) return;
    const cached = getCachedForecast();
    if (cached && timestamp <= cached.lastReadingTs) return;
    requestForecast(selectedDevice.id);
  }, [timestamp, selectedDevice]);

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
      <View className="flex-1 w-full max-w-xl mx-auto px-4">
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
              <View className="flex-row bg-white rounded-sm shadow-md shadow-slate-400/30 items-center gap-x-4 p-4">
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
                      className={`${
                        predictiveAlert.alert ? "text-danger" : "text-success"
                      } font-poppins-extrabold`}
                    >
                      {forecast
                        ? `${forecast.forecastMgL[0].toFixed(4)} ppm`
                        : "—"}
                    </Text>
                  </Text>
                  <Text
                    className="text-sm text-muted font-poppins-light mt-1"
                    numberOfLines={2}
                  >
                    {predictiveAlert.message}
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
