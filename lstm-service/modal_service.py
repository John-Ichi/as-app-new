"""
Modal deployment wrapper for the NH3 forecast service.

Imports the FastAPI app from main.py UNCHANGED and serves it as a
serverless web endpoint. main.py remains the single source of truth.

Deploy:  python -m modal deploy modal_service.py
Docs:    https://<url>/docs   (FastAPI interactive docs, served on Modal too)
"""

import modal

app_image = (
    modal.Image.debian_slim(python_version="3.12")
    .pip_install_from_requirements("requirements.txt")
    .add_local_file("main.py", "/root/main.py")      # the service itself
    .add_local_dir("artifacts", "/root/artifacts")   # weights + config.json + scaler.csv
)

app = modal.App(
    "ammosense-service",
    image=app_image,
)


@app.function(
    cpu=1.0,                     # 1 vCPU
    memory=2048,                 # 2 GiB — model needs ~400 MB, comfortable headroom
    scaledown_window=300,        # stay warm 5 min after last request (demo-day UX)
    timeout=120,
)
@modal.asgi_app()   # public endpoint: edge auth reverted — browser preflight
def serve():        # cannot carry edge credentials (CORS interaction); the
                    # workspace budget caps abuse at $0 out-of-pocket; the
                    # post-defense upgrade path is service-level auth, which
                    # coexists with CORS middleware
    import main  # your verified FastAPI app, unmodified
    return main.app
