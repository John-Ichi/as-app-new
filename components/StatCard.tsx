import { Text, View } from "react-native";

interface StatCardProps {
  label: string;
  value: string;
  subLabel?: string;
  textColor?: string;
  subLabelClassName?: string;
  bgColor?: string;
}

const StatCard = ({
  label,
  value,
  subLabel,
  textColor = "text-primary",
  subLabelClassName = "text-md text-muted font-poppins-regular",
  bgColor = "bg-white",
}: StatCardProps) => (
  <View
    className={`w-[31%] ${bgColor} rounded-t-bg shadow-md shadow-slate-400/30 items-center p-2`}
  >
    <Text className={`text-md text-primary font-poppins-semibold`}>
      {label}
    </Text>
    <Text className={`text-lg ${textColor} font-poppins-bold`}>{value}</Text>
    {subLabel && <Text className={subLabelClassName}>{subLabel}</Text>}
  </View>
);

export default StatCard;
