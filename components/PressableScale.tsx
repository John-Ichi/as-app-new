import { useRef } from "react";
import {
  Pressable,
  ViewStyle,
  type PressableProps,
  type PressableStateCallbackType,
} from "react-native";

interface PressableScaleProps extends PressableProps {
  scale?: number;
  opacity?: number;
  pressedStyle?: ViewStyle;
  preventDoubleClick?: boolean;
  doubleClickDelay?: number;
}

const PressableScale = ({
  style,
  scale = 0.97,
  opacity = 0.7,
  pressedStyle,
  preventDoubleClick = true,
  doubleClickDelay = 300,
  onPress,
  ...props
}: PressableScaleProps) => {
  const lastPress = useRef(0);

  const handlePress = (e: any) => {
    if (!preventDoubleClick) {
      onPress?.(e);
      return;
    }
    const now = Date.now();
    if (now - lastPress.current < doubleClickDelay) return;
    lastPress.current = now;
    onPress?.(e);
  };

  return (
    <Pressable
      style={(state: PressableStateCallbackType) => [
        typeof style === "function" ? style(state) : style,
        state.pressed && {
          transform: [{ scale }],
          opacity,
          ...pressedStyle,
        },
      ]}
      onPress={handlePress}
      {...props}
    />
  );
};

export default PressableScale;
