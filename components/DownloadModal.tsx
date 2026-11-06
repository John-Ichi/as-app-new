import PressableScale from "@/components/PressableScale";
import {
  downloadRanges,
  type DownloadRangeId,
} from "@/constants/downloadRanges";
import { icons } from "@/constants/icons";
import { colors } from "@/constants/theme";
import { useDownloadData } from "@/hooks/useDownloadData";
import dayjs from "dayjs";
import { styled } from "nativewind";
import { useState } from "react";
import { ActivityIndicator, Image, Modal, Text, View } from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

const SafeAreaView = styled(RNSafeAreaView);

interface Props {
  visible: boolean;
  onClose: () => void;
}

const DownloadModal = ({ visible, onClose }: Props) => {
  const { download, isDownloading, error } = useDownloadData();
  const [activeRange, setActiveRange] = useState<DownloadRangeId | null>(null);
  const handleDownload = async (rangeId: DownloadRangeId) => {
    if (isDownloading) return;
    setActiveRange(rangeId);
    await download(rangeId);
    setActiveRange(null);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView className="flex-1 bg-background">
        <View className="w-full max-w-xl mx-auto">
          <View className="flex-row items-center justify-between p-4">
            <Text className="text-lg text-primary font-poppins-bold">
              DOWNLOAD DATA SET
            </Text>
            <PressableScale
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close"
              style={{ borderRadius: 20, paddingLeft: 8, paddingRight: 8 }}
              pressedStyle={{ backgroundColor: colors.pressed }}
              hitSlop={10}
            >
              <Text className="text-xl text-muted font-poppins-regular">
                {"\u00D7"}
              </Text>
            </PressableScale>
          </View>
          <View className="p-4">
            <View className="gap-y-4">
              {downloadRanges.map((range) => {
                const isActive = activeRange === range.id && isDownloading;
                return (
                  <PressableScale
                    key={range.id}
                    disabled={isDownloading}
                    onPress={() => handleDownload(range.id)}
                    accessibilityRole="button"
                    accessibilityLabel={`Download ${range.label} data`}
                  >
                    <View className="flex-row items-center justify-between bg-white rounded-lg shadow-md shadow-slate-400/30 p-4">
                      <View>
                        <Text className="text-lg text-primary font-poppins-bold">
                          {range.label.toUpperCase()}
                        </Text>
                        <Text className="text-md text-muted font-poppins-regular">
                          {dayjs()
                            .subtract(range.days, "day")
                            .format("MMM D, YYYY")}
                          {" \u2013 "}
                          {dayjs().format("MMM D, YYYY")}
                        </Text>
                      </View>
                      {isActive ? (
                        <ActivityIndicator
                          size="small"
                          color={colors.primary}
                        />
                      ) : (
                        <Image
                          source={icons.download}
                          style={{
                            tintColor: colors.primary,
                            width: 20,
                            height: 20,
                          }}
                        />
                      )}
                    </View>
                  </PressableScale>
                );
              })}
            </View>
            {error ? (
              <Text className="text-sm text-danger font-poppins-regular text-center mt-4">
                {error.message}
              </Text>
            ) : null}
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

export default DownloadModal;
