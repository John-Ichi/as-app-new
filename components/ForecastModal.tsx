import PressableScale from "@/components/PressableScale";
import { icons } from "@/constants/icons";
import { colors } from "@/constants/theme";
import { useDevice } from "@/contexts/DeviceContext";
import {
  getCachedForecast,
  requestForecast,
  subscribeForecast,
} from "@/services/lstm";
import type { AmmoniaForecast } from "@/services/types";
import dayjs from "dayjs";
import { styled } from "nativewind";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

const SafeAreaView = styled(RNSafeAreaView);

const HOUR_MS = 60 * 60 * 1000;
const AMMONIA_THRESHOLD = 0.06;

type Phase =
  | { kind: "loading" }
  | { kind: "error"; message: string; reason: string }
  | { kind: "ready"; forecast: AmmoniaForecast };

interface Props {
  visible: boolean;
  onClose: () => void;
}

const ForecastModal = ({ visible, onClose }: Props) => {
  const { selectedDevice } = useDevice();
  const [phase, setPhase] = useState<Phase>({ kind: "loading" });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!visible || !selectedDevice) return;
    let cancelled = false;

    const cached = getCachedForecast();
    if (cached) setPhase({ kind: "ready", forecast: cached });
    else setPhase({ kind: "loading" });

    requestForecast(selectedDevice.id).then((result) => {
      if (cancelled) return;
      if (result.ok) setPhase({ kind: "ready", forecast: result.forecast });
      else if (!cached)
        setPhase({
          kind: "error",
          reason: result.reason,
          message: result.message ?? "Could not fetch forecast",
        });
    });

    const unsub = subscribeForecast((f) => {
      if (!cancelled) setPhase({ kind: "ready", forecast: f });
    });

    return () => {
      cancelled = true;
      unsub();
    };
  }, [visible, selectedDevice, reloadKey]);

  const retry = useCallback(() => setReloadKey((k) => k + 1), []);

  const forecast = phase.kind === "ready" ? phase.forecast : null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 w-full max-w-xl mx-auto">
          <View className="flex-row items-center justify-between p-4">
            <Text className="text-lg text-primary font-poppins-bold">
              24-HR AMMONIA FORECAST
            </Text>
            <PressableScale
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close"
              style={{ borderRadius: 20, paddingLeft: 8, paddingRight: 8 }}
              pressedStyle={{ backgroundColor: colors.pressed }}
              hitSlop={10}
            >
              <Text className="text-xl text-muted font-poppins-light">
                {"\u00D7"}
              </Text>
            </PressableScale>
          </View>

          {phase.kind === "loading" || !selectedDevice ? (
            <View className="flex-1 items-center justify-center gap-y-3">
              <ActivityIndicator size="large" color={colors.primary} />
              <Text className="text-md text-muted font-poppins-light">
                Generating forecast…
              </Text>
            </View>
          ) : phase.kind === "error" ? (
            <View className="flex-1 items-center justify-center gap-y-3 px-8">
              <Image
                source={icons.warning}
                style={{ width: 48, height: 48, opacity: 0.7 }}
              />
              <Text className="text-center text-md text-muted font-poppins-light">
                {phase.reason === "bad-window"
                  ? phase.message
                  : "Forecast service unreachable."}
              </Text>
              <PressableScale
                onPress={retry}
                accessibilityRole="button"
                accessibilityLabel="Retry forecast"
                className="bg-primary rounded-full px-6 py-3"
              >
                <Text className="text-white font-poppins-bold">RETRY</Text>
              </PressableScale>
            </View>
          ) : (
            <>
              <View className="px-4 pb-4">
                <Text className="text-sm text-center text-muted font-poppins-light">
                  Trend:{" "}
                  <Text className="text-primary font-poppins-bold">
                    Possibly{" "}
                    {forecast!.direction === "rising" ? "rising" : "falling"}{" "}
                    {forecast!.changeMgL >= 0 ? "+" : ""}
                    {forecast!.changeMgL.toFixed(4)} ppm
                  </Text>{" "}
                  over the next {forecast!.horizonHours} h
                </Text>
                {forecast!.crossesThreshold ? (
                  <Text className="text-sm text-danger font-poppins-bold">
                    ⚠ Forecast possibly exceeds the 0.06 ppm threshold within{" "}
                    {forecast!.horizonHours} h
                  </Text>
                ) : null}
                {forecast!.imputedCount > 0 ? (
                  <Text className="text-sm text-muted font-poppins-light">
                    {forecast!.imputedCount} sensor reading
                    {forecast!.imputedCount === 1 ? "" : "s"} in the window
                    imputed
                  </Text>
                ) : null}
              </View>
              <ScrollView contentContainerClassName="pb-10">
                <View className="gap-y-4 px-4">
                  {forecast!.forecastMgL.map((value, index) => {
                    const time =
                      forecast!.lastReadingTs + (index + 1) * HOUR_MS;
                    const critical = value > AMMONIA_THRESHOLD;
                    return (
                      <View
                        key={index}
                        className="flex-row items-center bg-white rounded-sm px-4 py-3 gap-x-3"
                      >
                        <Image
                          source={icons.ammonia}
                          style={{ width: 24, height: 24 }}
                        />
                        <Text
                          className={`flex-1 text-md font-poppins-bold ${
                            critical ? "text-danger" : "text-muted"
                          }`}
                        >
                          {value.toFixed(4)} ppm
                        </Text>
                        <Text className="text-md text-primary font-poppins-bold">
                          {dayjs(time).format("h:00 A")}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </ScrollView>
            </>
          )}

          <Text className="text-sm text-muted text-center font-poppins-light py-4">
            {forecast
              ? `Forecast generated ${dayjs(forecast.fetchedAt).format("h:mm A")} — thesis LSTM via inference service`
              : "Thesis LSTM forecast via inference service"}
          </Text>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

export default ForecastModal;
