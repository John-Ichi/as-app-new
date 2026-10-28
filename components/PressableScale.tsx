import { useRef } from "react";
import {
  Pressable,
  ViewStyle,
  type GestureResponderEvent,
  type PressableProps,
  type PressableStateCallbackType,
} from "react-native";

interface PressableScaleProps extends PressableProps {
  scale?: number;
  opacity?: number;
  pressedStyle?: ViewStyle;
  preventDoubleClick?: boolean;
  doubleClickDelay?: number;
  /** Ignore the press if the finger moved further than this (dp) between press-in and release. */
  swipeGuard?: number;
}

const PressableScale = ({
  style,
  scale = 0.97,
  opacity = 0.7,
  pressedStyle,
  preventDoubleClick = true,
  doubleClickDelay = 300,
  swipeGuard = 0,
  onPress,
  ...props
}: PressableScaleProps) => {
  const lastPress = useRef(0);
  const pressPoint = useRef<{ x: number; y: number } | null>(null);

  const handlePressIn = (e: GestureResponderEvent) => {
    pressPoint.current = swipeGuard
      ? { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY }
      : null;
    props.onPressIn?.(e);
  };

  const handlePress = (e: GestureResponderEvent) => {
    // Swipe guard: the press started at pressPoint and the finger travelled
    // (e.g. releasing a swipe-to-close over this item) — not a tap.
    if (swipeGuard && pressPoint.current) {
      const dx = e.nativeEvent.pageX - pressPoint.current.x;
      const dy = e.nativeEvent.pageY - pressPoint.current.y;
      if (Math.hypot(dx, dy) > swipeGuard) {
        pressPoint.current = null;
        return;
      }
    }
    pressPoint.current = null;

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
      {...props}
      onPressIn={handlePressIn}
      onPress={handlePress}
    />
  );
};

export default PressableScale;
