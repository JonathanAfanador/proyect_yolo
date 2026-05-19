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
    print(f"\n📥 [API] Petición /faces/register recibida. Persona: '{person_name}'")
    if file.content_type not in ALLOWED:
        print("❌ [API] Formato de archivo no soportado.")
        raise HTTPException(400, "Formato no soportado")
    
    image_bytes = await file.read()
    print(f"📸 [API] Imagen leída con éxito. Tamaño original/comprimido: {len(image_bytes)/1024:.2f} KB")
    import time
    start_time = time.time()
    
    try:
        print("🧬 [API] Iniciando extracción de embedding con DeepFace (VGG-Face)...")
        embedding = face_service.extract_embedding_full(image_bytes)
        print("✅ [API] Embedding extraído con éxito!")
    except Exception as e:
        print(f"❌ [API] Error en extracción de embedding: {str(e)}")
        raise HTTPException(422, detail=f"No se detecto rostro: {str(e)}")

    # --- Validación de Duplicados Biométricos ---
    print("🔍 [API] Buscando si este rostro ya fue registrado anteriormente...")
    db_result = (
        get_db().table("registered_faces")
        .select("*").eq("user_id", user_id).execute()
    )
    registered = db_result.data or []
    if registered:
        matches = face_service.match_against_db(embedding, registered)
        best_match = matches[0] if matches else None
        if best_match and best_match.verified:
            print(f"❌ [API] Duplicado biométrico detectado. Rostro ya registrado como '{best_match.person_name}' (distancia: {best_match.distance:.4f})")
            raise HTTPException(
                status_code=400,
                detail=f"Este rostro ya está registrado bajo el nombre de '{best_match.person_name}'."
            )
    # ---------------------------------------------

    face_id = str(uuid.uuid4())
    print("☁️ [API] Subiendo imagen original a Supabase Storage...")
    image_url = await upload_face_register(image_bytes, face_id)
    print(f"✅ [API] Imagen subida con éxito: {image_url}")
    
    row = {
        "id": face_id, "user_id": user_id,
        "person_name": person_name,
        "embedding": embedding,
        "image_url": image_url,
    }
    
    print("💾 [API] Guardando registro biométrico en base de datos Supabase...")
    get_db().table("registered_faces").insert(row).execute()
    
    elapsed = time.time() - start_time
    print(f"🎉 [API] Registro de rostro completado con éxito! (Tiempo: {elapsed:.2f}s)")
    
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
    print(f"\n📥 [API] Petición /faces/recognize recibida.")
    if file.content_type not in ALLOWED:
        print("❌ [API] Formato de archivo no soportado.")
        raise HTTPException(400, "Formato no soportado")
        
    image_bytes = await file.read()
    print(f"📸 [API] Imagen leída con éxito. Tamaño original/comprimido: {len(image_bytes)/1024:.2f} KB")
    start = time.time()

    # Paso 1: YOLO detecta rostros
    print("🔍 [API] Paso 1: YOLOv8-Face buscando rostros en la imagen...")
    face_boxes, face_crops, annotated_prelim, _ = await yolo_service.detect_faces(
        image_bytes, confidence=0.5
    )
    print(f"✅ [API] Búsqueda finalizada. Rostros localizados: {len(face_boxes)}")
    
    if not face_boxes:
        print("❌ [API] No se encontraron rostros en la imagen.")
        raise HTTPException(422, "No se detectaron rostros en la imagen")

    # Cargar rostros registrados del usuario
    print("📂 [API] Consultando firmas faciales registradas del usuario en Supabase...")
    db_result = (
        get_db().table("registered_faces")
        .select("*").eq("user_id", user_id).execute()
    )
    registered = db_result.data or []
    print(f"✅ [API] Firmas cargadas. Rostros registrados en base de datos: {len(registered)}")
    
    if not registered:
        print("❌ [API] Error: El usuario no tiene ningún rostro registrado en su BD.")
        raise HTTPException(404, "No tienes rostros registrados. Registra personas primero.")

    # Paso 2: DeepFace identifica cada rostro recortado
    print("🧬 [API] Paso 2: DeepFace extrayendo y comparando firmas de rostros...")
    all_matches = []
    for i, crop_bytes in enumerate(face_crops):
        try:
            print(f"   [DeepFace] Procesando rostro #{i+1}...")
            query_emb = face_service.extract_embedding(crop_bytes)
            matches = face_service.match_against_db(query_emb, registered, face_boxes[i])
            
            for m in matches:
                status_str = "✅ MATCHEADO" if m.verified else "❌ RECHAZADO"
                print(f"      -> '{m.person_name}': distancia={m.distance:.4f} (umbral: {face_service.model_info()['similarity_threshold']}) - {status_str}")
                
            best_match = matches[0].person_name if matches and matches[0].verified else "Desconocido"
            print(f"   [DeepFace] Rostro #{i+1} identificado como: '{best_match}'")
        except Exception as e:
            print(f"   ⚠️ [DeepFace] Error en rostro #{i+1}: {str(e)}")
            matches = []
        all_matches.append(matches)

    # Anotar imagen final con nombres
    print("🎨 [API] Anotando nombres e identificadores sobre la imagen...")
    annotated_final = face_service.annotate_image(image_bytes, face_boxes, all_matches)

    elapsed = (time.time() - start) * 1000
    print(f"⚡ [API] Tiempo de procesamiento interno: {elapsed:.2f}ms")
    
    print("☁️ [API] Subiendo par de imágenes (original + anotada) a Supabase Storage...")
    session_id, orig_url, ann_url = await upload_pair(
        image_bytes, annotated_final, "recognition"
    )
    print(f"✅ [API] Imágenes subidas con éxito. Sesión ID: {session_id}")

    # Solo los mejores matches verificados por rostro
    top_matches = [m[0] for m in all_matches if m and m[0].verified]

    row = {
        "id": session_id, "user_id": user_id,
        "image_url": orig_url, "annotated_url": ann_url,
        "faces_found": len(face_boxes),
        "matches": [m.model_dump() for m in top_matches],
        "processing_time_ms": round(elapsed, 2),
    }
    
    print("💾 [API] Guardando sesión de reconocimiento en base de datos Supabase...")
    get_db().table("recognition_sessions").insert(row).execute()
    print("🎉 [API] Sesión registrada con éxito!")


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
async def recognition_history(
    limit: int = 20, offset: int = 0,
    user_id: str = Depends(get_current_user),
):
    result = (
        get_db().table("recognition_sessions")
        .select("id,faces_found,matches,processing_time_ms,image_url,annotated_url,created_at")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .range(offset, offset + limit - 1)
        .execute()
    )
    return result.data
