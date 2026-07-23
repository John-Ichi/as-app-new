import PressableScale from "@/components/PressableScale";
import type { ParameterId } from "@/constants/parameters";
import { colors, fonts } from "@/constants/theme";
import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { LineChart } from "react-native-gifted-charts";

interface ParameterChartProps {
  id: ParameterId;
  data: { value: number; label?: string }[];
  label: string;
  color: string;
  yAxisMin: number;
  yAxisMax: number;
  chartWidth: number;
  range: "oneDay" | "sevenDay";
  onRangeChange: (id: ParameterId, range: "oneDay" | "sevenDay") => void;
  onLayout?: (y: number) => void;
}

const ParameterChart = ({
  id,
  data,
  label,
  color,
  yAxisMin,
  yAxisMax,
  chartWidth,
  range,
  onRangeChange,
  onLayout,
}: ParameterChartProps) => {
  const contentWidth = data.length * 60;
  const [containerWidth, setContainerWidth] = useState(chartWidth);
  const needsScroll = containerWidth > 0 && contentWidth > containerWidth;

  const chart = (
    <LineChart
      data={data}
      color={color}
      thickness={2.5}
      curved
      maxValue={yAxisMax}
      yAxisOffset={yAxisMin}
      noOfSections={5}
      spacing={60}
      hideDataPoints={range === "oneDay"}
      dataPointsRadius={4}
      dataPointsColor={color}
      height={220}
      width={needsScroll ? contentWidth : containerWidth || chartWidth}
      rulesColor="rgba(0,0,0,0.06)"
      showVerticalLines={false}
      xAxisLabelTextStyle={{
        color: colors.muted,
        fontFamily: fonts.regular,
        fontSize: 8,
      }}
      xAxisLength={needsScroll ? contentWidth : containerWidth || chartWidth}
      yAxisTextStyle={{
        color: colors.muted,
        fontFamily: fonts.medium,
        fontSize: 10,
      }}
      roundToDigits={2}
    />
  );

  return (
    <View
      onLayout={(e) => {
        setContainerWidth(e.nativeEvent.layout.width);
        onLayout?.(e.nativeEvent.layout.y);
      }}
      className="mb-8"
    >
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-lg text-primary font-poppins-bold">{label}</Text>
        <View className="flex-row gap-x-2">
          <PressableScale onPress={() => onRangeChange(id, "oneDay")}>
            <Text
              className={`text-md font-poppins-bold rounded-sm px-2.5 py-0.5 ${range === "oneDay" ? "bg-primary text-white" : "bg-white text-primary"}`}
            >
              1D
            </Text>
          </PressableScale>
          <PressableScale onPress={() => onRangeChange(id, "sevenDay")}>
            <Text
              className={`text-md font-poppins-bold rounded-sm px-2.5 py-0.5 ${range === "sevenDay" ? "bg-primary text-white" : "bg-white text-primary"}`}
            >
              7D
            </Text>
          </PressableScale>
        </View>
      </View>
      <ScrollView
        key={range}
        horizontal
        nestedScrollEnabled
        showsHorizontalScrollIndicator={needsScroll}
        className="bg-white rounded-sm p-2"
      >
        {chart}
      </ScrollView>
    </View>
  );
};

export default ParameterChart;
