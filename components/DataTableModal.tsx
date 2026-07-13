import { graphConfig } from "@/constants/graphs";
import { parameterIds } from "@/constants/parameters";
import { generateHalfHourData } from "@/hooks/useGraphData";
import { styled } from "nativewind";
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
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
          <Pressable
            onPress={onClose}
            style={({ pressed }) =>
              pressed ? { transform: [{ scale: 0.97 }] } : {}
            }
          >
            <Text className="text-xl text-muted font-poppins-regular">
              {"\u00D7"}
            </Text>
          </Pressable>
        </View>
        <View className="flex-1 w-full max-w-xl mx-auto px-4 pb-10">
          <ScrollView horizontal>
            <View className="border border-border rounded-sm overflow-hidden">
              <View className="flex-row bg-primary">
                <Text
                  style={{ width: colWidth }}
                  className="text-sm text-center text-white font-poppins-bold py-2"
                >
                  Time
                </Text>
                {allData.map(({ id }) => (
                  <Text
                    key={id}
                    style={{ width: colWidth }}
                    className="text-sm text-center text-white font-poppins-bold py-2"
                  >
                    {graphConfig[id].shortLabel}
                  </Text>
                ))}
              </View>
              <ScrollView>
                {Array.from({ length: 48 }, (_, i) => {
                  const label = allData[0].points[i].label;
                  return (
                    <View
                      key={i}
                      className={`flex-row ${i % 2 === 0 ? "bg-white" : "bg-background"} border-b border-border`}
                    >
                      <Text
                        style={{ width: colWidth }}
                        className="text-sm text-center text-primary font-poppins-bold py-2.5"
                      >
                        {label}
                      </Text>
                      {allData.map(({ id, points }) => (
                        <Text
                          key={id}
                          style={{ width: colWidth }}
                          className="text-sm text-center text-primary font-poppins-regular py-2.5"
                        >
                          {points[i].value.toFixed(2)}
                        </Text>
                      ))}
                    </View>
                  );
                })}
              </ScrollView>
            </View>
          </ScrollView>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

export default DataTableModal;
