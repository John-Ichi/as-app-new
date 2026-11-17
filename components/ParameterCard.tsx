import { parameterMap, type ParameterId } from "@/constants/parameters";
import { Image, Text, View } from "react-native";

interface ParameterCardProps {
  id: ParameterId;
  value: number;
}

const ParameterCard = ({ id, value }: ParameterCardProps) => {
  const metadata = parameterMap[id];
  if (!metadata) return null;

  const decimals = id === "ammonia" ? 4 : 2;
  const display =
    typeof value === "number" && !Number.isNaN(value)
      ? value.toFixed(decimals)
      : String(value);

  return (
    <View className="w-[48%] bg-white rounded-sm shadow-md shadow-slate-400/30 justify-between p-4 gap-y-4">
      <View className="flex-row gap-x-2 items-center">
        <Image source={metadata.icon} style={{ width: 24, height: 24 }} />
        <Text className={`text-md text-primary font-poppins-bold`}>
          {metadata.label}
        </Text>
      </View>
      <Text className="text-lg text-primary font-poppins-bold">
        {display} {metadata.unit}
      </Text>
    </View>
  );
};

export default ParameterCard;
