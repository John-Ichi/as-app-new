import type {
  GeocodedLocation,
  SavedLocation,
  WeatherInfo,
} from "@/services/types";

const GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";

export async function searchPhilippineLocations(
  name: string,
  signal?: AbortSignal,
): Promise<GeocodedLocation[]> {
  const params = new URLSearchParams({
    name,
    countryCode: "PH",
    count: "10",
    language: "en",
    format: "json",
  });

  const res = await fetch(`${GEOCODING_URL}?${params.toString()}`, { signal });
  if (!res.ok) throw new Error("Failed to search locations.");

  const data = await res.json();
  return data.results ?? [];
}

const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";

function heatIndexCelsius(tempC: number, humidity: number): number {
  const tF = (tempC * 9) / 5 + 32;
  let hi =
    -42.379 +
    2.04901523 * tF +
    10.14333127 * humidity -
    0.22475541 * tF * humidity -
    0.00683783 * tF * tF -
    0.05481717 * humidity * humidity +
    0.00122874 * tF * tF * humidity +
    0.00085282 * tF * humidity * humidity -
    0.00000199 * tF * tF * humidity * humidity;

  if (hi < 80) {
    hi = 0.5 * (tF + 61.0 + (tF - 68.0) * 1.2 + humidity * 0.094);
    hi = (hi + tF) / 2;
  }

  return ((hi - 32) * 5) / 9;
}

function maxHeatIndex(
  tempsC: (number | null)[],
  humidity: (number | null)[],
): number {
  let max = Number.NEGATIVE_INFINITY;
  const length = Math.min(tempsC.length, humidity.length);
  for (let i = 0; i < length; i++) {
    const t = tempsC[i];
    const h = humidity[i];
    if (t == null || h == null) continue;
    const hi = heatIndexCelsius(t, h);
    if (hi > max) max = hi;
  }
  return Number.isFinite(max) ? max : 0;
}

function nowIsoHour(time: string): number {
  return new Date(time).getTime();
}

function rainRolling24h(
  times: string[],
  precipitation: (number | null)[],
  nowIso: string,
): number {
  const nowHour = Math.floor(nowIsoHour(nowIso) / 3_600_000) * 3_600_000;
  const cutoff = nowHour - 23 * 3_600_000;
  let sum = 0;
  const length = Math.min(times.length, precipitation.length);
  for (let i = 0; i < length; i++) {
    const t = nowIsoHour(times[i]);
    if (t < cutoff || t > nowHour) continue;
    sum += precipitation[i] ?? 0;
  }
  return sum;
}

function todayPrefix(nowIso: string): string {
  return nowIso.slice(0, 10);
}

export async function fetchWeather(
  locations: Pick<SavedLocation, "latitude" | "longitude">[],
  signal?: AbortSignal,
): Promise<WeatherInfo[]> {
  if (locations.length === 0) return [];
  const params = new URLSearchParams({
    latitude: locations.map((l) => l.latitude).join(","),
    longitude: locations.map((l) => l.longitude).join(","),
    current: "temperature_2m,weather_code",
    hourly: "temperature_2m,relative_humidity_2m,precipitation",
    temperature_unit: "celsius",
    precipitation_unit: "mm",
    forecast_days: "1",
    past_days: "1",
    timezone: "Asia/Manila",
    models: "ecmwf_ifs025",
  });

  const res = await fetch(`${FORECAST_URL}?${params.toString()}`, { signal });
  if (!res.ok) throw new Error("Failed to fetch weather.");

  const data = await res.json();
  const entries = Array.isArray(data) ? data : [data];
  return entries.map((entry) => {
    const nowIso = entry.current.time as string;
    const day = todayPrefix(nowIso);
    const times: string[] = entry.hourly?.time ?? [];
    const temps: (number | null)[] = entry.hourly?.temperature_2m ?? [];
    const humidity: (number | null)[] =
      entry.hourly?.relative_humidity_2m ?? [];

    const todayTemps: (number | null)[] = [];
    const todayHumidity: (number | null)[] = [];
    for (let i = 0; i < times.length; i++) {
      if (!times[i].startsWith(day)) continue;
      todayTemps.push(temps[i] ?? null);
      todayHumidity.push(humidity[i] ?? null);
    }

    return {
      temperature: entry.current.temperature_2m as number,
      weatherCode: entry.current.weather_code as number,
      rain24h: rainRolling24h(times, entry.hourly?.precipitation ?? [], nowIso),
      maxHeatIndex: maxHeatIndex(todayTemps, todayHumidity),
    };
  });
}
