# CNN Unified App 

Aplicación móvil unificada con **detección de objetos en tiempo real (YOLOv8)** y **reconocimiento facial de alta precisión (YOLOv8 + DeepFace)**. Dispone de un sistema centralizado, diseño premium responsivo y alertas personalizadas integradas.

---

##  Stack Tecnológico

* **Frontend**: React Native (Expo Go) — TypeScript — React Navigation (Expo Router)
* **Backend**: FastAPI (Python 3.11) — Uvicorn — Ultralytics YOLOv8 — DeepFace (VGG-Face)
* **Base de Datos y Seguridad**: Supabase (PostgreSQL + Auth + Storage)

---

##  Características Destacadas y Mejoras Recientes

1. **Detección de Objetos Optimizada (YOLOv8)**:
   * Identificación precisa de múltiples elementos por imagen.
   * Traducción automática de etiquetas de detección al **español** para una interfaz nativa y amigable.

2. **Reconocimiento Facial Inteligente**:
   * Detección y recorte automático del rostro con YOLOv8-face.
   * Extracción de embeddings vectoriales mediante DeepFace y comparación euclidiana en base de datos.
   * Registro rápido de rostros desde la cámara o galería.

3. **Sistema de Alertas Premium (`CustomAlert`)**:
   * Sustitución total de las alertas nativas del sistema (`Alert.alert`) por un componente visual estilizado y moderno con soporte para múltiples estados (Éxito, Error, Advertencia) y animaciones de confirmación.

4. **Diseño Altamente Responsivo**:
   * Vistas de Login y Registro optimizadas para cualquier tamaño de pantalla mediante restricciones de ancho (`maxWidth: 460`), layouts autocentrados y soporte de teclado dinámico (`KeyboardAvoidingView` + `ScrollView`).

5. **Navegación y Cierre de Sesión Seguro**:
   * Flujo de cierre de sesión completamente funcional. Al pulsar "Cerrar sesión" se borran los tokens de acceso y se expulsa inmediatamente al usuario hacia la pantalla de Login.
   * Configuración de sesión limpia en desarrollo (`persistSession: false`): cada vez que la app se cierra por completo, solicita de nuevo las credenciales para pruebas seguras.

6. **Historial con Paginación**:
   * Paginación eficiente en los listados del historial, limitando la carga inicial a **10 registros por página** para optimizar el rendimiento y el consumo de datos.

7. **Consola Limpia en Desarrollo**:
   * Los errores y peticiones de red (`📡 [API REQ]`, `✅ [API RES]`, `❌ [API ERR]`) se registran silenciosamente en la terminal de Metro en la computadora, eliminando los molestos anuncios rojos flotantes (RedBox/LogBox) en el celular.

---

## 📁 Estructura del Proyecto

```text
proyect_yolo/
├── backend/
│   ├── app/
│   │   ├── core/       # Configuración central, base de datos Supabase, dependencias
│   │   ├── models/     # Esquemas de datos Pydantic
│   │   ├── routers/    # auth.py (JWT), detection.py (YOLO), faces.py (DeepFace)
│   │   └── services/   # yolo_service.py, face_service.py, storage_service.py
│   ├── requirements.txt
│   └── .env            # Variables de entorno del backend (Supabase Service Key, etc.)
├── frontend/
│   ├── app/            # Expo Router (login, register, tabs/screens)
│   ├── src/
│   │   ├── components/ # Componentes reutilizables (CustomAlert, etc.)
│   │   ├── screens/    # HomeScreen, DetectScreen, RecognizeScreen, PeopleScreen, HistoryScreen
│   │   ├── services/   # api.ts (Axios), supabase.ts (Client SDK)
│   │   └── store/      # authStore.ts (Zustand state management)
│   └── .env            # Variables de entorno del frontend (URL de la IP local)
```

---

##  Guía de Configuración Rápida

### 1. Preparar Supabase
1. Crea un proyecto en [supabase.com](https://supabase.com).
2. Asegúrate de tener creadas las tablas principales en el esquema público:
   * `registered_faces` (para los rostros biométricos guardados).
   * `detections` (para almacenar el historial de objetos detectados).
   * `recognition_sessions` (para el historial de reconocimiento facial).
3. Obtén la URL del proyecto, la Anon Key pública y la Service Role Key (clave secreta para omitir RLS en el backend).

### 2. Configurar el Backend (FastAPI)
1. Entra a la carpeta del backend:
   ```bash
   cd backend
   ```
2. Crea e inicia tu entorno virtual:
   ```bash
   python -m venv venv
   # En Windows:
   .\venv\Scripts\activate
   ```
3. Instala todas las dependencias:
   ```bash
   pip install -r requirements.txt
   ```
4. Edita tu archivo `.env` configurando tu URL de Supabase y tu **Service Role Key** para el correcto bypass de RLS:
   ```env
   SUPABASE_URL=https://tu-proyecto.supabase.co
   SUPABASE_KEY=tu-anon-key
   SUPABASE_SERVICE_KEY=tu-service-role-key-secreta
   ```
5. Inicia el servidor de desarrollo en la red local:
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```
   *El Swagger interactivo estará disponible en `http://localhost:8000/docs`.*

### 3. Configurar el Frontend (React Native / Expo)
1. Entra a la carpeta del frontend:
   ```bash
   cd frontend
   ```
2. Instala las dependencias de Node:
   ```bash
   npm install
   ```
3. Edita tu archivo `.env` apuntando a la **IP de red local** de tu computadora (no uses `localhost` ni `127.0.0.1` para que tu celular físico pueda conectarse):
   ```env
   EXPO_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
   EXPO_PUBLIC_API_URL=http://192.168.1.40:8000
   ```
4. Arranca la aplicación limpiando el caché de Metro:
   ```bash
   npx expo start --clear
   ```
5. Escanea el código QR desde tu teléfono celular utilizando la aplicación **Expo Go** (conectado a la misma red Wi-Fi).

---

##  Endpoints de la API Backend

| Método | Ruta | Descripción |
| :--- | :--- | :--- |
| **POST** | `/api/v1/auth/register` | Registro de usuario local |
| **POST** | `/api/v1/auth/login` | Login local ➔ Retorna JWT |
| **POST** | `/api/v1/detect/` | Procesar imagen con YOLOv8 (Detección de objetos) |
| **GET** | `/api/v1/detect/history` | Obtener historial de detecciones (Paginado de 10) |
| **GET** | `/api/v1/detect/classes` | Retorna el listado de las 80 clases detectables de COCO |
| **POST** | `/api/v1/faces/register` | Registrar un nuevo rostro biométrico en la base de datos |
| **POST** | `/api/v1/faces/recognize` | Comparar rostro fotografiado contra rostros registrados |
| **GET** | `/api/v1/faces/registered` | Listar todas las personas registradas biométricamente |
| **DELETE** | `/api/v1/faces/registered/{id}`| Eliminar un rostro del registro biométrico |
| **GET** | `/api/v1/faces/history` | Obtener historial de reconocimientos faciales |
| **GET** | `/health` | Chequeo de salud del backend |
