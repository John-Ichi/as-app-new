import { icons } from "@/constants/icons";
import { styled } from "nativewind";
import { Image, Text, View } from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

const SafeAreaView = styled(RNSafeAreaView);

{
  /** update all values dynamically */
}

const Dashboard = () => {
  return (
    <SafeAreaView edges={["bottom"]} className="flex-1 bg-background">
      <View className="bg-primary h-16 rounded-b-xl"></View>
      <View className="px-4">
        {/** update background color dynamically */}
        <View className="-mt-14 mx-12 py-4 bg-success rounded-xl shadow-md shadow-slate-400/30 items-center justify-center">
          <Text className="text-lg text-white font-poppins-medium">
            OVERALL AMMONIA STATUS
          </Text>
          <Text className="text-xl text-white font-poppins-bold">
            NORMAL{/** update value dynamically */}
          </Text>
        </View>
        <View className="mt-6 flex-row flex-wrap justify-between gap-y-5">
          <View className="w-[48%] h-28 bg-white rounded-sm p-4 shadow-sm shadow-slate-400/30 justify-between">
            <View className="flex-row items-center gap-x-2">
              <Image
                source={icons.ammonia}
                className="w-6 h-6"
                resizeMode="contain"
              />
              <Text className="text-md text-primary font-poppins-bold">
                AMMONIA
              </Text>
            </View>
            <Text className="text-lg text-primary font-poppins-bold">
              value ppm
            </Text>
          </View>
          <View className="w-[48%] h-28 bg-white rounded-sm p-4 shadow-sm shadow-slate-400/30 justify-between">
            <View className="flex-row items-center gap-x-2">
              <Image
                source={icons.temperature}
                className="w-6 h-6"
                resizeMode="contain"
              />
              <Text className="text-md text-primary font-poppins-bold">
                TEMP
              </Text>
            </View>
            <Text className="text-lg text-primary font-poppins-bold">
              value C
            </Text>
          </View>
          <View className="w-[48%] h-28 bg-white rounded-sm p-4 shadow-sm shadow-slate-400/30 justify-between">
            <View className="flex-row items-center gap-x-2">
              <Image
                source={icons.dissolvedOxygen}
                className="w-6 h-6"
                resizeMode="contain"
              />
              <Text className="text-md text-primary font-poppins-bold">DO</Text>
            </View>
            <Text className="text-lg text-primary font-poppins-bold">
              value mg/L
            </Text>
          </View>
          <View className="w-[48%] h-28 bg-white rounded-sm p-4 shadow-sm shadow-slate-400/30 justify-between">
            <View className="flex-row items-center gap-x-2">
              <Image
                source={icons.pH}
                className="w-6 h-6"
                resizeMode="contain"
              />
              <Text className="text-md text-primary font-poppins-bold">
                pH LEVEL
              </Text>
            </View>
            <Text className="text-lg text-primary font-poppins-bold">
              value
            </Text>
          </View>
          <View className="w-full h-28 bg-white rounded-sm p-4 shadow-sm shadow-slate-400/30 justify-between">
            <View className="flex-row gap-x-2 items-center justify-center">
              <Image
                source={icons.turbidity}
                className="w-6 h-6"
                resizeMode="contain"
              />
              <Text className="text-md text-primary font-poppins-bold">
                TURBIDITY
              </Text>
            </View>
            <View className="items-center">
              <Text className="text-lg text-primary font-poppins-bold">
                value NTU
              </Text>
            </View>
          </View>
          <View className="w-full h-28 flex-row bg-white rounded-sm p-4 shadow-sm shadow-slate-400/30 items-center justify-around">
            <View>
              <Image source={icons.warning} />
            </View>
            <View>
              <Text className="text-lg text-primary font-poppins-bold">
                PREDICTIVE ALERT
              </Text>
              <Text className="text-md text-primary font-poppins-regular">
                Risk: <Text className="text-success">VALUE</Text> (time)
              </Text>
            </View>
            <View>
              <Text className="text-lg text-primary font-poppins-regular">
                &gt;
              </Text>
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default Dashboard;
