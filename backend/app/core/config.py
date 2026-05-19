"""
Configuracion central de la CNN Unified App.

Las rutas de los modelos YOLO se resuelven en este orden:
  1. /app/models/<nombre>      -> ruta dentro del contenedor Docker
  2. ./models/<nombre>         -> ruta local en desarrollo
  3. <nombre>                  -> fallback: ultralytics descarga automaticamente

Las variables se leen del archivo .env (ver .env.example para desarrollo
y .env.docker para Docker).
"""
from pydantic_settings import BaseSettings
from pathlib import Path

# Rutas de busqueda de modelos (en orden de prioridad)
_MODEL_SEARCH_PATHS = [
    Path("/app/models"),           # dentro del contenedor Docker
    Path(__file__).parent.parent.parent / "models",  # desarrollo local
]

def _find_model(name: str) -> str:
    """
    Busca el modelo YOLO en las rutas definidas.
    Si no lo encuentra, retorna solo el nombre para que
    ultralytics lo descargue automaticamente desde GitHub.
    """
    for search_path in _MODEL_SEARCH_PATHS:
        candidate = search_path / name
        if candidate.exists():
            return str(candidate)
    # Fallback: ultralytics descarga automaticamente
    return name


class Settings(BaseSettings):
    APP_NAME: str = "CNN Unified API"
    DEBUG: bool = False

    # JWT — generar con: python -c "import secrets; print(secrets.token_hex(32))"
    SECRET_KEY: str = "dev-secret-key-change-in-production"

    # Supabase — obtener en supabase.com -> Settings -> API
    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""
    SUPABASE_SERVICE_KEY: str = ""

    # Modelos YOLO
    YOLO_OBJECT_MODEL: str = "yolov8n.pt"
    YOLO_FACE_MODEL: str = "yolov8n-face.pt"

    # DeepFace
    # Opciones: VGG-Face | Facenet512 | ArcFace | OpenFace
    FACE_MODEL: str = "VGG-Face"
    # Opciones: opencv | retinaface | mtcnn | ssd | mediapipe
    FACE_DETECTOR: str = "opencv"

    # Umbrales
    CONFIDENCE_THRESHOLD: float = 0.5
    SIMILARITY_THRESHOLD: float = 0.40
    MAX_DETECTIONS: int = 100

    @property
    def yolo_object_model_path(self) -> str:
        """Ruta resuelta al modelo de deteccion de objetos."""
        return _find_model(self.YOLO_OBJECT_MODEL)

    @property
    def yolo_face_model_path(self) -> str:
        """Ruta resuelta al modelo de deteccion de rostros."""
        return _find_model(self.YOLO_FACE_MODEL)

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()
