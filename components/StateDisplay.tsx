import { colors } from "@/constants/theme";
import { styled } from "nativewind";
import { ActivityIndicator, Text, View } from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

const SafeAreaView = styled(RNSafeAreaView);

export const LoadingState = () => (
  <SafeAreaView
    edges={["bottom"]}
    className="flex-1 bg-background items-center justify-center"
  >
    <View className="flex-1 items-center justify-center">
      <ActivityIndicator
        size="large"
        color={colors.primary}
        accessibilityLabel="Loading"
      />
    </View>
  </SafeAreaView>
);

interface ErrorStateProps {
  title?: string;
  message?: string;
}

export const ErrorState = ({
  title = "Failed to load data.",
  message,
}: ErrorStateProps) => (
  <SafeAreaView
    edges={["bottom"]}
    className="flex-1 bg-background items-center justify-center"
  >
    <Text className="text-lg text-danger font-poppins-bold">{title}</Text>
    {message && (
      <Text className="text-md text-muted font-poppins-regular">{message}</Text>
    )}
  </SafeAreaView>
);
