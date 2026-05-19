"""
CNN Unified API -- Un solo backend con:
  YOLOv8        -> 80 objetos COCO
  YOLOv8-face   -> localizacion de rostros
  DeepFace      -> identificacion facial

ANTES de iniciar la primera vez:
    python download_models.py

Iniciar servidor:
    uvicorn app.main:app --reload --port 8000

Swagger UI: http://localhost:8000/docs
Info modelos: http://localhost:8000/models
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, detection, faces
from app.core.config import settings
from app.services.yolo_service import yolo_service
from app.services.face_service import face_service

app = FastAPI(
    title=settings.APP_NAME,
    version="2.0.0",
    description="API unificada: YOLO detection + YOLO-face + DeepFace recognition",
)

app.add_middleware(CORSMiddleware, allow_origins=["*"],
    allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

app.include_router(auth.router)
app.include_router(detection.router)
app.include_router(faces.router)

@app.get("/health", tags=["Status"])
async def health():
    return {"status": "ok", "service": settings.APP_NAME,
            "models": {"yolo": yolo_service.model_info(),
                        "deepface": face_service.model_info()}}

@app.get("/models", tags=["Status"])
async def list_models():
    from pathlib import Path
    models_dir = Path(__file__).parent.parent.parent / "models"
    model_files = [f.name for f in models_dir.glob("*.pt")] if models_dir.exists() else []
    return {
        "models_dir": str(models_dir),
        "yolo_files_in_models_dir": model_files,
        "active": {
            "object_detection": {"model": settings.YOLO_OBJECT_MODEL,
                                  "path": settings.yolo_object_model_path},
            "face_detection":   {"model": settings.YOLO_FACE_MODEL,
                                  "path": settings.yolo_face_model_path},
            "face_recognition": {"model": settings.FACE_MODEL,
                                  "embedding_dim": face_service.model_info()["embedding_dim"],
                                  "threshold": settings.SIMILARITY_THRESHOLD},
        },
        "available_yolo_models": [
            {"name":"yolov8n.pt",      "size":"6MB",   "info":"mas rapido, 80 clases"},
            {"name":"yolov8s.pt",      "size":"22MB",  "info":"balance velocidad/precision"},
            {"name":"yolov8m.pt",      "size":"52MB",  "info":"mayor precision"},
            {"name":"yolov8n-face.pt", "size":"6MB",   "info":"deteccion de rostros"},
        ],
        "available_deepface_models": [
            {"name":"VGG-Face",   "dim":4096, "size":"514MB", "info":"default, alta precision"},
            {"name":"Facenet512", "dim":512,  "size":"89MB",  "info":"muy alta precision"},
            {"name":"ArcFace",    "dim":512,  "size":"261MB", "info":"mejor para produccion"},
            {"name":"OpenFace",   "dim":128,  "size":"30MB",  "info":"rapido y liviano"},
        ],
    }

@app.on_event("startup")
async def startup_event():
    print("=" * 50)
    print(" CNN Unified API iniciando...")
    print(" IMPORTANTE: Ejecutar primero: python download_models.py")
    print("=" * 50)
    yolo_service.get_object_model()
    yolo_service.get_face_model()
    print(" Docs: http://localhost:8000/docs")
    print(" Modelos: http://localhost:8000/models")
    print("=" * 50)
