import uuid, json
from datetime import datetime
from fastapi import APIRouter, File, UploadFile, Form, Depends, HTTPException
from app.models.schemas import DetectionResult
from app.services.yolo_service import yolo_service
from app.services.storage_service import upload_pair
from app.core.database import get_db
from app.core.deps import get_current_user
from app.core.config import settings

router = APIRouter(prefix="/api/v1/detect", tags=["YOLO Detection"])
ALLOWED = {"image/jpeg", "image/png", "image/webp"}

@router.post("/", response_model=DetectionResult)
async def detect_objects(
    file: UploadFile = File(...),
    confidence: float = Form(default=0.5),
    max_results: int = Form(default=50),
    classes_filter: str = Form(default=None),
    user_id: str = Depends(get_current_user),
):
    if file.content_type not in ALLOWED:
        raise HTTPException(400, "Formato no soportado. Usa JPG, PNG o WEBP.")
    image_bytes = await file.read()
    filters = json.loads(classes_filter) if classes_filter else None
    detections, annotated_bytes, elapsed = await yolo_service.detect_objects(
        image_bytes, confidence, max_results, filters
    )
    det_id, orig_url, ann_url = await upload_pair(image_bytes, annotated_bytes, "detections")
    row = {
        "id": det_id, "user_id": user_id,
        "image_url": orig_url, "annotated_url": ann_url,
        "detections": [d.model_dump() for d in detections],
        "total_objects": len(detections),
        "processing_time_ms": round(elapsed, 2),
        "model_version": settings.YOLO_OBJECT_MODEL,
        "confidence_threshold": confidence,
        "type": "object",
    }
    get_db().table("detections").insert(row).execute()
    return DetectionResult(
        detection_id=det_id, image_url=orig_url, annotated_url=ann_url,
        detections=detections, total_objects=len(detections),
        processing_time_ms=elapsed, model_version=settings.YOLO_OBJECT_MODEL,
        created_at=datetime.utcnow(),
    )

@router.get("/history")
async def get_history(
    limit: int = 20, offset: int = 0,
    user_id: str = Depends(get_current_user),
):
    result = (
        get_db().table("detections")
        .select("id,image_url,annotated_url,total_objects,processing_time_ms,created_at,type")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .range(offset, offset + limit - 1)
        .execute()
    )
    return result.data

@router.get("/classes")
async def get_classes():
    model = yolo_service.get_object_model()
    return {"classes": list(model.names.values()), "total": len(model.names)}

@router.get("/{detection_id}")
async def get_detection(detection_id: str, user_id: str = Depends(get_current_user)):
    result = (
        get_db().table("detections")
        .select("*").eq("id", detection_id).eq("user_id", user_id).single().execute()
    )
    if not result.data:
        raise HTTPException(404, "Deteccion no encontrada")
    return result.data
