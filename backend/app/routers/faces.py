import uuid, time
from datetime import datetime
from fastapi import APIRouter, File, UploadFile, Form, Depends, HTTPException
from app.models.schemas import RecognitionResult
from app.services.yolo_service import yolo_service
from app.services.face_service import face_service
from app.services.storage_service import upload_pair, upload_face_register
from app.core.database import get_db
from app.core.deps import get_current_user

router = APIRouter(prefix="/api/v1/faces", tags=["Facial Recognition"])
ALLOWED = {"image/jpeg", "image/png", "image/webp"}

@router.post("/register")
async def register_face(
    file: UploadFile = File(...),
    person_name: str = Form(...),
    user_id: str = Depends(get_current_user),
):
    """Registra el rostro de una persona. Usa DeepFace directamente sobre la foto completa."""
    if file.content_type not in ALLOWED:
        raise HTTPException(400, "Formato no soportado")
    image_bytes = await file.read()
    try:
        embedding = face_service.extract_embedding_full(image_bytes)
    except Exception as e:
        raise HTTPException(422, detail=f"No se detecto rostro: {str(e)}")

    face_id = str(uuid.uuid4())
    image_url = await upload_face_register(image_bytes, face_id)
    row = {
        "id": face_id, "user_id": user_id,
        "person_name": person_name,
        "embedding": embedding,
        "image_url": image_url,
    }
    get_db().table("registered_faces").insert(row).execute()
    return {
        "face_id": face_id, "person_name": person_name,
        "embedding_dim": len(embedding), "image_url": image_url,
        "message": f"Rostro de '{person_name}' registrado correctamente",
    }

@router.post("/recognize", response_model=RecognitionResult)
async def recognize_face(
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user),
):
    """
    Reconocimiento facial en dos pasos:
    1. YOLO (yolov8n-face) localiza y recorta cada rostro
    2. DeepFace extrae embedding de cada recorte y lo compara con la BD
    """
    if file.content_type not in ALLOWED:
        raise HTTPException(400, "Formato no soportado")
    image_bytes = await file.read()
    start = time.time()

    # Paso 1: YOLO detecta rostros
    face_boxes, face_crops, annotated_prelim, _ = await yolo_service.detect_faces(
        image_bytes, confidence=0.5
    )
    if not face_boxes:
        raise HTTPException(422, "No se detectaron rostros en la imagen")

    # Cargar rostros registrados del usuario
    db_result = (
        get_db().table("registered_faces")
        .select("*").eq("user_id", user_id).execute()
    )
    registered = db_result.data or []
    if not registered:
        raise HTTPException(404, "No tienes rostros registrados. Registra personas primero.")

    # Paso 2: DeepFace identifica cada rostro recortado
    all_matches = []
    for i, crop_bytes in enumerate(face_crops):
        try:
            query_emb = face_service.extract_embedding(crop_bytes)
            matches = face_service.match_against_db(query_emb, registered, face_boxes[i])
        except Exception:
            matches = []
        all_matches.append(matches)

    # Anotar imagen final con nombres
    annotated_final = face_service.annotate_image(image_bytes, face_boxes, all_matches)

    elapsed = (time.time() - start) * 1000
    session_id, orig_url, ann_url = await upload_pair(
        image_bytes, annotated_final, "recognition"
    )

    # Solo los mejores matches verificados por rostro
    top_matches = [m[0] for m in all_matches if m and m[0].verified]

    row = {
        "id": session_id, "user_id": user_id,
        "image_url": orig_url, "annotated_url": ann_url,
        "faces_found": len(face_boxes),
        "matches": [m.model_dump() for m in top_matches],
        "processing_time_ms": round(elapsed, 2),
    }
    get_db().table("recognition_sessions").insert(row).execute()

    return RecognitionResult(
        session_id=session_id, faces_found=len(face_boxes),
        matches=top_matches, processing_time_ms=elapsed,
        image_url=ann_url, annotated_url=ann_url,
        created_at=datetime.utcnow(),
    )

@router.get("/registered")
async def list_registered(user_id: str = Depends(get_current_user)):
    result = (
        get_db().table("registered_faces")
        .select("id,person_name,image_url,created_at")
        .eq("user_id", user_id).order("created_at", desc=True).execute()
    )
    return result.data

@router.delete("/registered/{face_id}")
async def delete_face(face_id: str, user_id: str = Depends(get_current_user)):
    get_db().table("registered_faces").delete().eq("id", face_id).eq("user_id", user_id).execute()
    return {"message": "Rostro eliminado correctamente"}

@router.get("/history")
async def recognition_history(limit: int = 20, user_id: str = Depends(get_current_user)):
    result = (
        get_db().table("recognition_sessions")
        .select("id,faces_found,matches,processing_time_ms,image_url,annotated_url,created_at")
        .eq("user_id", user_id).order("created_at", desc=True).limit(limit).execute()
    )
    return result.data
