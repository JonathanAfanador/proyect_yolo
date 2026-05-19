"""
YOLOService -- Singleton con DOS modelos YOLO:
  _obj_model  : yolov8n.pt       -- 80 objetos COCO
  _face_model : yolov8n-face.pt  -- 1 clase: face

Antes de usar, ejecutar:  python download_models.py
"""
import time, cv2, numpy as np
from ultralytics import YOLO
from app.core.config import settings
from app.models.schemas import Detection, BoundingBox

class YOLOService:
    _instance = None
    _obj_model = None
    _face_model = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def get_object_model(self) -> YOLO:
        if self._obj_model is None:
            path = settings.yolo_object_model_path
            print(f"[YOLO] Cargando modelo objetos: {path}")
            self._obj_model = YOLO(path)
            print(f"[YOLO] Modelo objetos listo ({len(self._obj_model.names)} clases)")
        return self._obj_model

    def get_face_model(self) -> YOLO:
        if self._face_model is None:
            path = settings.yolo_face_model_path
            print(f"[YOLO] Cargando modelo rostros: {path}")
            self._face_model = YOLO(path)
            print(f"[YOLO] Modelo rostros listo")
        return self._face_model

    def _decode(self, b: bytes) -> np.ndarray:
        img = cv2.imdecode(np.frombuffer(b, np.uint8), cv2.IMREAD_COLOR)
        if img is None:
            raise ValueError("No se pudo decodificar la imagen")
        return img

    def _encode(self, img: np.ndarray) -> bytes:
        _, buf = cv2.imencode(".jpg", img, [cv2.IMWRITE_JPEG_QUALITY, 90])
        return buf.tobytes()

    async def detect_objects(self, image_bytes, confidence=0.5, max_results=50, classes_filter=None):
        start = time.time()
        model = self.get_object_model()
        img_bgr = self._decode(image_bytes)
        img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
        results = model.predict(img_rgb, conf=confidence, max_det=max_results, verbose=False)
        detections, annotated, names = [], img_bgr.copy(), model.names
        for r in results:
            for box in r.boxes:
                label = names[int(box.cls)]
                if classes_filter and label not in classes_filter:
                    continue
                x1,y1,x2,y2 = [float(v) for v in box.xyxy[0]]
                conf_val = float(box.conf[0])
                detections.append(Detection(label=label, confidence=conf_val,
                    class_id=int(box.cls),
                    bounding_box=BoundingBox(x1=x1,y1=y1,x2=x2,y2=y2,
                                             width=x2-x1,height=y2-y1)))
                cv2.rectangle(annotated,(int(x1),int(y1)),(int(x2),int(y2)),(0,200,0),2)
                cv2.putText(annotated,f"{label} {conf_val:.2f}",(int(x1),max(int(y1)-8,0)),
                            cv2.FONT_HERSHEY_SIMPLEX,0.6,(0,200,0),2)
        return detections, self._encode(annotated), (time.time()-start)*1000

    async def detect_faces(self, image_bytes, confidence=0.5):
        start = time.time()
        model = self.get_face_model()
        img_bgr = self._decode(image_bytes)
        img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
        results = model.predict(img_rgb, conf=confidence, verbose=False)
        face_boxes, face_crops, annotated = [], [], img_bgr.copy()
        h, w = img_bgr.shape[:2]
        for r in results:
            for box in r.boxes:
                x1,y1,x2,y2 = [int(v) for v in box.xyxy[0]]
                PAD = 10
                crop = img_bgr[max(0,y1-PAD):min(h,y2+PAD), max(0,x1-PAD):min(w,x2+PAD)]
                if crop.size == 0:
                    continue
                face_crops.append(self._encode(crop))
                face_boxes.append(BoundingBox(x1=float(x1),y1=float(y1),
                    x2=float(x2),y2=float(y2),width=float(x2-x1),height=float(y2-y1)))
                cv2.rectangle(annotated,(x1,y1),(x2,y2),(138,43,226),2)
        return face_boxes, face_crops, self._encode(annotated), (time.time()-start)*1000

    def model_info(self):
        obj = self.get_object_model()
        face = self.get_face_model()
        return {
            "object_model": {"name": settings.YOLO_OBJECT_MODEL,
                              "path": settings.yolo_object_model_path,
                              "classes": len(obj.names)},
            "face_model":   {"name": settings.YOLO_FACE_MODEL,
                              "path": settings.yolo_face_model_path},
        }

yolo_service = YOLOService()
