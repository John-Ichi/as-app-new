import { parameterMap, type ParameterId } from "@/constants/parameters";
import { Image, Text, View } from "react-native";

interface ParameterCardProps {
  id: ParameterId;
  value: number;
  className?: string;
}

const ParameterCard = ({ id, value, className = "" }: ParameterCardProps) => {
  const metadata = parameterMap[id];
  const width = metadata.fullWidth;
  const baseClasses =
    "bg-white rounded-sm shadow-md shadow-slate-400/30 justify-between p-4";
  const layoutClasses = width ? "w-full flex-row items-center" : "w-[48%]";

  return (
    <View className={`${layoutClasses} ${baseClasses} ${className} gap-y-4`}>
      <View className="flex-row gap-x-2 items-center">
        <Image source={metadata.icon} className="size-6" />
        <Text
          className={`${width ? "tracking-wide py-6" : ""} text-md text-primary font-poppins-bold`}
        >
          {metadata.label}
        </Text>
      </View>
      <Text className="text-lg text-primary font-poppins-bold">
        {value} {metadata.unit}
      </Text>
    </View>
  );
};

export default ParameterCard;
