# NH3 forecast service (AmmoSense)

FastAPI service serving the frozen thesis LSTM (24h -> 24h autoregressive NH3
forecast) for the demonstration app. Architecture and preprocessing reproduce
`shrimp_data_lstm.ipynb` exactly; artifacts in `artifacts/` are the notebook's
post-freeze exports (cells 35-36). Deployed on Modal (free-tier serverless).

## Verified status (2026-11-17)

| Check | Result |
|---|---|
| Local acceptance suite (7 tests) | 7/7 PASS |
| Cloud (Modal) acceptance suite (7 tests) | 7/7 PASS |
| Clean-window forecast vs notebook-faithful expected values | max diff 4.79e-07 mg/L |
| First request after idle (cold start) | < 1 s |
| Warm request latency | ~0.7-0.9 s |
| Deployment | Modal (URL not committed — set `EXPO_PUBLIC_MODAL_SERVICE_URL` in the app's `.env`; live status: modal.com dashboard) |

## Files

| File | Role |
|---|---|
| `main.py` | The service (single source of truth — verified, do not edit casually) |
| `modal_service.py` | Modal deployment manifest; imports `main.py` unchanged |
| `requirements.txt` | Pinned deps (`tensorflow-cpu==2.21.0`, the training stack) |
| `artifacts/` | Notebook exports: `ar_24h.weights.h5`, `config.json`, `scaler.csv` |

## Redeploy (after any legitimate change)

```
cd lstm-service
& "C:\Users\Aira Dominique\AppData\Local\Programs\Python\Python312\python.exe" -X utf8 -m modal deploy modal_service.py
```

First build takes minutes; later deploys are seconds (image cached).
Watch status/logs: https://modal.com/apps/johnichiro-mananquil/main/deployed/ammosense-service

## Run locally (fallback for offline demo days)

```
cd lstm-service
& "C:\Users\Aira Dominique\AppData\Local\Programs\Python\Python312\python.exe" -m uvicorn main:app --host 0.0.0.0 --port 8000
```

- LAN address for the app: `http://<this-machine-LAN-IP>:8000` (`ipconfig` to find it)
- Interactive docs: `http://localhost:8000/docs`
- Health check: `http://localhost:8000/health`

## Demo-day runbook

The service URL is configured app-side via `EXPO_PUBLIC_MODAL_SERVICE_URL`
in the app's `.env` (not committed — see `.env.example`).

1. **Morning of the defense:** confirm the service is live via the Modal
   dashboard (modal.com/apps/johnichiro-mananquil/main/deployed/ammosense-service)
   or a quick request to `<service-url>/health` (usually instant; Modal cold
   starts in < 1 s).
2. **Normal operation:** the app talks to the configured Modal URL.
3. **If the cloud is unreachable:** run the service locally (commands above),
   set `EXPO_PUBLIC_MODAL_SERVICE_URL` to the LAN address
   (`http://<laptop-ip>:8000`) and restart Metro. One config value.
4. **If the venue internet dies entirely:** laptop + phone on a personal
   hotspot or direct LAN — the local service does not need the internet.

## Endpoints

| Endpoint | Purpose |
|---|---|
| `POST /forecast` | Body: `{"readings": [24 hourly rows, oldest first]}` (RTDB camelCase keys accepted). Returns `forecast_mg_l` (24 hourly values, mg/L), `last_known_mg_l`, 6-hour trend (`direction` rising/falling, `change_mg_l`), `crosses_threshold` (vs 0.06 mg/L), `imputed_count`. |
| `GET /health` | Model config echo — pre-check. |
| `GET /docs` | Auto-generated interactive API docs (FastAPI). |

## Notes

- The 0.06 mg/L threshold is the app's existing ammonia threshold
  (`constants/parameters.ts`); the service invents no new thresholds.
- Timestamps: epoch-ms strings (RTDB keys) or ISO 8601; hour features are
  encoded in Asia/Manila local time to match the training data.
- Cost: Modal Starter, $30/mo included compute; measured usage is
  ~$0.001 per request-session (pennies per month at thesis scale).
