import AlertCard from "@/components/AlertCard";
import { ErrorState, LoadingState } from "@/components/StateDisplay";
import { useDevice } from "@/contexts/DeviceContext";
import { useNotifications } from "@/hooks/useNotifications";
import { Redirect } from "expo-router";
import { styled } from "nativewind";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

const SafeAreaView = styled(RNSafeAreaView);

const Notifications = () => {
  const { selectedDevice } = useDevice();
  const { data: notifications, isLoading, error } = useNotifications();

  if (!selectedDevice) return <Redirect href="/onboarding" />;
  if (error) return <ErrorState message={error.message} />;
  if (isLoading) return <LoadingState />;
  if (notifications.length === 0)
    return <ErrorState title="No data available." />;

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

        <ScrollView
          className="flex-1 bg-background"
          contentContainerClassName="pb-10"
        >
          <View className="flex-col bg-background p-6 gap-y-6">
            {notifications.map((n) => (
              <AlertCard
                key={n.id}
                type={n.type}
                title={n.title}
                date={n.date}
              />
            ))}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default Notifications;
