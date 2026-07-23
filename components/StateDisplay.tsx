import { Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface LoadingStateProps {
  message?: string;
}

export const LoadingState = ({ message = "Loading..." }: LoadingStateProps) => (
  <SafeAreaView
    edges={["bottom"]}
    className="flex-1 bg-background items-center justify-center"
  >
    <Text className="text-lg text-muted font-poppins-regular">{message}</Text>
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
