import requests
import json
import os
import time

BASE_URL = "http://127.0.0.1:8000"

# ==========================================
# CONFIGURACION DEL TEST
# ==========================================
# Cambia estas credenciales para probar
TEST_EMAIL = f"yolo_test_{int(time.time())}@gmail.com"
TEST_PASSWORD = "password123"
TEST_NAME = "Usuario de Prueba"

# Necesitas una imagen de prueba en la misma carpeta que este script
TEST_IMAGE_PATH = "test_image.jpg"

def main():
    print("=== INICIANDO PRUEBAS DE LA API ===\n")
    
    # 1. Registro de Usuario (Auth)
    print("1. Probando: POST /api/v1/auth/register")
    res = requests.post(f"{BASE_URL}/api/v1/auth/register", json={
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD,
        "full_name": TEST_NAME
    })
    print("Status:", res.status_code)
    print("Respuesta:", res.json())
    print("-" * 40)

    # Nota: Si el registro falla porque el usuario ya existe, continuamos al login
    
    # 2. Login (Auth)
    print("2. Probando: POST /api/v1/auth/login")
    res = requests.post(f"{BASE_URL}/api/v1/auth/login", json={
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD
    })
    print("Status:", res.status_code)
    if res.status_code != 200:
        print("Error en login. Revisa tus credenciales o base de datos de Supabase.")
        return
    
    login_data = res.json()
    token = login_data["access_token"]
    print("Token obtenido con éxito.")
    
    headers = {
        "Authorization": f"Bearer {token}"
    }
    print("-" * 40)

    # Verificar que exista la imagen para el resto de las pruebas
    if not os.path.exists(TEST_IMAGE_PATH):
        print(f"⚠️ ATENCIÓN: No se encontró la imagen '{TEST_IMAGE_PATH}' para continuar con las pruebas de YOLO.")
        print(f"Por favor, coloca una imagen jpg con ese nombre en la carpeta y vuelve a ejecutar.")
        return

    # 3. Listar Clases Soportadas
    print("3. Probando: GET /api/v1/detect/classes")
    res = requests.get(f"{BASE_URL}/api/v1/detect/classes")
    print("Status:", res.status_code)
    print(f"Clases soportadas: {res.json().get('total', 0)}")
    print("-" * 40)

    # 4. Detección de Objetos (YOLO)
    print("4. Probando: POST /api/v1/detect/")
    with open(TEST_IMAGE_PATH, "rb") as img_file:
        files = {"file": ("test_image.jpg", img_file, "image/jpeg")}
        data = {"confidence": 0.5, "max_results": 10}
        res = requests.post(f"{BASE_URL}/api/v1/detect/", headers=headers, files=files, data=data)
    print("Status:", res.status_code)
    print("Respuesta Detección:", json.dumps(res.json(), indent=2))
    print("-" * 40)
    
    # 5. Historial de Detecciones
    print("5. Probando: GET /api/v1/detect/history")
    res = requests.get(f"{BASE_URL}/api/v1/detect/history", headers=headers)
    print("Status:", res.status_code)
    print("Historial:", len(res.json()), "registros encontrados.")
    print("-" * 40)

    # 6. Registrar Rostro (DeepFace)
    print("6. Probando: POST /api/v1/faces/register")
    with open(TEST_IMAGE_PATH, "rb") as img_file:
        files = {"file": ("test_image.jpg", img_file, "image/jpeg")}
        data = {"person_name": "Persona de Prueba"}
        res = requests.post(f"{BASE_URL}/api/v1/faces/register", headers=headers, files=files, data=data)
    print("Status:", res.status_code)
    face_data = res.json()
    print("Respuesta Registro Rostro:", face_data)
    print("-" * 40)

    time.sleep(1) # Pequeña pausa para asegurar la escritura en DB

    # 7. Reconocimiento Facial (YOLO + DeepFace)
    print("7. Probando: POST /api/v1/faces/recognize")
    with open(TEST_IMAGE_PATH, "rb") as img_file:
        files = {"file": ("test_image.jpg", img_file, "image/jpeg")}
        res = requests.post(f"{BASE_URL}/api/v1/faces/recognize", headers=headers, files=files)
    print("Status:", res.status_code)
    print("Respuesta Reconocimiento:", json.dumps(res.json(), indent=2))
    print("-" * 40)

    # 8. Listar Rostros Registrados
    print("8. Probando: GET /api/v1/faces/registered")
    res = requests.get(f"{BASE_URL}/api/v1/faces/registered", headers=headers)
    print("Status:", res.status_code)
    registered_faces = res.json()
    print(f"Rostros registrados: {len(registered_faces)}")
    print("-" * 40)

    # Opcional: Eliminar el rostro que acabamos de registrar para limpiar
    if "face_id" in face_data:
        print("9. Probando: DELETE /api/v1/faces/registered/{face_id}")
        face_id = face_data["face_id"]
        res = requests.delete(f"{BASE_URL}/api/v1/faces/registered/{face_id}", headers=headers)
        print("Status:", res.status_code)
        print("Respuesta:", res.json())
        print("-" * 40)
    
    print("\n=== PRUEBAS FINALIZADAS ===")

if __name__ == "__main__":
    main()
