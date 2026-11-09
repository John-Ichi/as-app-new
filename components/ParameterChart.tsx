import PressableScale from "@/components/PressableScale";
import { type GraphRangeId } from "@/constants/graphs";
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
  threshold?: number;
  chartWidth: number;
  range: GraphRangeId;
  onRangeChange: (id: ParameterId, range: GraphRangeId) => void;
  onLayout?: (y: number) => void;
}

const ParameterChart = ({
  id,
  data,
  label,
  color,
  yAxisMin,
  yAxisMax,
  threshold,
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
      hideDataPoints={range !== "oneYear"}
      dataPointsRadius={4}
      dataPointsColor={color}
      {...(threshold != null
        ? {
            showReferenceLine1: true,
            referenceLine1Position: threshold,
            referenceLine1Config: {
              color: colors.danger,
              thickness: 1,
              type: "dashed",
              dashWidth: 6,
              dashGap: 4,
            },
          }
        : {})}
      height={220}
      width={needsScroll ? contentWidth : containerWidth || chartWidth}
      rulesColor="transparent"
      showVerticalLines={true}
      verticalLinesColor="rgba(0,0,0,0.06)"
      verticalLinesThickness={1}
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
          {(
            [
              { id: "oneDay", label: "1D" },
              { id: "oneMonth", label: "M" },
              { id: "oneYear", label: "Y" },
            ] as { id: GraphRangeId; label: string }[]
          ).map((chip) => (
            <PressableScale
              key={chip.id}
              onPress={() => onRangeChange(id, chip.id)}
            >
              <Text
                className={`text-md font-poppins-bold rounded-sm px-2.5 py-0.5 ${
                  range === chip.id
                    ? "bg-primary text-white"
                    : "bg-white text-primary"
                }`}
              >
                {chip.label}
              </Text>
            </PressableScale>
          ))}
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
