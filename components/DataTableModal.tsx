import DataTable from "@/components/DataTable";
import PressableScale from "@/components/PressableScale";
import { ErrorState, LoadingState } from "@/components/StateDisplay";
import { graphConfig } from "@/constants/graphs";
import { ParameterId, parameterIds } from "@/constants/parameters";
import { colors } from "@/constants/theme";
import { useDevice } from "@/contexts/DeviceContext";
import {
  isBucketDataEmpty,
  subscribeHalfHour,
} from "@/services/firebase/graphs";
import type { GraphDataPoint } from "@/services/types";
import { formatCellValue } from "@/utils/format";
import dayjs from "dayjs";
import { styled } from "nativewind";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

const SafeAreaView = styled(RNSafeAreaView);

interface Props {
  visible: boolean;
  onClose: () => void;
}

const DataTableModal = ({ visible, onClose }: Props) => {
  const { width: screenWidth } = useWindowDimensions();
  const { selectedDevice } = useDevice();
  const [buckets, setBuckets] = useState<
    Record<ParameterId, GraphDataPoint[]> | null
  >(null);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  useEffect(() => {
    setBuckets(null);
    setError(null);
    setLastUpdated(null);
  }, [selectedDevice]);

  useEffect(() => {
    if (!selectedDevice || !visible) return;
    let cancelled = false;
    const unsubscribe = subscribeHalfHour(
      selectedDevice.id,
      (data) => {
        if (cancelled) return;
        setBuckets(data);
        setError(null);
        setLastUpdated(Date.now());
      },
      (err) => {
        if (!cancelled) setError(err);
      },
    );
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [selectedDevice, visible]);

  const colCount = 1 + parameterIds.length;
  const naturalWidth = Math.floor((screenWidth - 32) / colCount);
  const colWidth = Math.max(Math.min(naturalWidth, 90), 75);

  const columns = parameterIds.map((id) => graphConfig[id]?.shortLabel ?? id);
  const labelParamId = parameterIds[0];
  const rowCount = buckets?.[labelParamId]?.length ?? 48;
  const rows = Array.from({ length: rowCount }, (_, i) => ({
    label: buckets?.[labelParamId]?.[i]?.label ?? "",
    values: parameterIds.map((id) =>
      formatCellValue(id, buckets?.[id]?.[i]?.value),
    ),
  }));

  let content;
  if (error && !buckets) {
    content = <ErrorState message={error.message} />;
  } else if (!buckets) {
    content = <LoadingState />;
  } else if (isBucketDataEmpty(buckets)) {
    content = <ErrorState title="No data available." />;
  } else {
    content = (
      <DataTable
        columns={columns}
        rows={rows}
        colWidth={colWidth}
        nestedScroll
      />
    );
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-row items-center justify-between px-4 py-3">
          <Text className="text-lg text-primary font-poppins-bold">
            GATHERED DATA
          </Text>
          <PressableScale
            onPress={onClose}
            style={{ borderRadius: 20, paddingLeft: 8, paddingRight: 8 }}
            pressedStyle={{ backgroundColor: colors.pressed }}
            accessibilityLabel="Close"
            accessibilityRole="button"
            hitSlop={10}
          >
            <Text className="text-xl text-muted font-poppins-regular">
              {"\u00D7"}
            </Text>
          </PressableScale>
        </View>
        <View className="flex-row items-center justify-center gap-x-3 px-4 pb-2">
          {!buckets ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : null}
          {lastUpdated ? (
            <Text className="text-sm text-primary font-poppins-regular">
              Last updated: {dayjs(lastUpdated).format("h:mm A")}
            </Text>
          ) : null}
        </View>
        <View className="flex-1 w-full max-w-xl mx-auto px-4 pb-10">
          {content}
          {error && buckets && !isBucketDataEmpty(buckets) ? (
            <Text className="text-sm text-danger font-poppins-regular text-center mt-3">
              Failed to refresh: {error.message}
            </Text>
          ) : null}
        </View>
      </SafeAreaView>
    </Modal>
  );
};

export default DataTableModal;
