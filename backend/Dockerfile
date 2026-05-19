# ============================================================
# CNN Unified App — Dockerfile
# ============================================================
# Build args para personalizar modelos en tiempo de construccion:
#   docker build --build-arg YOLO_OBJECT_MODEL=yolov8s.pt .
#   docker build --build-arg FACE_MODEL=Facenet512 .
# ============================================================
FROM python:3.11-slim

WORKDIR /app

# ── Dependencias del sistema ──────────────────────────────
RUN apt-get update && apt-get install -y --no-install-recommends     libgl1-mesa-glx     libglib2.0-0     libsm6     libxext6     libxrender-dev     cmake     build-essential     wget     && rm -rf /var/lib/apt/lists/*

# ── Dependencias Python ───────────────────────────────────
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# ── Carpeta de modelos ────────────────────────────────────
RUN mkdir -p /app/models

# ── Descarga de modelos YOLO ──────────────────────────────
# Configurable con --build-arg en docker build
ARG YOLO_OBJECT_MODEL=yolov8n.pt
ARG YOLO_FACE_MODEL=yolov8n-face.pt

ENV YOLO_OBJECT_MODEL=
ENV YOLO_FACE_MODEL=

# Descarga modelo de objetos
RUN python -c "
from ultralytics import YOLO
import os
model_name = os.environ.get("YOLO_OBJECT_MODEL", "yolov8n.pt")
print(f"Descargando modelo de objetos: {model_name}")
m = YOLO(model_name)
import shutil, pathlib
src = pathlib.Path(model_name)
if src.exists():
    shutil.copy(src, f"/app/models/{model_name}")
    print(f"Modelo guardado en /app/models/{model_name}")
"

# Descarga modelo de rostros
RUN python -c "
import urllib.request, os, pathlib
model_name = os.environ.get("YOLO_FACE_MODEL", "yolov8n-face.pt")
dest = pathlib.Path(f"/app/models/{model_name}")
if not dest.exists():
    url = "https://github.com/akanametov/yolo-face/releases/download/v0.0.0/" + model_name
    print(f"Descargando modelo de rostros: {url}")
    urllib.request.urlretrieve(url, dest)
    print(f"Guardado en {dest}")
else:
    print(f"Modelo de rostros ya existe: {dest}")
"

# ── Descarga de modelo DeepFace ───────────────────────────
ARG FACE_MODEL=VGG-Face
ENV FACE_MODEL=

RUN python -c "
import numpy as np
from deepface import DeepFace
import os
model_name = os.environ.get("FACE_MODEL", "VGG-Face")
print(f"Pre-cargando modelo DeepFace: {model_name}")
dummy = np.zeros((160, 160, 3), dtype=np.uint8)
DeepFace.represent(
    img_path=dummy,
    model_name=model_name,
    detector_backend="skip",
    enforce_detection=False,
)
print(f"Modelo DeepFace {model_name} listo en ~/.deepface/weights/")
"

# ── Codigo de la aplicacion ───────────────────────────────
COPY . .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
