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
      typeof style === "function" ? style(state) : style,
      state.pressed && {
        transform: [{ scale }],
        opacity,
        ...pressedStyle,
      },
    ]}
    {...props}
  />
);

export default PressableScale;
