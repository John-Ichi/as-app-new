import "@/global.css";
import { styled } from "nativewind";
import { Text } from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

const SafeAreaView = styled(RNSafeAreaView);

const Graphs = () => {
  return (
    <SafeAreaView
      edges={["bottom"]}
      className="flex-1 items-center justify-center bg-background"
    >
      <Text>Graphs</Text>
    </SafeAreaView>
  );
};

export default Graphs;
