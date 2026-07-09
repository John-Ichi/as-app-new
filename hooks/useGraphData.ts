import { ParameterId, parameterIds } from "@/constants/parameters";

export interface GraphDataPoint {
  value: number;
  label?: string;
}

export interface ParameterGraphData {
  id: ParameterId;
  oneDay: GraphDataPoint[];
  sevenDay: GraphDataPoint[];
}

const BaseValues: Record<ParameterId, number> = {
  ammonia: 0.049,
  temperature: 27.5,
  dissolvedOxygen: 7.1,
  pH: 7.2,
  turbidity: 2.9,
};

const Variation: Record<ParameterId, number> = {
  ammonia: 0.02,
  temperature: 3,
  dissolvedOxygen: 1.5,
  pH: 0.5,
  turbidity: 1,
};

export function generateHalfHourData(id: ParameterId): GraphDataPoint[] {
  const base = BaseValues[id];
  const variation = Variation[id];
  const points: GraphDataPoint[] = [];

  for (let i = 0; i < 48; i++) {
    const sinWave = Math.sin((i / 48) * Math.PI * 2);
    const value = Math.round((base + sinWave * variation * 0.3) * 1000) / 1000;
    const hour = Math.floor(i / 2);
    const minute = i % 2 === 0 ? "00" : "30";
    const label = `${hour.toString().padStart(2, "0")}:${minute}`;
    points.push({ value, label });
  }

  return points;
}

function generateOneDay(id: ParameterId): GraphDataPoint[] {
  const base = BaseValues[id];
  const variation = Variation[id];
  const points: GraphDataPoint[] = [];

  for (let i = 0; i < 24; i++) {
    const sinWave = Math.sin((i / 24) * Math.PI * 2);
    const value = Math.round((base + sinWave * variation * 0.3) * 1000) / 1000;

    const label =
      i % 2 === 0 ? `${i.toString().padStart(2, "0")}:00` : undefined;
    points.push({ value, label });
  }

  return points;
}

function generateSevenDay(id: ParameterId): GraphDataPoint[] {
  const base = BaseValues[id];
  const variation = Variation[id];
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return days.map((day, i) => {
    const trend = (i - 3) * variation * 0.05;
    const value = parseFloat((base + trend).toFixed(3));
    return { value, label: day };
  });
}

export function useGraphData(): ParameterGraphData[] {
  return parameterIds.map((id) => ({
    id,
    oneDay: generateOneDay(id),
    sevenDay: generateSevenDay(id),
  }));
}
