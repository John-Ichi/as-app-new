import DataTable from "@/components/DataTable";
import PressableScale from "@/components/PressableScale";
import { graphConfig } from "@/constants/graphs";
import { ParameterId, parameterIds } from "@/constants/parameters";
import { colors } from "@/constants/theme";
import { useDevice } from "@/contexts/DeviceContext";
import { getAllHalfHourData } from "@/services/firebase/graphs";
import type { GraphDataPoint } from "@/services/types";
import { styled } from "nativewind";
import { useEffect, useState } from "react";
import { Modal, Text, View, useWindowDimensions } from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

const SafeAreaView = styled(RNSafeAreaView);

interface Props {
  visible: boolean;
  onClose: () => void;
}

const DataTableModal = ({ visible, onClose }: Props) => {
  const { width: screenWidth } = useWindowDimensions();
  const { selectedDevice } = useDevice();
  const [allData, setAllData] = useState<
    { id: ParameterId; points: GraphDataPoint[] }[]
  >([]);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!selectedDevice || !visible) return;
    const deviceId = selectedDevice.id;
    let cancelled = false;
    setAllData([]);
    setError(null);
    async function fetchData() {
      try {
        const results = await getAllHalfHourData(deviceId);
        if (!cancelled) setAllData(results);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err : new Error("Failed to load data."),
          );
        }
      }
    }
    fetchData();
    return () => {
      cancelled = true;
    };
  }, [selectedDevice, visible]);

  const colCount = 1 + parameterIds.length;
  const naturalWidth = Math.floor((screenWidth - 32) / colCount);
  const colWidth = Math.max(Math.min(naturalWidth, 90), 75);

  const columns = parameterIds.map((id) => graphConfig[id].shortLabel);
  const rows = Array.from({ length: 48 }, (_, i) => ({
    label: allData[0]?.points[i]?.label ?? "",
    values: allData.map(({ points }) => points[i]?.value?.toFixed(2) ?? "-"),
  }));

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-row items-center justify-between px-4 py-3">
          <Text className="text-lg text-primary font-poppins-bold">
            GATHERED DATA
          </Text>
          <PressableScale
            onPress={onClose}
            style={{ borderRadius: 20, paddingLeft: 8, paddingRight: 8 }}
            pressedStyle={{ backgroundColor: colors.pressed }}
            accessibilityLabel="Close"
            accessibilityRole="button"
            hitSlop={10}
          >
            <Text className="text-xl text-muted font-poppins-regular">
              {"\u00D7"}
            </Text>
          </PressableScale>
        </View>
        <View className="flex-1 w-full max-w-xl mx-auto px-4 pb-10">
          {error ? (
            <Text className="text-lg text-danger font-poppins-bold text-center">
              {error.message}
            </Text>
          ) : (
            <DataTable
              columns={columns}
              rows={rows}
              colWidth={colWidth}
              nestedScroll
            />
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
};

export default DataTableModal;
