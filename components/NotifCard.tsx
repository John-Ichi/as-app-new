import PressableScale from "@/components/PressableScale";
import { colors } from "@/constants/theme";
import Ionicons from "@expo/vector-icons/Ionicons";
import { memo } from "react";
import { Text, View } from "react-native";

interface NotifCardProps {
  id: string;
  date: string;
  title: string;
  value: number;
  read: boolean;
  onToggleRead: (id: string, read: boolean) => void;
  deleting: boolean;
  onDelete: (id: string) => void;
}

const NotifCard = ({
  id,
  date,
  title,
  value,
  read,
  onToggleRead,
  deleting,
  onDelete,
}: NotifCardProps) => (
  <PressableScale
    onPress={() => (deleting ? onDelete(id) : onToggleRead(id, !read))}
    accessibilityRole="button"
    accessibilityLabel={`${title}, ${date}, NH₃: ${value}`}
    accessibilityHint={
      deleting
        ? "Delete this notification"
        : read
          ? "Mark as unread"
          : "Mark as read"
    }
    accessibilityState={{ selected: read }}
  >
    <View
      className={`${read ? "bg-muted-light" : "bg-white"} flex-row items-center rounded-xl p-4 gap-x-4`}
    >
      <Ionicons
        name="notifications-circle-outline"
        size={48}
        color={colors.primary}
      />
      <View className="flex-1">
        <Text className="text-md text-muted font-poppins-light">{date}</Text>
        <Text className="text-lg text-primary font-poppins-bold">{title}</Text>
        <Text
          className="text-lg text-primary font-poppins-light"
          style={{ lineHeight: 18 }}
        >
          NH₃: {value}
        </Text>
      </View>
      {deleting ? (
        <Ionicons name="trash" size={24} color={colors.danger} />
      ) : (
        <Ionicons
          name={read ? "mail-open" : "mail"}
          size={24}
          color={colors.primary}
        />
      )}
    </View>
  </PressableScale>
);

export default memo(NotifCard);
