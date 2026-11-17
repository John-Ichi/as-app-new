import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import {
  fetchWeather,
  heatIndexCelsius,
  maxHeatIndex,
  rainRolling24h,
} from "../services/openMeteo.ts";

interface FixtureEntry {
  current: {
    time: string;
    temperature_2m: number;
    weather_code: number;
    relative_humidity_2m: number;
    precipitation: number;
    pressure_msl: number;
    wind_speed_10m: number;
  };
  hourly: {
    time: string[];
    temperature_2m: (number | null)[];
    relative_humidity_2m: (number | null)[];
    precipitation: (number | null)[];
    weather_code: (number | null)[];
  };
}

// Captured once from the exact production URL in services/openMeteo.ts with two
// locations. fetchWeather has no clock dependency, so the expected values below
// stay valid without regenerating the fixture.
const fixture: FixtureEntry[] = JSON.parse(
  readFileSync(
    join(
      dirname(fileURLToPath(import.meta.url)),
      "fixtures",
      "forecast-2-locations.json",
    ),
    "utf8",
  ),
);

function close(actual: number, expected: number, epsilon = 1e-9) {
  assert.ok(
    Math.abs(actual - expected) < epsilon,
    `expected ${expected} but received ${actual}`,
  );
}

/** Naive local-time stamp, matching the format Open-Meteo returns. */
function at(offsetHours: number): string {
  return new Date(Date.UTC(2026, 9, 28, 12 + offsetHours))
    .toISOString()
    .slice(0, 16);
}

test("rainRolling24h keeps the current hour and drops now - 24h", () => {
  const times = [at(-24), at(-23), at(0), at(1)];
  assert.equal(rainRolling24h(times, [1, 1, 1, 1], at(0)), 2);
});

test("rainRolling24h counts nulls as zero and handles empty input", () => {
  assert.equal(rainRolling24h([at(-2), at(-1), at(0)], [null, 1, null], at(0)), 1);
  assert.equal(rainRolling24h([], [], at(0)), 0);
});

test("heatIndexCelsius matches the pinned reference points", () => {
  close(heatIndexCelsius(32, 53), 35.111300413777876);
  // Below 80 °F the Steadman branch is used.
  close(heatIndexCelsius(25, 60), 25.061111111111114);
});

test("heatIndexCelsius rises with temperature and humidity", () => {
  assert.ok(heatIndexCelsius(30, 50) < heatIndexCelsius(35, 50));
  assert.ok(heatIndexCelsius(32, 40) < heatIndexCelsius(32, 70));
});

test("maxHeatIndex picks the day's peak, not the last value", () => {
  close(maxHeatIndex([30, 35, 32], [50, 50, 50]), heatIndexCelsius(35, 50));
});

test("maxHeatIndex falls back to zero when the day has no usable hours", () => {
  assert.equal(maxHeatIndex([null, null], [50, 50]), 0);
});

test("fetchWeather maps every entry of the fixture in request order", async (t) => {
  t.mock.method(
    globalThis,
    "fetch",
    async () => ({ ok: true, json: async () => fixture }) as unknown as Response,
  );

  const results = await fetchWeather([
    { latitude: 14.5995, longitude: 120.9842 },
    { latitude: 7.1907, longitude: 125.4553 },
  ]);

  assert.equal(results.length, 2);

  for (const [index, entry] of fixture.entries()) {
    const info = results[index];
    const source = entry.current;

    assert.equal(info.temperature, source.temperature_2m);
    assert.equal(info.weatherCode, source.weather_code);
    assert.equal(info.humidity, source.relative_humidity_2m);
    assert.equal(info.precipitation, source.precipitation);
    assert.equal(info.pressure, source.pressure_msl);
    assert.equal(info.windSpeed, source.wind_speed_10m);
    assert.equal(info.observationTime, source.time);
    assert.ok(Number.isFinite(info.heatIndex));
    assert.ok(Number.isFinite(info.maxHeatIndex));
  }

  close(results[0].rain24h, 2.2, 1e-6);
  close(results[1].rain24h, 2.8, 1e-6);
});

test("fetchWeather starts the hourly forecast at the next hour", async (t) => {
  t.mock.method(
    globalThis,
    "fetch",
    async () => ({ ok: true, json: async () => fixture }) as unknown as Response,
  );

  const [first] = await fetchWeather([
    { latitude: 14.5995, longitude: 120.9842 },
  ]);

  assert.equal(first.observationTime, "2026-10-28T13:30");
  assert.equal(first.hourlyForecast.length, 6);
  assert.equal(first.hourlyForecast[0].time, "2026-10-28T14:00");
  assert.ok(
    first.hourlyForecast.every((hour) => hour.time > first.observationTime),
  );
  assert.ok(
    first.hourlyForecast.every((hour) => Number.isFinite(hour.heatIndex)),
  );
});

test("fetchWeather does not call the API without locations", async (t) => {
  const spy = t.mock.method(globalThis, "fetch", async () => {
    throw new Error("fetch should not be called");
  });

  assert.deepEqual(await fetchWeather([]), []);
  assert.equal(spy.mock.callCount(), 0);
});
