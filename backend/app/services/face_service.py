"""
FaceService -- Reconocimiento facial con DeepFace.

Modelos disponibles (configurar FACE_MODEL en .env):
  VGG-Face   : 4096D embeddings | ~514 MB | alta precision (default)
  Facenet512 : 512D embeddings  | ~89 MB  | muy alta precision
  ArcFace    : 512D embeddings  | ~261 MB | excelente para produccion
  OpenFace   : 128D embeddings  | ~30 MB  | rapido y liviano

Los pesos se descargan en ~/.deepface/weights/ la primera vez,
o pre-descargarlos con:  python download_models.py
"""
import cv2, numpy as np
from deepface import DeepFace
from app.core.config import settings
from app.models.schemas import RecognitionMatch, BoundingBox

DEEPFACE_DIMS = {
    "VGG-Face": 4096, "Facenet512": 512,
    "ArcFace": 512,   "OpenFace": 128, "DeepFace": 4096,
}

class FaceService:
    _instance = None
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def _decode_rgb(self, b: bytes) -> np.ndarray:
        img = cv2.imdecode(np.frombuffer(b, np.uint8), cv2.IMREAD_COLOR)
        if img is None:
            raise ValueError("No se pudo decodificar la imagen")
        return cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

    def extract_embedding(self, image_bytes: bytes) -> list:
        """
        Extrae embedding de un RECORTE ya hecho por YOLO.
        Usa detector_backend=skip porque YOLO ya localizo el rostro.
        """
        img_rgb = self._decode_rgb(image_bytes)
        result = DeepFace.represent(
            img_path=img_rgb,
            model_name=settings.FACE_MODEL,
            detector_backend="skip",
            enforce_detection=False,
        )
        if not result:
            raise ValueError("No se pudo extraer embedding")
        return result[0]["embedding"]

    def extract_embedding_full(self, image_bytes: bytes) -> list:
        """
        Extrae embedding de imagen completa (para registro de nueva persona).
        La imagen debe contener exactamente 1 rostro visible.
        """
        img_rgb = self._decode_rgb(image_bytes)
        result = DeepFace.represent(
            img_path=img_rgb,
            model_name=settings.FACE_MODEL,
            detector_backend=settings.FACE_DETECTOR,
            enforce_detection=True,
        )
        if not result:
            raise ValueError("No se encontro rostro en la imagen")
        return result[0]["embedding"]

    def compute_similarity(self, emb1: list, emb2: list):
        """
        Distancia Coseno entre dos embeddings (ideal para cambios de luz/exteriores).
        Retorna (similarity 0-1, distance).
        verified = True si distance <= SIMILARITY_THRESHOLD.
        """
        a, b = np.array(emb1, np.float32), np.array(emb2, np.float32)
        dot_product = np.dot(a, b)
        norm_a = np.linalg.norm(a)
        norm_b = np.linalg.norm(b)
        
        if norm_a == 0 or norm_b == 0:
            return 0.0, 1.0
            
        cosine_distance = 1.0 - (dot_product / (norm_a * norm_b))
        distance = float(cosine_distance)
        
        similarity = round(max(0.0, 1.0 - distance), 4)
        return similarity, round(distance, 4)

    def match_against_db(self, query_emb: list, registered: list, bbox=None) -> list:
        matches = []
        for rec in registered:
            stored = rec.get("embedding", [])
            if not stored:
                continue
            sim, dist = self.compute_similarity(query_emb, stored)
            matches.append(RecognitionMatch(
                face_id=rec["id"], person_name=rec["person_name"],
                distance=dist, similarity=sim,
                verified=dist <= settings.SIMILARITY_THRESHOLD,
                bbox=bbox,
            ))
        matches.sort(key=lambda m: m.distance)
        return matches

    def annotate_image(self, image_bytes: bytes, face_boxes: list, all_matches: list) -> bytes:
        img = cv2.imdecode(np.frombuffer(image_bytes, np.uint8), cv2.IMREAD_COLOR)
        for i, bbox in enumerate(face_boxes):
            ms = all_matches[i] if i < len(all_matches) else []
            best = next((m for m in ms if m.verified), None)
            label = best.person_name if best else "Desconocido"
            color = (0,200,80) if best else (0,0,220)
            suffix = f" {best.similarity*100:.0f}%" if best else ""
            x1,y1,x2,y2 = int(bbox.x1),int(bbox.y1),int(bbox.x2),int(bbox.y2)
            cv2.rectangle(img,(x1,y1),(x2,y2),color,2)
            cv2.putText(img, label+suffix,(x1,max(y1-8,0)),
                        cv2.FONT_HERSHEY_SIMPLEX,0.65,color,2)
        _, buf = cv2.imencode(".jpg", img, [cv2.IMWRITE_JPEG_QUALITY, 90])
        return buf.tobytes()

    def model_info(self):
        return {
            "model": settings.FACE_MODEL,
            "embedding_dim": DEEPFACE_DIMS.get(settings.FACE_MODEL, "unknown"),
            "detector": settings.FACE_DETECTOR,
            "similarity_threshold": settings.SIMILARITY_THRESHOLD,
        }

face_service = FaceService()
