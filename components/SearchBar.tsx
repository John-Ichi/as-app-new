import { colors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { TextInput, View } from "react-native";

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onSubmitEditing?: () => void;
  placeholder?: string;
  className?: string;
}

const SearchBar = ({
  value,
  onChangeText,
  onSubmitEditing,
  placeholder = "Search location...",
  className = "",
}: SearchBarProps) => {
  return (
    <View
      className={`w-full flex-row items-center gap-x-2 bg-white rounded-sm px-4 py-2 ${className}`}
    >
      <Ionicons name="search" size={18} color={colors.primary} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmitEditing}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        returnKeyType="search"
        className="flex-1 text-md text-primary font-poppins-regular"
        accessibilityLabel={placeholder}
      />
    </View>
  );
};

export default SearchBar;
