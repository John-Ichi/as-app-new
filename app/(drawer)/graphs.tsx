import PressableScale from "@/components/PressableScale";
import { graphConfig } from "@/constants/graphs";
import {
  ParameterId,
  parameterIds,
  parameterMap,
} from "@/constants/parameters";
import { colors } from "@/constants/theme";
import { useGraphData } from "@/hooks/useGraphData";
import { styled } from "nativewind";
import { useCallback, useRef, useState } from "react";
import { ScrollView, Text, useWindowDimensions, View } from "react-native";
import { LineChart } from "react-native-gifted-charts";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

const SafeAreaView = styled(RNSafeAreaView);

const Graphs = () => {
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

  const allData = useGraphData();
  const scrollToSection = useCallback((id: ParameterId) => {
    const y = sectionPositions.current[id];
    if (y !== undefined) {
      scrollRef.current?.scrollTo({ y, animated: true });
    }
  }, []);

  return (
    <SafeAreaView edges={["bottom"]} className="flex-1 bg-primary">
      <View className="px-4 pt-6 pb-2 rounded-t-xl bg-background">
        <View className="w-full max-w-xl mx-auto flex-row gap-x-2">
          {parameterIds.map((id) => (
            <PressableScale
              key={id}
              onPress={() => scrollToSection(id)}
              style={{ flex: 1 }}
            >
              <Text className="px-1 py-1.5 bg-primary rounded-sm text-md text-center text-white font-poppins-medium">
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
          {allData.length === 0 ? (
            <Text className="text-sm text-center text-muted mt-20 text-base font-poppins-regular">
              No data available. Please check your connection or try again
              later.
            </Text>
          ) : (
            allData.map((paramData) => {
              const id = paramData.id;
              const config = graphConfig[id];
              const metadata = parameterMap[id];
              const range = timeRanges[id];
              const chartData =
                range === "oneDay" ? paramData.oneDay : paramData.sevenDay;

              return (
                <View
                  key={id}
                  onLayout={(e) => {
                    sectionPositions.current[id] = e.nativeEvent.layout.y;
                  }}
                  className="mb-8"
                >
                  <View className="flex-row items-center justify-between mb-3">
                    <Text className="text-lg text-primary font-poppins-bold">
                      {metadata.label}
                    </Text>
                    <View className="flex-row gap-x-2">
                      <PressableScale
                        onPress={() =>
                          setTimeRanges((prev) => ({ ...prev, [id]: "oneDay" }))
                        }
                      >
                        <Text
                          className={`px-2.5 py-0.5 rounded-sm text-md font-poppins-bold ${range === "oneDay" ? "bg-primary text-white" : "bg-white text-primary"}`}
                        >
                          1D
                        </Text>
                      </PressableScale>
                      <PressableScale
                        onPress={() =>
                          setTimeRanges((prev) => ({
                            ...prev,
                            [id]: "sevenDay",
                          }))
                        }
                      >
                        <Text
                          className={`px-2.5 py-0.5 rounded-sm text-md font-poppins-bold ${range === "sevenDay" ? "bg-primary text-white" : "bg-white text-primary"}`}
                        >
                          7D
                        </Text>
                      </PressableScale>
                    </View>
                  </View>
                  <View className="bg-white rounded-sm p-2 overflow-hidden">
                    <LineChart
                      data={chartData}
                      color={config.color}
                      thickness={2.5}
                      curved
                      maxValue={config.yAxisMax}
                      yAxisOffset={config.yAxisMin}
                      noOfSections={5}
                      spacing={60}
                      hideDataPoints={range === "oneDay"}
                      dataPointsRadius={4}
                      dataPointsColor={config.color}
                      height={220}
                      width={chartWidth}
                      rulesColor="rgba(0,0,0,0.06)"
                      showVerticalLines={false}
                      xAxisLabelTextStyle={{
                        color: colors.muted,
                        fontFamily: "Poppins-Regular",
                        fontSize: 8,
                      }}
                      xAxisLength={chartWidth}
                      yAxisTextStyle={{
                        color: colors.muted,
                        fontFamily: "Poppins-Medium",
                        fontSize: 10,
                      }}
                      roundToDigits={2}
                      nestedScrollEnabled={true}
                    />
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Graphs;
