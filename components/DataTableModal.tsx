import DataTable from "@/components/DataTable";
import PressableScale from "@/components/PressableScale";
import { graphConfig } from "@/constants/graphs";
import { parameterIds } from "@/constants/parameters";
import { colors } from "@/constants/theme";
import { generateHalfHourData } from "@/hooks/useGraphData";
import { styled } from "nativewind";
import { Modal, Text, View, useWindowDimensions } from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";
const SafeAreaView = styled(RNSafeAreaView);

interface Props {
  visible: boolean;
  onClose: () => void;
}

const DataTableModal = ({ visible, onClose }: Props) => {
  const { width: screenWidth } = useWindowDimensions();
  const colCount = 1 + parameterIds.length;
  const naturalWidth = Math.floor((screenWidth - 32) / colCount);
  const colWidth = Math.max(Math.min(naturalWidth, 90), 75);

  const allData = parameterIds.map((id) => ({
    id,
    points: generateHalfHourData(id),
  }));

  const columns = parameterIds.map((id) => graphConfig[id].shortLabel);
  const rows = Array.from({ length: 48 }, (_, i) => ({
    label: allData[0].points[i].label ?? "",
    values: allData.map(({ id, points }) => points[i].value.toFixed(2)),
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
          >
            <Text className="text-xl text-muted font-poppins-regular">
              {"\u00D7"}
            </Text>
          </PressableScale>
        </View>
        <View className="flex-1 w-full max-w-xl mx-auto px-4 pb-10">
          <DataTable
            columns={columns}
            rows={rows}
            colWidth={colWidth}
            nestedScroll
          />
        </View>
      </SafeAreaView>
    </Modal>
  );
};

export default DataTableModal;
