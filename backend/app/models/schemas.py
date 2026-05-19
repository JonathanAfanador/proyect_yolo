"""
Modelos Pydantic de la CNN Unified App.
Usados para validacion de entrada/salida en los endpoints FastAPI.
NO contienen logica de negocio — solo definicion de estructura de datos.
"""
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
from datetime import datetime


# ══════════════════════════════════════════════════════════
# Auth
# ══════════════════════════════════════════════════════════

class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    full_name: str = Field(..., min_length=2, max_length=100)

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    email: str


# ══════════════════════════════════════════════════════════
# YOLO Object Detection
# ══════════════════════════════════════════════════════════

class BoundingBox(BaseModel):
    """Coordenadas del rectangulo que encierra un objeto detectado."""
    x1: float = Field(..., description="Coordenada X izquierda")
    y1: float = Field(..., description="Coordenada Y superior")
    x2: float = Field(..., description="Coordenada X derecha")
    y2: float = Field(..., description="Coordenada Y inferior")
    width:  float = Field(..., description="Ancho del rectangulo en pixeles")
    height: float = Field(..., description="Alto del rectangulo en pixeles")

class Detection(BaseModel):
    """Un objeto detectado por YOLOv8 en la imagen."""
    label:       str   = Field(..., description="Nombre de la clase (ej: person, car)")
    confidence:  float = Field(..., ge=0.0, le=1.0, description="Confianza 0-1")
    class_id:    int   = Field(..., description="ID numerico de la clase COCO")
    bounding_box: BoundingBox

class DetectionResult(BaseModel):
    """Respuesta completa del endpoint POST /api/v1/detect/"""
    detection_id:       str
    image_url:          str               = Field(..., description="URL imagen original en Supabase Storage")
    annotated_url:      Optional[str]     = Field(None, description="URL imagen con bboxes dibujados")
    detections:         List[Detection]   = Field(default_factory=list)
    total_objects:      int
    processing_time_ms: float             = Field(..., description="Tiempo de inferencia YOLO en ms")
    model_version:      str               = Field(..., description="Nombre del modelo usado (ej: yolov8n.pt)")
    created_at:         datetime


# ══════════════════════════════════════════════════════════
# Facial Recognition
# ══════════════════════════════════════════════════════════

class RecognitionMatch(BaseModel):
    """
    Resultado de comparar un rostro detectado contra un registro en BD.
    verified=True si distance <= SIMILARITY_THRESHOLD (default 0.40).
    """
    face_id:     str   = Field(..., description="UUID del registro en registered_faces")
    person_name: str   = Field(..., description="Nombre de la persona registrada")
    distance:    float = Field(..., description="Distancia euclidiana entre embeddings (menor = mas similar)")
    similarity:  float = Field(..., ge=0.0, le=1.0, description="Similitud 0-1 (mayor = mas similar)")
    verified:    bool  = Field(..., description="True si distance <= SIMILARITY_THRESHOLD")
    bbox: Optional[BoundingBox] = Field(None, description="Ubicacion del rostro en la imagen original")

class RecognitionResult(BaseModel):
    """Respuesta completa del endpoint POST /api/v1/faces/recognize/"""
    session_id:         str
    faces_found:        int               = Field(..., description="Rostros detectados por yolov8n-face")
    matches:            List[RecognitionMatch] = Field(default_factory=list)
    processing_time_ms: float             = Field(..., description="Tiempo total YOLO + DeepFace en ms")
    image_url:          str               = Field(..., description="URL imagen anotada en Supabase Storage")
    annotated_url:      Optional[str]     = None
    created_at:         datetime

class RegisteredFaceResponse(BaseModel):
    """Respuesta del endpoint POST /api/v1/faces/register"""
    face_id:       str
    person_name:   str
    embedding_dim: int   = Field(..., description="Dimensiones del embedding (VGG-Face=4096, Facenet512=512)")
    image_url:     str
    message:       str
