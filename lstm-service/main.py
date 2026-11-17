"""
NH3 24-hour forecast inference service.

Serves the frozen thesis LSTM (FeedBack, autoregressive 24h -> 24h) for the
demonstration app. Architecture is pasted verbatim from shrimp_data_lstm.ipynb
cell 25; artifacts are the post-freeze exports (notebook cells 35-36).
The app performs no machine learning; all inference happens here.

Run:  uvicorn main:app --host 0.0.0.0 --port 8000
Docs: http://localhost:8000/docs  (interactive API docs, generated free)
"""

from contextlib import asynccontextmanager
import json
from pathlib import Path

import numpy as np
import pandas as pd
import tensorflow as tf
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

ARTIFACTS = Path(__file__).parent / "artifacts"
DAY = 24 * 60 * 60          # seconds; same constant as preprocessing notebook cell 3
AMMONIA_THRESHOLD = 0.06    # mg/L; the app's existing threshold (constants/parameters.ts)
TREND_HORIZON = 6           # hours ahead for the trend summary
TIMEZONE = "Asia/Manila"    # hour_sin/cos encode LOCAL time of day, matching training data

# ── 1. Architecture: pasted VERBATIM from notebook cell 25 ──────────────────────
# (except num_features, which the notebook defines as a module-level global)
num_features = 14

class FeedBack(tf.keras.Model):
    def __init__(self, units, out_steps):
        super().__init__()
        self.out_steps = out_steps
        self.units = units
        self.lstm_cell = tf.keras.layers.LSTMCell(units)
        # Also wrap the LSTMCell in an RNN to simplify the `warmup` method.
        self.lstm_rnn = tf.keras.layers.RNN(self.lstm_cell, return_state=True)
        self.dense = tf.keras.layers.Dense(num_features)

    def warmup(self, inputs):
        # inputs.shape => (batch, time, features)
        # x.shape => (batch, lstm_units)
        x, *state = self.lstm_rnn(inputs)
        # predictions.shape => (batch, features)
        prediction = self.dense(x)
        return prediction, state

    def call(self, inputs, training=None):
        # Use a TensorArray to capture dynamically unrolled outputs.
        predictions = []
        # Initialize the LSTM state.
        prediction, state = self.warmup(inputs)
        # Insert the first prediction.
        predictions.append(prediction)
        # Run the rest of the prediction steps.
        for n in range(1, self.out_steps):
            # Use the last prediction as input.
            x = prediction
            # Execute one lstm step.
            x, state = self.lstm_cell(x, states=state, training=training)
            # Convert the lstm output to a prediction.
            prediction = self.dense(x)
            # Add the prediction to the output.
            predictions.append(prediction)
        # predictions.shape => (time, batch, features)
        predictions = tf.stack(predictions)
        # predictions.shape => (batch, time, features)
        predictions = tf.transpose(predictions, [1, 0, 2])
        return predictions

# ── 2. RTDB key -> model column mapping ─────────────────────────────────────────
# The app's readings/{deviceId} rows use camelCase; the model expects the
# notebook's column names. The service owns this mapping.
READING_MAP = {
    "temperature": "temp_c",
    "salinity": "salinity_ppt",
    "pH": "ph",
    "dissolvedOxygen": "do_mg_l",
    "turbidity": "turbidity_ntu",
    "ammonia": "nh3_mg_l",
}

# ── 3. Load config + weights + scaler stats (once, at import) ──────────────────
cfg = json.loads((ARTIFACTS / "config.json").read_text())
scaler = pd.read_csv(ARTIFACTS / "scaler.csv", index_col=0)

model = FeedBack(units=cfg["units"], out_steps=cfg["out_steps"])
_ = model(tf.zeros((1, cfg["input_width"], num_features)))   # build the layers
model.load_weights(str(ARTIFACTS / "ar_24h.weights.h5"))

NH3_IDX = cfg["nh3_idx"]              # 5
SENSOR_COLS = cfg["sensor_cols"]      # 6 sensor columns in input order
NH3_STD = float(scaler.loc["nh3_mg_l", "std"])
NH3_MEAN = float(scaler.loc["nh3_mg_l", "mean"])

# ── 4. Request / response schemas ───────────────────────────────────────────────
class Reading(BaseModel):
    """One hour of sensor data — the shape of a row in readings/{deviceId}."""
    timestamp: str                # epoch-ms string (RTDB key) or ISO 8601
    temperature: float | None
    salinity: float | None
    dissolvedOxygen: float | None
    pH: float | None
    turbidity: float | None
    ammonia: float | None

class ForecastRequest(BaseModel):
    readings: list[Reading]       # exactly 24 consecutive hourly rows, oldest first

class ForecastResponse(BaseModel):
    last_known_mg_l: float        # observed NH3 at the end of the input window
    forecast_mg_l: list[float]    # 24 hourly values, mg/L (lead 1..24)
    horizon_hours: int
    change_mg_l: float            # forecast[TREND_HORIZON-1] - last_known_mg_l
    direction: str                # "rising" or "falling" (always)
    crosses_threshold: bool       # any of the first TREND_HORIZON forecasts > threshold
    imputed_count: int            # number of missing sensor values in the window

# ── 5. Preprocessing: the notebook's chain, step for step ──────────────────────
def parse_timestamp(raw: str) -> pd.Timestamp:
    """RTDB keys are epoch-ms strings; ISO 8601 is accepted for manual testing."""
    s = str(raw)
    if s.isdigit():
        ts = pd.to_datetime(int(s), unit="ms")            # epoch ms -> naive UTC
    else:
        ts = pd.to_datetime(s)
    return ts.tz_localize("UTC").tz_convert(TIMEZONE).tz_localize(None)

def build_input_window(readings: list[Reading]) -> tuple[np.ndarray, float, int]:
    """
    Raw readings -> (model_input, last_known_mg_l, imputed_count).
    Order mirrors the notebooks:
      0.0->NaN rule (preproc cell 8) -> flags (cell 9) -> interpolation
      (lstm cell 7) -> hour_sin/cos (preproc cell 3) -> z-score (lstm cell 10)
      -> reorder per config.json -> (1, 24, 14).
    """
    n = cfg["input_width"]
    if len(readings) != n:
        raise HTTPException(400, f"Need exactly {n} readings, got {len(readings)}")

    rows, stamps = [], []
    for r in readings:
        d = r.model_dump()
        stamps.append(parse_timestamp(d.pop("timestamp")))
        rows.append({READING_MAP[k]: (np.nan if v is None else float(v))
                     for k, v in d.items()})
    df = pd.DataFrame(rows, index=pd.DatetimeIndex(stamps, name="timestamp"))
    if df.index.duplicated().any():
        raise HTTPException(400, "Timestamps are not strictly hourly / contain duplicates")

    # 0.0 NH3 = sensor error -> NaN (preprocessing notebook, cell 8)
    df["nh3_mg_l"] = df["nh3_mg_l"].replace(0.0, np.nan)

    # flags BEFORE interpolation: they record "this value was missing" (cell 9)
    flag_names = [f"was_imputed_{c}" for c in SENSOR_COLS]
    for c in SENSOR_COLS:
        df[f"was_imputed_{c}"] = df[c].isna().astype(int)
    imputed_count = int(df[flag_names].to_numpy().sum())

    # interpolate within the window only (lstm notebook, cell 7)
    df[SENSOR_COLS] = df[SENSOR_COLS].interpolate(method="linear").bfill().ffill()
    if df[SENSOR_COLS].isna().to_numpy().any():
        raise HTTPException(422, "Window has no valid values for at least one sensor")

    # last observed NH3 in mg/L — captured BEFORE z-scoring
    last_known_mg_l = float(df["nh3_mg_l"].iloc[-1])

    # cyclical hour encoding on LOCAL time (preprocessing notebook, cell 3)
    ts = df.index.map(pd.Timestamp.timestamp)
    df["hour_sin"] = np.sin(ts * (2 * np.pi / DAY))
    df["hour_cos"] = np.cos(ts * (2 * np.pi / DAY))

    # z-score with train-only stats, sensor cols only (lstm notebook, cell 10)
    df[SENSOR_COLS] = (df[SENSOR_COLS] - scaler["mean"]) / scaler["std"]

    # exact channel order from config.json, one window: (1, 24, 14)
    x = df[cfg["input_cols"]].to_numpy(dtype=np.float32)[None, ...]
    return x, last_known_mg_l, imputed_count

# ── 6. Endpoints ────────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Warm up one forward pass so the first real request is fast (TF lazy init).
    mean_vals = scaler["mean"].to_dict()
    now_ms = int(pd.Timestamp.now(tz=TIMEZONE).timestamp() * 1000)
    dummy = [Reading(timestamp=str(now_ms - i * 3_600_000),
                     **{k: mean_vals[v] for k, v in READING_MAP.items()})
             for i in range(cfg["input_width"] - 1, -1, -1)]
    x, _, _ = build_input_window(dummy)
    model(x, training=False)
    yield

app = FastAPI(title="NH3 forecast service", lifespan=lifespan)
# CORS: browser clients (Expo web) enforce origin checks on fetch; native
# clients ignore them. The endpoint is already public, so allow all origins.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/forecast", response_model=ForecastResponse)
def forecast(req: ForecastRequest) -> ForecastResponse:
    x, last_known, imputed = build_input_window(req.readings)

    # inference: one forward pass of the frozen model
    pred_z = np.asarray(model(x, training=False))[0, :, NH3_IDX]

    # de-scale slice 5 -> mg/L (same linear transform as the notebook's metrics)
    forecast_mg_l = pred_z * NH3_STD + NH3_MEAN

    # trend over the next TREND_HORIZON hours
    change = float(forecast_mg_l[TREND_HORIZON - 1] - last_known)
    direction = "rising" if change > 0 else "falling"
    crosses = bool(np.any(forecast_mg_l[:TREND_HORIZON] > AMMONIA_THRESHOLD))

    return ForecastResponse(
        last_known_mg_l=round(last_known, 6),
        forecast_mg_l=[round(float(v), 6) for v in forecast_mg_l],
        horizon_hours=TREND_HORIZON,
        change_mg_l=round(change, 6),
        direction=direction,
        crosses_threshold=crosses,
        imputed_count=imputed,
    )

@app.get("/health")
def health():
    return {"status": "ok", "units": cfg["units"], "out_steps": cfg["out_steps"],
            "input_width": cfg["input_width"], "nh3_idx": NH3_IDX}
