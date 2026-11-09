import ParameterChart from "@/components/ParameterChart";
import PressableScale from "@/components/PressableScale";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "@/components/StateDisplay";
import { graphConfig, type GraphRangeId } from "@/constants/graphs";
import type { ParameterId } from "@/constants/parameters";
import { parameterIds, parameterMap } from "@/constants/parameters";
import { useGraphData } from "@/hooks/useGraphData";
import { isGraphDataEmpty } from "@/services/firebase/graphs";
import { styled } from "nativewind";
import { useCallback, useRef, useState } from "react";
import { Image, ScrollView, useWindowDimensions, View } from "react-native";
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
    Record<ParameterId, GraphRangeId>
  >({
    ammonia: "oneDay",
    temperature: "oneDay",
    dissolvedOxygen: "oneDay",
    pH: "oneDay",
    turbidity: "oneDay",
    salinity: "oneDay",
  });

  const scrollToSection = useCallback((id: ParameterId) => {
    const y = sectionPositions.current[id];
    if (y !== undefined) {
      scrollRef.current?.scrollTo({ y, animated: true });
    }
  }, []);

  if (error) return <ErrorState error={error} />;
  if (isLoading) return <LoadingState />;
  if (isGraphDataEmpty(allData))
    return (
      <EmptyState
        title="No data available"
        message="No readings found for this device"
      />
    );

  return (
    <SafeAreaView edges={["bottom"]} className="flex-1 bg-primary">
      <View className="flex-1 w-full max-w-xl mx-auto">
        <View className="bg-background rounded-t-xl flex-row gap-x-2 p-4">
          {parameterIds.map((id) => (
            <PressableScale
              key={id}
              onPress={() => scrollToSection(id)}
              accessibilityRole="button"
              accessibilityLabel={`Jump to ${parameterMap[id].label} chart`}
              style={{ flex: 1 }}
            >
              <View className="bg-white rounded-sm items-center py-2">
                <Image
                  source={parameterMap[id].icon}
                  style={{ height: 22, width: 22 }}
                />
              </View>
            </PressableScale>
          ))}
        </View>
        <ScrollView
          ref={scrollRef}
          className="bg-background"
          contentContainerClassName="pb-10"
          bounces={false}
        >
          <View className="w-full max-w-xl mx-auto pt-4 px-4">
            {allData.map((paramData) => {
              const id = paramData.id;
              const config = graphConfig[id];
              const range = timeRanges[id];
              const chartData = paramData[range].filter(
                (p) => !Number.isNaN(p.value),
              );

              return (
                <ParameterChart
                  key={id}
                  id={id}
                  data={chartData}
                  label={parameterMap[id].label}
                  color={config.color}
                  yAxisMin={config.yAxisMin}
                  yAxisMax={config.yAxisMax}
                  threshold={config.threshold}
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
      </View>
    </SafeAreaView>
  );
};

export default Graphs;
