import { styled } from "nativewind";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

const SafeAreaView = styled(RNSafeAreaView);

const Notifications = () => {
  return (
    <SafeAreaView
      edges={["bottom"]}
      className="flex-1 items-center justify-center bg-background"
    >
      <ScrollView>
        <View>
          <Text>Test for pull request.</Text>
          <Text>Added for testing.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Notifications;
