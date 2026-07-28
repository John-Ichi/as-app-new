import ParameterChart from "@/components/ParameterChart";
import PressableScale from "@/components/PressableScale";
import { ErrorState, LoadingState } from "@/components/StateDisplay";
import { graphConfig } from "@/constants/graphs";
import type { ParameterId } from "@/constants/parameters";
import { parameterIds, parameterMap } from "@/constants/parameters";
import { useGraphData } from "@/hooks/useGraphData";
import { styled } from "nativewind";
import { useCallback, useRef, useState } from "react";
import { ScrollView, Text, useWindowDimensions, View } from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

const SafeAreaView = styled(RNSafeAreaView);

const Graphs = () => {
  const { data: allData, isLoading, error } = useGraphData();

  const { width: screenWidth } = useWindowDimensions();
  const chartWidth = screenWidth - 48;

  const scrollRef = useRef<ScrollView>(null);
  const sectionPositions = useRef<Record<ParameterId, number>>(
    {} as Record<ParameterId, number>,
  );

  const [timeRanges, setTimeRanges] = useState<
    Record<ParameterId, "oneDay" | "sevenDay">
  >({
    ammonia: "oneDay",
    temperature: "oneDay",
    dissolvedOxygen: "oneDay",
    pH: "oneDay",
    turbidity: "oneDay",
  });

  const scrollToSection = useCallback((id: ParameterId) => {
    const y = sectionPositions.current[id];
    if (y !== undefined) {
      scrollRef.current?.scrollTo({ y, animated: true });
    }
  }, []);

  if (error) return <ErrorState message={error.message} />;
  if (isLoading) return <LoadingState />;
  if (allData.length === 0) return <ErrorState message="No data available." />;

  return (
    <SafeAreaView edges={["bottom"]} className="flex-1 bg-primary">
      <View className="bg-background rounded-t-xl px-4 pt-6 pb-2">
        <View className="w-full max-w-xl flex-row mx-auto gap-x-2">
          {parameterIds.map((id) => (
            <PressableScale
              key={id}
              onPress={() => scrollToSection(id)}
              style={{ flex: 1 }}
            >
              <Text className="bg-primary rounded-sm text-md text-center text-white font-poppins-medium px-1 py-1.5">
                {graphConfig[id].shortLabel}
              </Text>
            </PressableScale>
          ))}
        </View>
      </View>
      <ScrollView
        ref={scrollRef}
        className="flex-1 bg-background"
        contentContainerClassName="pb-10"
        bounces={false}
      >
        <View className="w-full max-w-xl mx-auto pt-4 px-4">
          {allData.map((paramData) => {
            const id = paramData.id;
            const config = graphConfig[id];
            const range = timeRanges[id];
            const chartData =
              range === "oneDay" ? paramData.oneDay : paramData.sevenDay;

            return (
              <ParameterChart
                key={id}
                id={id}
                data={chartData}
                label={parameterMap[id].label}
                color={config.color}
                yAxisMin={config.yAxisMin}
                yAxisMax={config.yAxisMax}
                chartWidth={chartWidth}
                range={range}
                onRangeChange={(id, range) =>
                  setTimeRanges((prev) => ({ ...prev, [id]: range }))
                }
                onLayout={(y) => {
                  sectionPositions.current[id] = y;
                }}
              />
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Graphs;
