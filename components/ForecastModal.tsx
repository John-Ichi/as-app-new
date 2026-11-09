import PressableScale from "@/components/PressableScale";
import { icons } from "@/constants/icons";
import { colors } from "@/constants/theme";
import dayjs from "dayjs";
import { styled } from "nativewind";
import { Image, Modal, ScrollView, Text, View } from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

const SafeAreaView = styled(RNSafeAreaView);

interface Props {
  visible: boolean;
  onClose: () => void;
}

const ForecastModal = ({ visible, onClose }: Props) => {
  const HOUR_MS = 60 * 60 * 1000;
  const nextHourStart = Math.floor((Date.now() + HOUR_MS) / HOUR_MS) * HOUR_MS;
  const slots = Array.from(
    { length: 24 },
    (_, i) => nextHourStart + i * HOUR_MS,
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 w-full max-w-xl mx-auto">
          <View className="flex-row items-center justify-between p-4">
            <Text className="text-lg text-primary font-poppins-bold">
              24-HR AMMONIA FORECAST
            </Text>
            <PressableScale
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close"
              style={{ borderRadius: 20, paddingLeft: 8, paddingRight: 8 }}
              pressedStyle={{ backgroundColor: colors.pressed }}
              hitSlop={10}
            >
              <Text className="text-xl text-muted font-poppins-light">
                {"\u00D7"}
              </Text>
            </PressableScale>
          </View>
          <ScrollView contentContainerClassName="pb-10">
            <View className="gap-y-4 px-4">
              {slots.map((time, index) => (
                <View
                  key={index}
                  className="flex-row items-center bg-white rounded-sm px-4 py-3 gap-x-3"
                >
                  <Image
                    source={icons.ammonia}
                    style={{ width: 24, height: 24 }}
                  />
                  <Text className="flex-1 text-md text-muted font-poppins-light">
                    ---- ppm
                  </Text>
                  <Text className="text-md text-primary font-poppins-bold">
                    {dayjs(time).format("h:00 A")}
                  </Text>
                </View>
              ))}
            </View>
          </ScrollView>
          <Text className="text-sm text-muted text-center font-poppins-light py-4">
            Forecast coming soon
          </Text>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

export default ForecastModal;
