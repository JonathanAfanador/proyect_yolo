import uuid
from app.core.database import get_db

BUCKET = "cnn-unified"

async def upload_image(image_bytes: bytes, path: str, content_type: str = "image/jpeg") -> str:
    db = get_db()
    db.storage.from_(BUCKET).upload(
        path=path,
        file=image_bytes,
        file_options={"content-type": content_type},
    )
    return db.storage.from_(BUCKET).get_public_url(path)

async def upload_pair(original: bytes, annotated: bytes, prefix: str) -> tuple:
    rid = str(uuid.uuid4())
    orig_url = await upload_image(original, f"{prefix}/originals/{rid}.jpg")
    ann_url  = await upload_image(annotated, f"{prefix}/annotated/{rid}.jpg")
    return rid, orig_url, ann_url

async def upload_face_register(image_bytes: bytes, face_id: str) -> str:
    return await upload_image(image_bytes, f"faces/registered/{face_id}.jpg")
