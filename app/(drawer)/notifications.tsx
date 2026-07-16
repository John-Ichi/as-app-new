import PressableScale from "@/components/PressableScale";
import { icons } from "@/constants/icons";
import { styled } from "nativewind";
import { Image, ScrollView, Text, View } from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

const SafeAreaView = styled(RNSafeAreaView);

const Notifications = () => {
  return (
    <SafeAreaView edges={["bottom"]} className="flex-1 bg-primary">
      <View className="w-full max-w-xl flex-1 mx-auto">
        <View className="shadow-md shadow-slate-400/30 z-10">
          <View className="rounded-t-xl bg-primary-faded">
            <Text className="text-xl text-center text-white font-poppins-semibold p-6">
              CRITICAL ALERTS
            </Text>
          </View>
        </View>

        <ScrollView className="bg-background" contentContainerClassName="pb-10">
          <View className="flex-col bg-background p-6 gap-y-6">
            <View className="flex-row bg-danger-light rounded-bg shadow-md shadow-slate-400/30 items-start p-4">
              <Image source={icons.criticalAlert} className="size-10" />
              <View className="flex-1 ml-2">
                <Text className="text-lg text-primary font-poppins-bold">
                  AMMONIA SPIKE
                </Text>
                <Text className="text-md text-primary font-poppins-medium">
                  May 16, 2026 10:00 PM
                </Text>
                <PressableScale
                  onPress={() => {
                    /** replace later to acknowledge notification */
                  }}
                >
                  <Text className="flex-1 bg-danger rounded-sm shadow-md shadow-slate-400/30 text-md text-center text-white font-poppins-semibold p-2">
                    ACKNOWLEDGE
                  </Text>
                </PressableScale>
              </View>
            </View>
            <View className="flex-row bg-warning-light rounded-bg shadow-md shadow-slate-400/30 items-start p-4">
              <Image source={icons.warningAlert} className="size-10" />
              <View className="flex-1 ml-2">
                <Text className="text-lg text-primary font-poppins-bold">
                  TEMP FLUCTUATONS
                </Text>
                <Text className="text-md text-primary font-poppins-medium">
                  May 07, 2026 9:43 AM
                </Text>
                <PressableScale
                  onPress={() => {
                    /** replace later to acknowledge notification */
                  }}
                >
                  <Text className="flex-1 bg-warning rounded-sm shadow-md shadow-slate-400/30 text-md text-center text-white font-poppins-semibold p-2">
                    ACKNOWLEDGE
                  </Text>
                </PressableScale>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default Notifications;
