import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { useEffect, useRef, useState } from "react";

/**
 * Freshness UI state for the weather header: the transient "Up to date"
 * confirmation after a manual refresh, plus the reanimated spin for the
 * refresh icon while a fetch is running.
 *
 * Returns { upToDate, markUpToDate, spinStyle } — spinStyle is typed by
 * inference as the animated style for hosting in <Animated.View>.
 */
export function useWeatherFreshness(isFetching: boolean) {
  const [upToDate, setUpToDate] = useState(false);
  const upToDateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (upToDateTimerRef.current) clearTimeout(upToDateTimerRef.current);
    },
    [],
  );

  const markUpToDate = () => {
    setUpToDate(true);
    if (upToDateTimerRef.current) clearTimeout(upToDateTimerRef.current);
    upToDateTimerRef.current = setTimeout(() => setUpToDate(false), 2000);
  };

  const spin = useSharedValue(0);
  useEffect(() => {
    if (isFetching) {
      spin.value = withRepeat(
        withTiming(1, { duration: 1000, easing: Easing.linear }),
        -1,
      );
    } else {
      cancelAnimation(spin);
      spin.value = 0;
    }
  }, [isFetching, spin]);
  const spinStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spin.value * 360}deg` }],
  }));

  return { upToDate, markUpToDate, spinStyle };
}
