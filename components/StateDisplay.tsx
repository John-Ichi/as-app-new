import PressableScale from "@/components/PressableScale";
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
  onRetry?: () => void;
  onAction?: () => void;
  actionLabel?: string;
}

const errorStateButtonStyle = "bg-primary rounded-bg px-12 py-2";

export const ErrorState = ({
  title = "Failed to load data.",
  message,
  onRetry,
  onAction,
  actionLabel,
}: ErrorStateProps) => (
  <SafeAreaView edges={["bottom"]} className="flex-1 bg-background">
    <View className="flex-1 items-center justify-center">
      <Text className="text-lg text-danger font-poppins-bold">{title}</Text>
      {message && (
        <Text className="text-md text-muted font-poppins-regular">
          {message}
        </Text>
      )}
    </View>

    {onRetry || onAction ? (
      <View className="items-center pb-8">
        {onRetry && (
          <PressableScale
            onPress={onRetry}
            accessibilityRole="button"
            accessibilityLabel="Try again"
          >
            <Text className="text-md text-white font-poppins-medium">
              Try Again
            </Text>
          </PressableScale>
        )}

        {onAction && (
          <PressableScale
            onPress={onAction}
            className={errorStateButtonStyle}
            accessibilityRole="button"
            accessibilityLabel={actionLabel}
          >
            <Text className="text-md text-white font-poppins-semibold">
              {actionLabel ?? "Go Back"}
            </Text>
          </PressableScale>
        )}
      </View>
    ) : null}
  </SafeAreaView>
);
