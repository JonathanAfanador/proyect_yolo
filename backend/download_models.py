#!/usr/bin/env python3
"""
Script para descargar todos los modelos de IA necesarios.
Ejecutar UNA VEZ antes de iniciar el servidor:

    python download_models.py

Modelos que descarga:
  YOLO:
    models/yolov8n.pt          (~6 MB)  -- 80 clases COCO
    models/yolov8n-face.pt     (~6 MB)  -- deteccion de rostros
  DeepFace (segun FACE_MODEL en .env):
    VGG-Face   -> ~/.deepface/weights/vgg_face_weights.h5       (~514 MB)
    Facenet512 -> ~/.deepface/weights/facenet512_weights.h5     (~89 MB)
    ArcFace    -> ~/.deepface/weights/arcface_weights.h5        (~261 MB)
"""
import os, sys, urllib.request
from pathlib import Path

MODELS_DIR = Path(__file__).parent / "models"
MODELS_DIR.mkdir(exist_ok=True)

YOLO_MODELS = {
    "yolov8n.pt": {
        "url": "https://github.com/ultralytics/assets/releases/download/v8.2.0/yolov8n.pt",
        "size_mb": 6.2,
    },
    "yolov8n-face.pt": {
        "url": "https://github.com/akanametov/yolo-face/releases/download/v0.0.0/yolov8n-face.pt",
        "size_mb": 6.2,
    },
}

DEEPFACE_DIMS = {
    "VGG-Face": 4096, "Facenet512": 512,
    "ArcFace": 512, "OpenFace": 128,
}

def progress(count, block_size, total_size):
    if total_size > 0:
        pct = min(int(count * block_size * 100 / total_size), 100)
        print(f"\r  {pct}%", end="", flush=True)

def download_yolo(name, info):
    dest = MODELS_DIR / name
    if dest.exists():
        print(f"  [OK] {name} ya existe ({dest.stat().st_size/1024/1024:.1f} MB)")
        return True
    print(f"  Descargando {name} (~{info['size_mb']} MB)...")
    try:
        urllib.request.urlretrieve(info["url"], dest, reporthook=progress)
        print(f"\r  [OK] {name} ({dest.stat().st_size/1024/1024:.1f} MB)")
        return True
    except Exception as e:
        print(f"\n  [ERROR] {name}: {e}")
        return False

def download_deepface(model_name):
    import numpy as np
    # pyrefly: ignore [missing-import]
    from deepface import DeepFace
    print(f"  Cargando modelo DeepFace: {model_name}")
    print(f"  (Se descarga automaticamente en ~/.deepface/weights/ si no existe)")
    try:
        dummy = np.zeros((160, 160, 3), dtype=np.uint8) 
        DeepFace.represent(img_path=dummy, model_name=model_name,
                          detector_backend="skip", enforce_detection=False)
        dims = DEEPFACE_DIMS.get(model_name, "?")
        print(f"  [OK] {model_name} listo -- {dims}D embeddings")
        return True
    except Exception as e:
        print(f"  [ERROR] {model_name}: {e}")
        return False

def main():
    print("=" * 55)
    print("  CNN Unified App -- Descarga de modelos de IA")
    print("=" * 55)
    errors = []

    print("\n[1/2] Modelos YOLO -> carpeta models/")
    print("-" * 40)
    for name, info in YOLO_MODELS.items():
        if not download_yolo(name, info):
            errors.append(name)

    print("\n[2/2] Modelo DeepFace")
    print("-" * 40)
    face_model = os.getenv("FACE_MODEL", "VGG-Face")
    if not download_deepface(face_model):
        errors.append(face_model)

    print("\n" + "=" * 55)
    if errors:
        print(f"  ADVERTENCIA: errores en {errors}")
        sys.exit(1)
    else:
        print("  Todos los modelos listos.")
        print("  Iniciar servidor: uvicorn app.main:app --reload --port 8000")
    print("=" * 55)

if __name__ == "__main__":
    main()