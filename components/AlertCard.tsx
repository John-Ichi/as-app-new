import PressableScale from "@/components/PressableScale";
import { icons } from "@/constants/icons";
import { Image, Text, View } from "react-native";
import { useState } from "react";

interface AlertCardProps {
  type: "critical" | "warning";
  title: string;
  date: string;
  read: boolean;
  onAcknowledge?: () => void;
}

const iconMap = {
  critical: icons.criticalAlert,
  warning: icons.warningAlert,
} as const;
const bgMap = {
  critical: "bg-danger-light",
  warning: "bg-warning-light",
} as const;
const buttonBgMap = { critical: "bg-danger", warning: "bg-warning" } as const;

const AlertCard = ({ type, title, date, read, onAcknowledge }: AlertCardProps) => {
  const [acknowledged, setAcknowledged] = useState(read);

  return (
    <View
      className={`flex-row ${acknowledged ? "bg-muted-light" : bgMap[type]} rounded-bg shadow-md shadow-slate-400/30 items-start p-4`}
    >
      <Image source={iconMap[type]} style={{ width: 40, height: 40 }} />
      <View className="flex-1 ml-2 gap-y-1">
        <Text className="text-lg text-primary font-poppins-bold">{title}</Text>
        <Text className="text-md text-primary font-poppins-medium pb-1">
          {date}
        </Text>
        <PressableScale
          disabled={acknowledged}
          onPress={() => {
            if (acknowledged) return;
            setAcknowledged(true);
            onAcknowledge?.();
          }}
        >
          <Text
            className={`text-md text-center text-white font-poppins-semibold p-2 ${acknowledged ? "bg-muted" : buttonBgMap[type]} rounded-md shadow-md shadow-slate-400/30`}
          >
            {acknowledged ? "ACKNOWLEDGED" : "ACKNOWLEDGE"}
          </Text>
        </PressableScale>
      </View>
    </View>
  );
};

export default AlertCard;
