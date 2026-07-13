import { styled } from "nativewind";
import { Pressable, ScrollView, Text, View } from "react-native";
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
          <Text>Quick test for pr-agent.</Text>
          <Pressable onPress={() => {}}>
            <Text>Press me.</Text>
            <Text>OLLAMA placeholder key added.</Text>
          </Pressable>
          <Pressable>
            <Text>Another pressable test.</Text>
            {/** added a comment for pr-agent test */}
            <Text>Test pull request.</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Notifications;
