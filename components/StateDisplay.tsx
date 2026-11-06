import PressableScale from "@/components/PressableScale";
import { colors } from "@/constants/theme";
import { styled } from "nativewind";
import { ActivityIndicator, Text, View } from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

const SafeAreaView = styled(RNSafeAreaView);

interface EmptyStateProps {
  title: string;
  message: string;
  action?: { label: string; onPress: () => void };
}

interface ErrorStateProps {
  error: Error;
  action?: { label: string; onPress: () => void };
}

export const LoadingState = () => (
  <SafeAreaView
    edges={["top", "bottom"]}
    className="flex-1 bg-background items-center justify-center"
  >
    <ActivityIndicator
      size="large"
      color={colors.primary}
      accessibilityLabel="Loading"
    />
  </SafeAreaView>
);

export const EmptyState = ({ title, message, action }: EmptyStateProps) => (
  <SafeAreaView edges={["top", "bottom"]} className="flex-1 bg-background">
    <View className="flex-1 items-center justify-center">
      <Text className="text-xl text-primary font-poppins-bold">{title}</Text>
      <Text className="text-lg text-muted font-poppins-light">{message}</Text>
    </View>
    {action ? (
      <View className="items-center pb-18">
        <PressableScale
          onPress={action.onPress}
          accessibilityRole="button"
          accessibilityLabel={action.label}
        >
          <Text className="text-lg text-white text-center font-poppins-semibold bg-primary rounded-xl p-4 px-8">
            {action.label}
          </Text>
        </PressableScale>
      </View>
    ) : null}
  </SafeAreaView>
);

export const ErrorState = ({ error, action }: ErrorStateProps) => (
  <SafeAreaView edges={["top", "bottom"]} className="flex-1 bg-background">
    <View className="flex-1 items-center justify-center">
      <Text className="text-xl text-danger font-poppins-bold">Error</Text>
      <Text className="text-lg text-muted font-poppins-light">
        {error.message}
      </Text>
    </View>
    {action ? (
      <View className="items-center pb-18">
        <PressableScale
          onPress={action.onPress}
          accessibilityRole="button"
          accessibilityLabel={action.label}
        >
          <Text className="text-lg text-white text-center font-poppins-semibold bg-primary rounded-xl p-4 px-8">
            {action.label}
          </Text>
        </PressableScale>
      </View>
    ) : null}
  </SafeAreaView>
);
