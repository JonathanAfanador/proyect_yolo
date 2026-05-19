# CNN Unified App

Aplicacion movil unificada con deteccion de objetos (YOLO) y reconocimiento facial (YOLO + DeepFace).

## Una sola app — un solo backend — un solo Supabase

### Stack
- **Frontend**: React Native (Expo) — TypeScript
- **Backend**: FastAPI + Python 3.11
- **IA**: YOLOv8 (objetos + rostros) + DeepFace (identificacion)
- **BaaS**: Supabase (DB + Storage + Auth)

## Estructura del proyecto
```
cnn-unified-app/
├── backend/
│   ├── app/
│   │   ├── core/       config, database, security, deps
│   │   ├── models/     schemas.py (todos los modelos Pydantic)
│   │   ├── routers/    auth.py, detection.py, faces.py
│   │   └── services/   yolo_service.py, face_service.py, storage_service.py
│   ├── requirements.txt
│   ├── Dockerfile
│   └── docker-compose.yml
├── frontend/
│   └── src/
│       ├── screens/    Home, Detect, Recognize, RegisterFace, People, History
│       ├── hooks/      useDetection, useFaceRecognition
│       ├── services/   api.ts, supabase.ts
│       ├── store/      authStore.ts
│       └── types/      index.ts
└── supabase/
    └── 001_schema.sql
```

## Setup rapido

### 1. Supabase
```
1. Crear proyecto en supabase.com
2. SQL Editor → ejecutar supabase/001_schema.sql
3. Copiar: Project URL, anon key, service_role key
```

### 2. Backend
```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # Editar con tus keys
uvicorn app.main:app --reload --port 8000
# Swagger en http://localhost:8000/docs
```

### 3. Frontend
```bash
cd frontend
npm install
cp .env.example .env.local
# Editar EXPO_PUBLIC_API_URL con tu IP local (no localhost)
npx expo start
```

## Endpoints API

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| POST | /api/v1/auth/register | Registro |
| POST | /api/v1/auth/login | Login → JWT |
| POST | /api/v1/detect/ | Detectar objetos YOLO |
| GET  | /api/v1/detect/history | Historial objetos |
| GET  | /api/v1/detect/classes | 80 clases disponibles |
| POST | /api/v1/faces/register | Registrar rostro |
| POST | /api/v1/faces/recognize | Reconocer persona |
| GET  | /api/v1/faces/registered | Lista personas |
| DELETE | /api/v1/faces/registered/{id} | Eliminar persona |
| GET  | /api/v1/faces/history | Historial facial |
| GET  | /health | Estado del servidor |

## Como funciona el reconocimiento facial
1. YOLO (yolov8n-face.pt) localiza y recorta cada rostro
2. DeepFace extrae embedding del recorte (sin re-deteccion)
3. Se compara contra todos los rostros registrados por distancia euclidiana
4. verified = True si distance <= 0.40 (configurable en .env)
