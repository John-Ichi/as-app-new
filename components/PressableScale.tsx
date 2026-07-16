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
}

const PressableScale = ({
  style,
  scale = 0.97,
  opacity = 0.7,
  pressedStyle,
  ...props
}: PressableScaleProps) => (
  <Pressable
    style={(state: PressableStateCallbackType) => [
      state.pressed && {
        transform: [{ scale }],
        opacity,
        ...pressedStyle,
      },
      typeof style === "function" ? style(state) : style,
    ]}
    {...props}
  />
);

export default PressableScale;
